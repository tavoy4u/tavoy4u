from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from server import Piece, Square, Move, GameState, PieceColor, PieceRank

class JamaicanCheckersEngine:
    """Jamaican Checkers rules engine with multi-capture support"""
    
    @staticmethod
    def get_piece_at(board: List[Piece], square: Square) -> Optional[Piece]:
        """Get piece at a specific square"""
        for piece in board:
            if piece.square.row == square.row and piece.square.col == square.col:
                return piece
        return None
    
    @staticmethod
    def is_valid_square(square: Square) -> bool:
        """Check if square is within board bounds"""
        return 0 <= square.row < 8 and 0 <= square.col < 8
    
    @staticmethod
    def get_legal_moves(state: GameState, piece: Piece, only_captures: bool = False) -> List[Move]:
        """Get all legal moves for a piece"""
        moves = []
        directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        
        # REGULAR MOVES (non-capturing) - skip if only_captures is True
        if not only_captures:
            if piece.rank == PieceRank.KING:
                # FLYING KINGS: Can move multiple squares diagonally
                for dr, dc in directions:
                    for dist in range(1, 8):
                        new_row = piece.square.row + dr * dist
                        new_col = piece.square.col + dc * dist
                        
                        if not JamaicanCheckersEngine.is_valid_square(Square(row=new_row, col=new_col)):
                            break
                        
                        target_piece = JamaicanCheckersEngine.get_piece_at(
                            state.board, Square(row=new_row, col=new_col)
                        )
                        
                        if target_piece:
                            break
                        
                        moves.append(Move(
                            from_square=piece.square,
                            to_square=Square(row=new_row, col=new_col),
                            captured=[],
                            promotes=False
                        ))
            else:
                # MEN: Move only 1 square forward diagonally
                forward_dir = -1 if piece.color == PieceColor.RED else 1
                move_directions = [[forward_dir, -1], [forward_dir, 1]]
                
                for dr, dc in move_directions:
                    new_row = piece.square.row + dr
                    new_col = piece.square.col + dc
                    
                    if JamaicanCheckersEngine.is_valid_square(Square(row=new_row, col=new_col)):
                        if not JamaicanCheckersEngine.get_piece_at(state.board, Square(row=new_row, col=new_col)):
                            promotes = (piece.color == PieceColor.RED and new_row == 0) or \
                                     (piece.color == PieceColor.BLACK and new_row == 7)
                            
                            moves.append(Move(
                                from_square=piece.square,
                                to_square=Square(row=new_row, col=new_col),
                                captured=[],
                                promotes=promotes
                            ))
        
        # CAPTURE MOVES (TEK)
        for dr, dc in directions:
            if piece.rank == PieceRank.KING:
                # FLYING KINGS: Can tek from any distance and land anywhere beyond
                for cap_dist in range(1, 8):
                    cap_row = piece.square.row + dr * cap_dist
                    cap_col = piece.square.col + dc * cap_dist
                    
                    if not JamaicanCheckersEngine.is_valid_square(Square(row=cap_row, col=cap_col)):
                        break
                    
                    cap_piece = JamaicanCheckersEngine.get_piece_at(
                        state.board, Square(row=cap_row, col=cap_col)
                    )
                    
                    if cap_piece and cap_piece.color != piece.color:
                        # Try landing squares beyond the captured piece
                        for land_dist in range(1, 8):
                            land_row = cap_row + dr * land_dist
                            land_col = cap_col + dc * land_dist
                            
                            if not JamaicanCheckersEngine.is_valid_square(Square(row=land_row, col=land_col)):
                                break
                            
                            land_piece = JamaicanCheckersEngine.get_piece_at(
                                state.board, Square(row=land_row, col=land_col)
                            )
                            
                            if not land_piece:
                                moves.append(Move(
                                    from_square=piece.square,
                                    to_square=Square(row=land_row, col=land_col),
                                    captured=[Square(row=cap_row, col=cap_col)],
                                    promotes=False
                                ))
                            else:
                                break
                        break
                    elif cap_piece:
                        break
            else:
                # MEN: Can tek in all directions, land EXACTLY 2 squares away
                mid_row = piece.square.row + dr
                mid_col = piece.square.col + dc
                land_row = piece.square.row + 2 * dr
                land_col = piece.square.col + 2 * dc
                
                if JamaicanCheckersEngine.is_valid_square(Square(row=land_row, col=land_col)):
                    mid_piece = JamaicanCheckersEngine.get_piece_at(
                        state.board, Square(row=mid_row, col=mid_col)
                    )
                    land_piece = JamaicanCheckersEngine.get_piece_at(
                        state.board, Square(row=land_row, col=land_col)
                    )
                    
                    if mid_piece and mid_piece.color != piece.color and not land_piece:
                        promotes = (piece.color == PieceColor.RED and land_row == 0) or \
                                 (piece.color == PieceColor.BLACK and land_row == 7)
                        
                        moves.append(Move(
                            from_square=piece.square,
                            to_square=Square(row=land_row, col=land_col),
                            captured=[Square(row=mid_row, col=mid_col)],
                            promotes=promotes
                        ))
        
        return moves
    
    @staticmethod
    def get_all_legal_moves(state: GameState) -> List[Move]:
        """Get all legal moves for current player with forced capture rule"""
        all_moves = []
        capture_moves = []
        
        for piece in state.board:
            if piece.color == state.turn:
                moves = JamaicanCheckersEngine.get_legal_moves(state, piece)
                for move in moves:
                    if move.captured:
                        capture_moves.append(move)
                    else:
                        all_moves.append(move)
        
        # JAMAICAN RULE: Must take maximum captures
        if capture_moves:
            max_captures = max(len(m.captured) for m in capture_moves)
            return [m for m in capture_moves if len(m.captured) == max_captures]
        
        return all_moves
    
    @staticmethod
    def apply_move_partial(state: GameState, move: Move) -> tuple[GameState, bool]:
        """
        Apply a single capture in a multi-capture chain.
        Returns: (new_state, has_more_captures)
        """
        new_board = [Piece(**p.dict()) for p in state.board]
        
        # Find and move the piece
        piece_to_move = None
        for piece in new_board:
            if piece.square.row == move.from_square.row and piece.square.col == move.from_square.col:
                piece_to_move = piece
                piece.square = move.to_square
                
                # Promote if needed
                if move.promotes:
                    piece.rank = PieceRank.KING
                break
        
        # Remove captured pieces
        if move.captured:
            new_board = [p for p in new_board if not any(
                p.square.row == cap.row and p.square.col == cap.col 
                for cap in move.captured
            )]
        
        # Create intermediate state
        intermediate_state = GameState(
            id=state.id,
            room_code=state.room_code,
            board=new_board,
            turn=state.turn,  # Don't switch turn yet!
            history=state.history + [move],
            winner=None,
            red_player=state.red_player,
            black_player=state.black_player,
            mode=state.mode
        )
        
        # Check if more captures available from new position
        if piece_to_move and move.captured:
            updated_piece = Piece(
                id=piece_to_move.id,
                color=piece_to_move.color,
                rank=PieceRank.KING if move.promotes else piece_to_move.rank,
                square=move.to_square
            )
            further_captures = JamaicanCheckersEngine.get_legal_moves(
                intermediate_state, updated_piece, only_captures=True
            )
            
            if further_captures:
                # More captures available - set capturing_piece
                intermediate_state.capturing_piece = move.to_square
                return intermediate_state, True
        
        # No more captures - switch turn
        intermediate_state.turn = PieceColor.BLACK if state.turn == PieceColor.RED else PieceColor.RED
        intermediate_state.winner = JamaicanCheckersEngine.check_winner(intermediate_state)
        intermediate_state.capturing_piece = None
        
        return intermediate_state, False
    
    @staticmethod
    def apply_move(state: GameState, move: Move) -> GameState:
        """Apply a move and return new state"""
        new_state, _ = JamaicanCheckersEngine.apply_move_partial(state, move)
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
        legal_moves = JamaicanCheckersEngine.get_all_legal_moves(state)
        if not legal_moves:
            return PieceColor.BLACK if state.turn == PieceColor.RED else PieceColor.RED
        
        return None
