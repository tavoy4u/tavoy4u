#!/usr/bin/env python3
"""
Comprehensive Backend Tests for Island Checkers Game
Tests API endpoints, WebSocket functionality, and game engine logic
"""

import requests
import websocket
import json
import time
import threading
from typing import Dict, List, Optional
import sys
import os

# Backend URL from environment
BACKEND_URL = "https://bt-boardgame.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"
WS_BASE = BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://")

class TestResults:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0
    
    def add_result(self, test_name: str, passed: bool, message: str = ""):
        self.results.append({
            "test": test_name,
            "passed": passed,
            "message": message
        })
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"    {message}")
    
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {self.passed + self.failed}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {(self.passed/(self.passed + self.failed)*100):.1f}%")
        
        if self.failed > 0:
            print(f"\nFAILED TESTS:")
            for result in self.results:
                if not result["passed"]:
                    print(f"  - {result['test']}: {result['message']}")

class CheckersBackendTester:
    def __init__(self):
        self.results = TestResults()
        self.room_code = None
        self.ws_messages = []
        self.ws_connected = False
        
    def test_health_check(self):
        """Test GET /api/ - Health check endpoint"""
        try:
            response = requests.get(f"{API_BASE}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Checkers" in data["message"]:
                    self.results.add_result("Health Check API", True, f"Response: {data}")
                else:
                    self.results.add_result("Health Check API", False, f"Unexpected response format: {data}")
            else:
                self.results.add_result("Health Check API", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.results.add_result("Health Check API", False, f"Request failed: {str(e)}")
    
    def test_create_room(self):
        """Test POST /api/create-room - Create new game room"""
        try:
            response = requests.post(f"{API_BASE}/create-room", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "room_code" in data:
                    room_code = data["room_code"]
                    # Validate room code format (6 characters, uppercase)
                    if len(room_code) == 6 and room_code.isupper() and room_code.isalnum():
                        self.room_code = room_code
                        self.results.add_result("Create Room API", True, f"Room created: {room_code}")
                    else:
                        self.results.add_result("Create Room API", False, f"Invalid room code format: {room_code}")
                else:
                    self.results.add_result("Create Room API", False, f"Missing room_code in response: {data}")
            else:
                self.results.add_result("Create Room API", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.results.add_result("Create Room API", False, f"Request failed: {str(e)}")
    
    def test_get_room_state(self):
        """Test GET /api/room/{room_code} - Get game state"""
        if not self.room_code:
            self.results.add_result("Get Room State API", False, "No room code available from create room test")
            return
            
        try:
            response = requests.get(f"{API_BASE}/room/{self.room_code}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate game state structure
                required_fields = ["id", "room_code", "board", "turn", "history", "winner"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.results.add_result("Get Room State API", False, f"Missing fields: {missing_fields}")
                    return
                
                # Validate board setup
                board = data["board"]
                if len(board) == 24:  # 12 pieces per player
                    red_pieces = [p for p in board if p["color"] == "red"]
                    black_pieces = [p for p in board if p["color"] == "black"]
                    
                    if len(red_pieces) == 12 and len(black_pieces) == 12:
                        # Check piece positions
                        red_rows = [p["square"]["row"] for p in red_pieces]
                        black_rows = [p["square"]["row"] for p in black_pieces]
                        
                        if all(row in [5, 6, 7] for row in red_rows) and all(row in [0, 1, 2] for row in black_rows):
                            # Check turn starts with RED
                            if data["turn"] == "red":
                                self.results.add_result("Get Room State API", True, f"Valid game state retrieved")
                            else:
                                self.results.add_result("Get Room State API", False, f"Turn should start with RED, got: {data['turn']}")
                        else:
                            self.results.add_result("Get Room State API", False, f"Invalid piece positions - Red rows: {set(red_rows)}, Black rows: {set(black_rows)}")
                    else:
                        self.results.add_result("Get Room State API", False, f"Wrong piece count - Red: {len(red_pieces)}, Black: {len(black_pieces)}")
                else:
                    self.results.add_result("Get Room State API", False, f"Expected 24 pieces, got {len(board)}")
            else:
                self.results.add_result("Get Room State API", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.results.add_result("Get Room State API", False, f"Request failed: {str(e)}")
    
    def test_invalid_room(self):
        """Test GET /api/room/{invalid_code} - Invalid room handling"""
        try:
            response = requests.get(f"{API_BASE}/room/INVALID", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "error" in data:
                    self.results.add_result("Invalid Room Handling", True, f"Correctly returned error: {data['error']}")
                else:
                    self.results.add_result("Invalid Room Handling", False, f"Should return error for invalid room")
            else:
                self.results.add_result("Invalid Room Handling", False, f"Unexpected status code: {response.status_code}")
                
        except Exception as e:
            self.results.add_result("Invalid Room Handling", False, f"Request failed: {str(e)}")
    
    def on_ws_message(self, ws, message):
        """WebSocket message handler"""
        try:
            data = json.loads(message)
            self.ws_messages.append(data)
            print(f"WS Received: {data.get('type', 'unknown')}")
        except Exception as e:
            print(f"WS Message parse error: {e}")
    
    def on_ws_error(self, ws, error):
        """WebSocket error handler"""
        self.last_ws_error = str(error)
        print(f"WS Error: {error}")
    
    def on_ws_close(self, ws, close_status_code, close_msg):
        """WebSocket close handler"""
        self.ws_connected = False
        print("WS Connection closed")
    
    def on_ws_open(self, ws):
        """WebSocket open handler"""
        self.ws_connected = True
        print("WS Connection opened")
    
    def test_websocket_connection(self):
        """Test WebSocket connection and basic messaging"""
        if not self.room_code:
            self.results.add_result("WebSocket Connection", False, "No room code available")
            return
        
        try:
            ws_url = f"{WS_BASE}/ws/{self.room_code}"
            print(f"Connecting to WebSocket: {ws_url}")
            
            # Create WebSocket connection
            ws = websocket.WebSocketApp(
                ws_url,
                on_message=self.on_ws_message,
                on_error=self.on_ws_error,
                on_close=self.on_ws_close,
                on_open=self.on_ws_open
            )
            
            # Run WebSocket in thread
            ws_thread = threading.Thread(target=ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
            # Wait for connection
            timeout = 10
            while not self.ws_connected and timeout > 0:
                time.sleep(0.1)
                timeout -= 0.1
            
            if not self.ws_connected:
                # Check if this is the known Kubernetes ingress WebSocket issue
                if "502 Bad Gateway" in str(self.ws_messages) or "502" in str(getattr(self, 'last_ws_error', '')):
                    self.results.add_result("WebSocket Connection", False, "Infrastructure issue: Kubernetes ingress not configured for WebSocket upgrades (502 Bad Gateway). WebSocket code appears correct but requires ingress configuration.")
                else:
                    self.results.add_result("WebSocket Connection", False, "Failed to establish connection")
                return
            
            # Test JOIN message
            join_message = {
                "type": "join",
                "color": "red",
                "player_id": "test_player_red"
            }
            ws.send(json.dumps(join_message))
            time.sleep(0.5)
            
            # Test another JOIN message
            join_message2 = {
                "type": "join", 
                "color": "black",
                "player_id": "test_player_black"
            }
            ws.send(json.dumps(join_message2))
            time.sleep(0.5)
            
            # Check if we received initial game state and join confirmations
            game_state_received = any(msg.get("type") == "game_state" for msg in self.ws_messages)
            player_joined_received = any(msg.get("type") == "player_joined" for msg in self.ws_messages)
            
            if game_state_received:
                self.results.add_result("WebSocket Connection", True, f"Successfully connected and received {len(self.ws_messages)} messages")
            else:
                self.results.add_result("WebSocket Connection", False, f"Connected but no game_state message received. Messages: {[m.get('type') for m in self.ws_messages]}")
            
            # Test move message
            self.test_websocket_move(ws)
            
            ws.close()
            
        except Exception as e:
            self.results.add_result("WebSocket Connection", False, f"Connection failed: {str(e)}")
    
    def test_websocket_move(self, ws):
        """Test WebSocket move messaging"""
        try:
            # Find a red piece that can move (should be on rows 5-7)
            game_state_msg = None
            for msg in self.ws_messages:
                if msg.get("type") == "game_state":
                    game_state_msg = msg
                    break
            
            if not game_state_msg:
                self.results.add_result("WebSocket Move Test", False, "No game state available for move test")
                return
            
            board = game_state_msg["data"]["board"]
            red_pieces = [p for p in board if p["color"] == "red"]
            
            # Find a piece that can move forward
            moveable_piece = None
            for piece in red_pieces:
                row, col = piece["square"]["row"], piece["square"]["col"]
                # Try to move diagonally forward (up for red)
                new_positions = [
                    {"row": row - 1, "col": col - 1},
                    {"row": row - 1, "col": col + 1}
                ]
                
                for new_pos in new_positions:
                    if 0 <= new_pos["row"] < 8 and 0 <= new_pos["col"] < 8:
                        # Check if target square is empty
                        occupied = any(p["square"]["row"] == new_pos["row"] and p["square"]["col"] == new_pos["col"] for p in board)
                        if not occupied and (new_pos["row"] + new_pos["col"]) % 2 == 1:  # Dark square
                            moveable_piece = piece
                            target_square = new_pos
                            break
                
                if moveable_piece:
                    break
            
            if not moveable_piece:
                self.results.add_result("WebSocket Move Test", False, "No moveable red piece found")
                return
            
            # Send move message
            move_message = {
                "type": "move",
                "data": {
                    "from_square": moveable_piece["square"],
                    "to_square": target_square,
                    "captured": [],
                    "promotes": False
                }
            }
            
            initial_msg_count = len(self.ws_messages)
            ws.send(json.dumps(move_message))
            time.sleep(1)
            
            # Check if move was processed
            new_messages = self.ws_messages[initial_msg_count:]
            move_processed = any(msg.get("type") == "game_state" for msg in new_messages)
            error_received = any(msg.get("type") == "error" for msg in new_messages)
            
            if move_processed:
                self.results.add_result("WebSocket Move Test", True, "Move successfully processed and broadcasted")
            elif error_received:
                error_msg = next(msg for msg in new_messages if msg.get("type") == "error")
                self.results.add_result("WebSocket Move Test", False, f"Move rejected: {error_msg.get('message')}")
            else:
                self.results.add_result("WebSocket Move Test", False, "No response to move message")
                
        except Exception as e:
            self.results.add_result("WebSocket Move Test", False, f"Move test failed: {str(e)}")
    
    def test_game_engine_logic(self):
        """Test game engine logic validation"""
        try:
            # Create a room to test with
            response = requests.post(f"{API_BASE}/create-room", timeout=10)
            if response.status_code != 200:
                self.results.add_result("Game Engine Logic", False, "Could not create test room")
                return
            
            test_room = response.json()["room_code"]
            
            # Get initial state
            response = requests.get(f"{API_BASE}/room/{test_room}", timeout=10)
            if response.status_code != 200:
                self.results.add_result("Game Engine Logic", False, "Could not get test room state")
                return
            
            game_state = response.json()
            
            # Test 1: Initial board setup
            board = game_state["board"]
            red_pieces = [p for p in board if p["color"] == "red"]
            black_pieces = [p for p in board if p["color"] == "black"]
            
            # Verify piece counts
            if len(red_pieces) != 12 or len(black_pieces) != 12:
                self.results.add_result("Game Engine - Initial Setup", False, f"Wrong piece count: Red={len(red_pieces)}, Black={len(black_pieces)}")
                return
            
            # Verify piece positions
            red_rows = set(p["square"]["row"] for p in red_pieces)
            black_rows = set(p["square"]["row"] for p in black_pieces)
            
            if red_rows != {5, 6, 7}:
                self.results.add_result("Game Engine - Initial Setup", False, f"Red pieces not on rows 5-7: {red_rows}")
                return
            
            if black_rows != {0, 1, 2}:
                self.results.add_result("Game Engine - Initial Setup", False, f"Black pieces not on rows 0-2: {black_rows}")
                return
            
            # Verify pieces only on dark squares
            for piece in board:
                row, col = piece["square"]["row"], piece["square"]["col"]
                if (row + col) % 2 != 1:
                    self.results.add_result("Game Engine - Initial Setup", False, f"Piece on light square: ({row}, {col})")
                    return
            
            # Verify turn starts with RED
            if game_state["turn"] != "red":
                self.results.add_result("Game Engine - Initial Setup", False, f"Turn should start with RED, got: {game_state['turn']}")
                return
            
            # Verify all pieces are MAN rank initially
            for piece in board:
                if piece["rank"] != "man":
                    self.results.add_result("Game Engine - Initial Setup", False, f"Initial piece should be MAN, got: {piece['rank']}")
                    return
            
            # Verify game state structure
            required_fields = ["id", "room_code", "board", "turn", "history", "winner", "created_at"]
            missing_fields = [field for field in required_fields if field not in game_state]
            if missing_fields:
                self.results.add_result("Game Engine - State Structure", False, f"Missing fields: {missing_fields}")
                return
            
            # Verify initial game state values
            if game_state["history"] != []:
                self.results.add_result("Game Engine - Initial State", False, f"History should be empty initially, got: {game_state['history']}")
                return
            
            if game_state["winner"] is not None:
                self.results.add_result("Game Engine - Initial State", False, f"Winner should be None initially, got: {game_state['winner']}")
                return
            
            if game_state["red_player"] is not None or game_state["black_player"] is not None:
                self.results.add_result("Game Engine - Initial State", False, f"Players should be None initially")
                return
            
            self.results.add_result("Game Engine - Initial Setup", True, "All initial setup validations passed")
            self.results.add_result("Game Engine - State Structure", True, "Game state structure is correct")
            self.results.add_result("Game Engine - Initial State", True, "Initial game state values are correct")
            
        except Exception as e:
            self.results.add_result("Game Engine Logic", False, f"Engine test failed: {str(e)}")
    
    def test_board_validation(self):
        """Test board position validation logic"""
        try:
            # Create a room to test with
            response = requests.post(f"{API_BASE}/create-room", timeout=10)
            if response.status_code != 200:
                self.results.add_result("Board Validation", False, "Could not create test room")
                return
            
            test_room = response.json()["room_code"]
            response = requests.get(f"{API_BASE}/room/{test_room}", timeout=10)
            game_state = response.json()
            board = game_state["board"]
            
            # Test dark square validation
            dark_squares = []
            light_squares = []
            for row in range(8):
                for col in range(8):
                    if (row + col) % 2 == 1:
                        dark_squares.append((row, col))
                    else:
                        light_squares.append((row, col))
            
            # Verify all pieces are on dark squares
            piece_positions = [(p["square"]["row"], p["square"]["col"]) for p in board]
            for pos in piece_positions:
                if pos not in dark_squares:
                    self.results.add_result("Board Validation - Dark Squares", False, f"Piece found on light square: {pos}")
                    return
            
            # Verify no pieces on light squares
            for pos in light_squares:
                if pos in piece_positions:
                    self.results.add_result("Board Validation - Light Squares", False, f"Piece incorrectly placed on light square: {pos}")
                    return
            
            # Verify middle rows are empty (rows 3 and 4)
            middle_pieces = [p for p in board if p["square"]["row"] in [3, 4]]
            if middle_pieces:
                self.results.add_result("Board Validation - Middle Rows", False, f"Found pieces in middle rows: {[(p['square']['row'], p['square']['col']) for p in middle_pieces]}")
                return
            
            self.results.add_result("Board Validation", True, "Board position validation passed")
            
        except Exception as e:
            self.results.add_result("Board Validation", False, f"Board validation test failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("Starting Island Checkers Backend Tests")
        print("="*60)
        
        # API Tests
        self.test_health_check()
        self.test_create_room()
        self.test_get_room_state()
        self.test_invalid_room()
        
        # WebSocket Tests
        self.test_websocket_connection()
        
        # Game Engine Tests
        self.test_game_engine_logic()
        self.test_board_validation()
        
        # Print results
        self.results.print_summary()
        
        return self.results.failed == 0

def main():
    """Main test runner"""
    print(f"Testing backend at: {BACKEND_URL}")
    print(f"API Base: {API_BASE}")
    print(f"WebSocket Base: {WS_BASE}")
    print()
    
    tester = CheckersBackendTester()
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())