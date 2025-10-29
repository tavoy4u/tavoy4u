import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 32, 500);
const SQUARE_SIZE = BOARD_SIZE / 8;

type PieceColor = 'red' | 'black';
type PieceRank = 'man' | 'king';

interface Square {
  row: number;
  col: number;
}

interface Piece {
  id: string;
  color: PieceColor;
  rank: PieceRank;
  square: Square;
}

interface Move {
  from_square: Square;
  to_square: Square;
  captured: Square[];
  promotes: boolean;
}

interface GameState {
  id: string;
  room_code: string;
  board: Piece[];
  turn: PieceColor;
  history: Move[];
  winner: PieceColor | null;
  red_player: string | null;
  black_player: string | null;
}

export default function GameScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const roomCode = params.room as string;
  const playerColor = params.color as PieceColor;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Try WebSocket first, fallback to polling if it fails
    loadInitialGameState();
    const wsAttempt = connectWebSocket();
    
    // If WebSocket doesn't connect in 3 seconds, start polling
    const fallbackTimer = setTimeout(() => {
      if (!connected && !wsRef.current) {
        console.log('WebSocket failed, switching to polling mode');
        startPolling();
      }
    }, 3000);
    
    return () => {
      clearTimeout(fallbackTimer);
      stopPolling();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomCode]);

  const loadInitialGameState = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/room/${roomCode}`);
      const data = await response.json();
      
      if (!data.error) {
        setGameState(data);
        setConnected(true);
      } else {
        Alert.alert('Error', 'Room not found');
      }
    } catch (err) {
      console.error('Error loading game state:', err);
      Alert.alert('Error', 'Failed to load game');
    }
  };

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = () => {
    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/room/${roomCode}`);
        const data = await response.json();
        
        if (!data.error) {
          setGameState(data);
          setConnected(true);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const connectWebSocket = () => {
    try {
      const wsUrl = BACKEND_URL?.replace('http', 'ws').replace('https', 'wss') || '';
      const ws = new WebSocket(`${wsUrl}/ws/${roomCode}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        stopPolling(); // Stop polling if WebSocket connects
        
        // Send join message
        ws.send(JSON.stringify({
          type: 'join',
          color: playerColor,
          player_id: `player_${Date.now()}`
        }));
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'game_state') {
          setGameState(message.data);
        } else if (message.type === 'player_joined') {
          console.log('Player joined:', message.data);
        } else if (message.type === 'error') {
          Alert.alert('Error', message.message);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        // Start polling as fallback
        startPolling();
      };
      
      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      startPolling();
    }
  };

  const calculateLegalMoves = (piece: Piece): Square[] => {
    if (!gameState || piece.color !== playerColor || gameState.turn !== playerColor) {
      return [];
    }

    const moves: Square[] = [];
    const directions: [number, number][] = piece.rank === 'king' 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'red' 
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    // Simple moves
    for (const [dr, dc] of directions) {
      const newRow = piece.square.row + dr;
      const newCol = piece.square.col + dc;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = gameState.board.find(
          p => p.square.row === newRow && p.square.col === newCol
        );
        
        if (!targetPiece) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    // Capture moves
    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const midRow = piece.square.row + dr;
      const midCol = piece.square.col + dc;
      const landRow = piece.square.row + 2 * dr;
      const landCol = piece.square.col + 2 * dc;
      
      if (landRow >= 0 && landRow < 8 && landCol >= 0 && landCol < 8) {
        const midPiece = gameState.board.find(
          p => p.square.row === midRow && p.square.col === midCol
        );
        const landPiece = gameState.board.find(
          p => p.square.row === landRow && p.square.col === landCol
        );
        
        if (midPiece && midPiece.color !== piece.color && !landPiece) {
          moves.push({ row: landRow, col: landCol });
        }
      }
    }

    return moves;
  };

  const handleSquarePress = (row: number, col: number) => {
    if (!gameState || gameState.winner || gameState.turn !== playerColor) {
      return;
    }

    // Check if clicking on own piece
    const clickedPiece = gameState.board.find(
      p => p.square.row === row && p.square.col === col && p.color === playerColor
    );

    if (clickedPiece) {
      setSelectedPiece(clickedPiece);
      setLegalMoves(calculateLegalMoves(clickedPiece));
      return;
    }

    // Check if clicking on legal move
    if (selectedPiece) {
      const isLegalMove = legalMoves.some(m => m.row === row && m.col === col);
      
      if (isLegalMove) {
        makeMove(selectedPiece, { row, col });
      }
      
      setSelectedPiece(null);
      setLegalMoves([]);
    }
  };

  const makeMove = (piece: Piece, toSquare: Square) => {
    if (!wsRef.current || !gameState) return;

    const captured: Square[] = [];
    const rowDiff = toSquare.row - piece.square.row;
    const colDiff = toSquare.col - piece.square.col;

    // Check if it's a capture
    if (Math.abs(rowDiff) === 2) {
      const capturedRow = piece.square.row + rowDiff / 2;
      const capturedCol = piece.square.col + colDiff / 2;
      captured.push({ row: capturedRow, col: capturedCol });
    }

    // Check if promotes
    const promotes = 
      piece.rank === 'man' &&
      ((piece.color === 'red' && toSquare.row === 0) ||
       (piece.color === 'black' && toSquare.row === 7));

    const move: Move = {
      from_square: piece.square,
      to_square: toSquare,
      captured,
      promotes
    };

    wsRef.current.send(JSON.stringify({
      type: 'move',
      data: move
    }));
  };

  const renderSquare = (row: number, col: number) => {
    const isDark = (row + col) % 2 === 1;
    const piece = gameState?.board.find(p => p.square.row === row && p.square.col === col);
    const isSelected = selectedPiece?.square.row === row && selectedPiece?.square.col === col;
    const isLegalMove = legalMoves.some(m => m.row === row && m.col === col);

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.square,
          isDark ? styles.darkSquare : styles.lightSquare,
          isSelected && styles.selectedSquare,
          isLegalMove && styles.legalMoveSquare,
        ]}
        onPress={() => handleSquarePress(row, col)}
      >
        {piece && (
          <View style={[
            styles.piece,
            piece.color === 'red' ? styles.redPiece : styles.blackPiece,
            piece.rank === 'king' && styles.kingPiece,
          ]}>
            {piece.rank === 'king' && (
              <Text style={styles.crownIcon}>👑</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderBoard = () => {
    const rows = [];
    for (let row = 0; row < 8; row++) {
      const squares = [];
      for (let col = 0; col < 8; col++) {
        squares.push(renderSquare(row, col));
      }
      rows.push(
        <View key={row} style={styles.row}>
          {squares}
        </View>
      );
    }
    return rows;
  };

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Connecting to game...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusBar}>
          <Text style={styles.roomCode}>Room: {roomCode}</Text>
          <View style={[styles.statusIndicator, connected ? styles.connected : styles.disconnected]} />
        </View>
        
        <Text style={styles.turnText}>
          {gameState.winner 
            ? `🏆 ${gameState.winner.toUpperCase()} WINS!`
            : `${gameState.turn === playerColor ? 'YOUR' : "OPPONENT'S"} TURN`
          }
        </Text>
        
        <View style={styles.playerInfo}>
          <View style={[styles.colorIndicator, styles.redIndicator]} />
          <Text style={styles.playerText}>You are {playerColor.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {renderBoard()}
        </View>
      </View>

      <View style={styles.footer}>
        {gameState.winner && (
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/')}
          >
            <Text style={styles.buttonText}>🏠 Back to Home</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#45B7D1',
    paddingTop: 50,
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 2,
    borderBottomColor: '#4ECDC4',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#F44336',
  },
  turnText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  redIndicator: {
    backgroundColor: '#FF6B6B',
  },
  playerText: {
    fontSize: 16,
    color: '#666',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderWidth: 4,
    borderColor: '#8B4513',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightSquare: {
    backgroundColor: '#F0D9B5',
  },
  darkSquare: {
    backgroundColor: '#B58863',
  },
  selectedSquare: {
    backgroundColor: '#7FDBFF',
  },
  legalMoveSquare: {
    backgroundColor: '#98FB98',
  },
  piece: {
    width: SQUARE_SIZE * 0.7,
    height: SQUARE_SIZE * 0.7,
    borderRadius: SQUARE_SIZE * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  redPiece: {
    backgroundColor: '#FF6B6B',
  },
  blackPiece: {
    backgroundColor: '#2C3E50',
  },
  kingPiece: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  crownIcon: {
    fontSize: SQUARE_SIZE * 0.4,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
