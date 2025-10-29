from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Tuple
import uuid
from datetime import datetime
import json
import asyncio
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===== GAME ENGINE =====

class PieceColor(str, Enum):
    RED = "red"
    BLACK = "black"

class PieceRank(str, Enum):
    MAN = "man"
    KING = "king"

class Square(BaseModel):
    row: int
    col: int

    def __hash__(self):
        return hash((self.row, self.col))

    def __eq__(self, other):
        if isinstance(other, Square):
            return self.row == other.row and self.col == other.col
        return False

class Piece(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    color: PieceColor
    rank: PieceRank
    square: Square

class Move(BaseModel):
    from_square: Square
    to_square: Square
    captured: List[Square] = []
    promotes: bool = False

class GameState(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_code: str
    board: List[Piece]
    turn: PieceColor
    history: List[Move] = []
    winner: Optional[PieceColor] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    red_player: Optional[str] = None
    black_player: Optional[str] = None
    mode: str = "american"  # "american" or "jamaican"
    capturing_piece: Optional[Square] = None  # For multi-capture chains

# Import Jamaican engine after model definitions to avoid circular import
try:
    import jamaican_engine
    from jamaican_engine import JamaicanCheckersEngine
    JAMAICAN_ENGINE_AVAILABLE = True
    # Inject classes into jamaican_engine to resolve runtime dependencies
    jamaican_engine.Piece = Piece
    jamaican_engine.Square = Square
    jamaican_engine.Move = Move
    jamaican_engine.GameState = GameState
    jamaican_engine.PieceColor = PieceColor
    jamaican_engine.PieceRank = PieceRank
    logger.info("Jamaican engine loaded successfully")
except ImportError as e:
    JAMAICAN_ENGINE_AVAILABLE = False
    logger.warning(f"Jamaican engine not available: {e}")
except Exception as e:
    JAMAICAN_ENGINE_AVAILABLE = False
    logger.error(f"Error loading Jamaican engine: {e}")

class CheckersEngine:
    """American Checkers rules engine"""
    
    @staticmethod
    def create_initial_board() -> List[Piece]:
        """Create starting checkers position"""
        pieces = []
        
        # Black pieces (top, rows 0-2)
        for row in range(3):
            for col in range(8):
                if (row + col) % 2 == 1:  # Dark squares only
                    pieces.append(Piece(
                        color=PieceColor.BLACK,
                        rank=PieceRank.MAN,
                        square=Square(row=row, col=col)
                    ))
        
        # Red pieces (bottom, rows 5-7)
        for row in range(5, 8):
            for col in range(8):
                if (row + col) % 2 == 1:  # Dark squares only
                    pieces.append(Piece(
                        color=PieceColor.RED,
                        rank=PieceRank.MAN,
                        square=Square(row=row, col=col)
                    ))
        
        return pieces
    
    @staticmethod
    def get_piece_at(board: List[Piece], square: Square) -> Optional[Piece]:
        """Get piece at a specific square"""
        for piece in board:
            if piece.square == square:
                return piece
        return None
    
    @staticmethod
    def is_valid_square(square: Square) -> bool:
        """Check if square is within board bounds"""
        return 0 <= square.row < 8 and 0 <= square.col < 8
    
    @staticmethod
    def get_legal_moves(state: GameState, piece: Piece) -> List[Move]:
        """Get all legal moves for a piece"""
        moves = []
        
        # Direction based on color and rank
        if piece.rank == PieceRank.KING:
            directions = [(-1, -1), (-1, 1), (1, -1), (1, 1)]  # All diagonal
        elif piece.color == PieceColor.RED:
            directions = [(-1, -1), (-1, 1)]  # Move up
        else:  # BLACK
            directions = [(1, -1), (1, 1)]  # Move down
        
        # Check simple moves
        for dr, dc in directions:
            new_square = Square(row=piece.square.row + dr, col=piece.square.col + dc)
            if CheckersEngine.is_valid_square(new_square):
                target_piece = CheckersEngine.get_piece_at(state.board, new_square)
                if target_piece is None:
                    # Check if promotes
                    promotes = False
                    if piece.rank == PieceRank.MAN:
                        if piece.color == PieceColor.RED and new_square.row == 0:
                            promotes = True
                        elif piece.color == PieceColor.BLACK and new_square.row == 7:
                            promotes = True
                    
                    moves.append(Move(
                        from_square=piece.square,
                        to_square=new_square,
                        promotes=promotes
                    ))
        
        # Check capture moves
        capture_moves = CheckersEngine.get_capture_moves(state, piece)
        moves.extend(capture_moves)
        
        return moves
    
    @staticmethod
    def get_capture_moves(state: GameState, piece: Piece, current_square: Optional[Square] = None) -> List[Move]:
        """Get all capture moves for a piece (includes multi-jumps)"""
        if current_square is None:
            current_square = piece.square
        
        captures = []
        
        # Direction based on rank
        if piece.rank == PieceRank.KING:
            directions = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
        elif piece.color == PieceColor.RED:
            directions = [(-1, -1), (-1, 1), (1, -1), (1, 1)]  # Can capture in all directions
        else:  # BLACK
            directions = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for dr, dc in directions:
            # Square with opponent piece
            mid_square = Square(row=current_square.row + dr, col=current_square.col + dc)
            # Landing square
            land_square = Square(row=current_square.row + 2*dr, col=current_square.col + 2*dc)
            
            if not CheckersEngine.is_valid_square(land_square):
                continue
            
            mid_piece = CheckersEngine.get_piece_at(state.board, mid_square)
            land_piece = CheckersEngine.get_piece_at(state.board, land_square)
            
            # Valid capture: opponent piece in middle, empty landing
            if mid_piece and mid_piece.color != piece.color and land_piece is None:
                # Check if promotes
                promotes = False
                if piece.rank == PieceRank.MAN:
                    if piece.color == PieceColor.RED and land_square.row == 0:
                        promotes = True
                    elif piece.color == PieceColor.BLACK and land_square.row == 7:
                        promotes = True
                
                captures.append(Move(
                    from_square=piece.square,
                    to_square=land_square,
                    captured=[mid_square],
                    promotes=promotes
                ))
        
        return captures
    
    @staticmethod
    def get_all_legal_moves(state: GameState) -> List[Move]:
        """Get all legal moves for current player"""
        all_moves = []
        capture_moves = []
        
        for piece in state.board:
            if piece.color == state.turn:
                moves = CheckersEngine.get_legal_moves(state, piece)
                for move in moves:
                    if move.captured:
                        capture_moves.append(move)
                    else:
                        all_moves.append(move)
        
        # Forced capture rule
        if capture_moves:
            return capture_moves
        return all_moves
    
    @staticmethod
    def apply_move(state: GameState, move: Move) -> GameState:
        """Apply a move and return new state"""
        new_board = [p.model_copy(deep=True) for p in state.board]
        
        # Find and move the piece
        piece_to_move = None
        for i, piece in enumerate(new_board):
            if piece.square == move.from_square:
                piece_to_move = piece
                piece.square = move.to_square
                
                # Promote if needed
                if move.promotes:
                    piece.rank = PieceRank.KING
                break
        
        # Remove captured pieces
        for cap_square in move.captured:
            new_board = [p for p in new_board if p.square != cap_square]
        
        # Switch turn
        new_turn = PieceColor.BLACK if state.turn == PieceColor.RED else PieceColor.RED
        
        # Create new state
        new_state = state.model_copy(deep=True)
        new_state.board = new_board
        new_state.turn = new_turn
        new_state.history = state.history + [move]
        
        # Check for winner
        new_state.winner = CheckersEngine.check_winner(new_state)
        
        return new_state
    
    @staticmethod
    def check_winner(state: GameState) -> Optional[PieceColor]:
        """Check if there's a winner"""
        red_pieces = [p for p in state.board if p.color == PieceColor.RED]
        black_pieces = [p for p in state.board if p.color == PieceColor.BLACK]
        
        if not red_pieces:
            return PieceColor.BLACK
        if not black_pieces:
            return PieceColor.RED
        
        # Check if current player has any legal moves
        legal_moves = CheckersEngine.get_all_legal_moves(state)
        if not legal_moves:
            # Current player can't move, opponent wins
            return PieceColor.BLACK if state.turn == PieceColor.RED else PieceColor.RED
        
        return None

# ===== WEBSOCKET MANAGER =====

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}  # room_code -> [websockets]
        self.games: Dict[str, GameState] = {}  # room_code -> GameState
        self.player_to_room: Dict[str, str] = {}  # player_id -> room_code
    
    async def connect(self, websocket: WebSocket, room_code: str):
        await websocket.accept()
        if room_code not in self.active_connections:
            self.active_connections[room_code] = []
        self.active_connections[room_code].append(websocket)
        logger.info(f"Client connected to room {room_code}")
    
    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self.active_connections:
            self.active_connections[room_code].remove(websocket)
            if not self.active_connections[room_code]:
                del self.active_connections[room_code]
                if room_code in self.games:
                    del self.games[room_code]
        logger.info(f"Client disconnected from room {room_code}")
    
    async def broadcast(self, room_code: str, message: dict):
        if room_code in self.active_connections:
            for connection in self.active_connections[room_code]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to room {room_code}: {e}")
    
    def create_room(self, mode: str = "american") -> str:
        """Create a new game room with random code"""
        room_code = str(uuid.uuid4())[:6].upper()
        while room_code in self.games:
            room_code = str(uuid.uuid4())[:6].upper()
        
        # Initialize game
        game_state = GameState(
            room_code=room_code,
            board=CheckersEngine.create_initial_board(),
            turn=PieceColor.RED,
            mode=mode
        )
        self.games[room_code] = game_state
        logger.info(f"Created {mode} room {room_code}")
        return room_code
    
    def get_game(self, room_code: str) -> Optional[GameState]:
        return self.games.get(room_code)
    
    def update_game(self, room_code: str, game_state: GameState):
        self.games[room_code] = game_state

manager = ConnectionManager()

# ===== REST API ROUTES =====

@api_router.get("/")
async def root():
    return {"message": "Tropical Island Checkers API"}

@api_router.post("/create-room")
async def create_room(mode: str = "american"):
    room_code = manager.create_room(mode)
    return {"room_code": room_code}

@api_router.get("/room/{room_code}")
async def get_room(room_code: str):
    game = manager.get_game(room_code)
    if not game:
        return {"error": "Room not found"}
    return game.model_dump()

@api_router.post("/room/{room_code}/move")
async def make_move(room_code: str, move_data: dict):
    """REST API endpoint for making moves (fallback for when WebSocket fails)"""
    game = manager.get_game(room_code)
    
    if not game:
        return {"error": "Game not found"}
    
    if game.winner:
        return {"error": "Game already finished"}
    
    # Select the correct engine based on game mode
    if game.mode == "jamaican" and JAMAICAN_ENGINE_AVAILABLE:
        engine = JamaicanCheckersEngine
    else:
        engine = CheckersEngine
    
    try:
        # Parse move
        move = Move(
            from_square=Square(**move_data["from_square"]),
            to_square=Square(**move_data["to_square"]),
            captured=[Square(**sq) for sq in move_data.get("captured", [])],
            promotes=move_data.get("promotes", False)
        )
        
        # Validate move
        legal_moves = engine.get_all_legal_moves(game)
        is_valid = any(
            m.from_square == move.from_square and 
            m.to_square == move.to_square 
            for m in legal_moves
        )
        
        if not is_valid:
            return {"error": "Illegal move"}
        
        # Apply move
        new_game = engine.apply_move(game, move)
        manager.update_game(room_code, new_game)
        
        return {"success": True, "game_state": new_game.model_dump()}
    
    except Exception as e:
        logger.error(f"Move error: {e}")
        return {"error": str(e)}

# ===== WEBSOCKET ROUTE =====

@app.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str):
    await manager.connect(websocket, room_code)
    
    try:
        # Send initial game state
        game = manager.get_game(room_code)
        if game:
            await websocket.send_json({
                "type": "game_state",
                "data": json.loads(game.model_dump_json())
            })
        
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "move":
                move_data = data.get("data")
                game = manager.get_game(room_code)
                
                if not game:
                    await websocket.send_json({"type": "error", "message": "Game not found"})
                    continue
                
                if game.winner:
                    await websocket.send_json({"type": "error", "message": "Game already finished"})
                    continue
                
                # Select the correct engine based on game mode
                if game.mode == "jamaican" and JAMAICAN_ENGINE_AVAILABLE:
                    engine = JamaicanCheckersEngine
                else:
                    engine = CheckersEngine
                
                # Parse move
                move = Move(
                    from_square=Square(**move_data["from_square"]),
                    to_square=Square(**move_data["to_square"]),
                    captured=[Square(**sq) for sq in move_data.get("captured", [])],
                    promotes=move_data.get("promotes", False)
                )
                
                # Validate move
                legal_moves = engine.get_all_legal_moves(game)
                is_valid = any(
                    m.from_square == move.from_square and 
                    m.to_square == move.to_square 
                    for m in legal_moves
                )
                
                if not is_valid:
                    await websocket.send_json({"type": "error", "message": "Illegal move"})
                    continue
                
                # Apply move
                new_game = engine.apply_move(game, move)
                manager.update_game(room_code, new_game)
                
                # Broadcast new state
                await manager.broadcast(room_code, {
                    "type": "game_state",
                    "data": json.loads(new_game.model_dump_json())
                })
            
            elif message_type == "join":
                player_color = data.get("color")
                game = manager.get_game(room_code)
                if game:
                    if player_color == "red" and not game.red_player:
                        game.red_player = data.get("player_id")
                    elif player_color == "black" and not game.black_player:
                        game.black_player = data.get("player_id")
                    
                    manager.update_game(room_code, game)
                    await manager.broadcast(room_code, {
                        "type": "player_joined",
                        "data": {"color": player_color}
                    })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_code)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, room_code)

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
