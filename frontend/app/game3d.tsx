import React, { useState, useEffect, useRef, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Canvas, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width, height } = Dimensions.get('window');

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
  mode: string;
  red_class: string;
  black_class: string;
}

// 3D Board Component
function Board3D({ gameState, onSquareClick, selectedPiece, legalMoves }: any) {
  const SQUARE_SIZE = 1;
  const BOARD_OFFSET = -3.5;
  
  // Load DBZ textures for black pieces
  const dbzManTexture = new THREE.TextureLoader().load(require('../assets/pieces/dbz-man.png'));
  const dbzKingTexture = new THREE.TextureLoader().load(require('../assets/pieces/dbz-king.png'));
  
  return (
    <group>
      {/* Board Base */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[8.5, 0.3, 8.5]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Board Squares */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => {
          const isDark = (row + col) % 2 === 1;
          const x = col * SQUARE_SIZE + BOARD_OFFSET;
          const z = row * SQUARE_SIZE + BOARD_OFFSET;
          const isLegalMove = legalMoves.some((m: Square) => m.row === row && m.col === col);
          const isSelected = selectedPiece?.square.row === row && selectedPiece?.square.col === col;
          
          return (
            <mesh
              key={`square-${row}-${col}`}
              position={[x, 0, z]}
              receiveShadow
              onClick={() => onSquareClick(row, col)}
            >
              <boxGeometry args={[SQUARE_SIZE - 0.05, 0.1, SQUARE_SIZE - 0.05]} />
              <meshStandardMaterial 
                color={
                  isSelected ? '#FFD700' :
                  isLegalMove ? '#98FB98' :
                  isDark ? '#B58863' : '#F0D9B5'
                }
              />
            </mesh>
          );
        })
      )}
      
      {/* Pieces */}
      {gameState.board.map((piece: Piece) => {
        const x = piece.square.col * SQUARE_SIZE + BOARD_OFFSET;
        const z = piece.square.row * SQUARE_SIZE + BOARD_OFFSET;
        const isKing = piece.rank === 'king';
        const isRed = piece.color === 'red';
        const isBlack = piece.color === 'black';
        
        return (
          <group key={piece.id} position={[x, 0.5, z]}>
            {/* Piece body */}
            <mesh castShadow onClick={() => onSquareClick(piece.square.row, piece.square.col)}>
              <cylinderGeometry args={[0.35, 0.35, 0.15, 32]} />
              <meshStandardMaterial 
                color={isRed ? '#FF6B6B' : '#2C3E50'}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
            
            {/* DBZ Character Sprite for BLACK pieces */}
            {isBlack && (
              <sprite position={[0, 0.7, 0]} scale={[0.9, 0.9, 1]}>
                <spriteMaterial 
                  map={isKing ? dbzKingTexture : dbzManTexture}
                  transparent={true}
                  opacity={1}
                />
              </sprite>
            )}
            
            {/* King crown for RED pieces only */}
            {isKing && isRed && (
              <mesh position={[0, 0.25, 0]} castShadow>
                <coneGeometry args={[0.2, 0.3, 8]} />
                <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default function Game3DScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const roomCode = params.room as string;
  const playerColor = params.color as PieceColor;
  const mode = (params.mode as string) || 'american';

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadInitialGameState();
    const wsAttempt = connectWebSocket();
    
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

  const startPolling = () => {
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
        stopPolling();
        
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
    const isJamaican = mode === 'jamaican';
    
    if (piece.rank === 'king' && isJamaican) {
      // Flying kings - can move multiple squares
      const directions: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of directions) {
        for (let dist = 1; dist < 8; dist++) {
          const newRow = piece.square.row + dr * dist;
          const newCol = piece.square.col + dc * dist;
          
          if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const targetPiece = gameState.board.find(
              p => p.square.row === newRow && p.square.col === newCol
            );
            
            if (targetPiece) break;
            moves.push({ row: newRow, col: newCol });
          } else break;
        }
      }
    } else {
      // Regular moves (1 square)
      const directions: [number, number][] = piece.rank === 'king' 
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : piece.color === 'red' 
          ? [[-1, -1], [-1, 1]]
          : [[1, -1], [1, 1]];

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

  const handleSquareClick = (row: number, col: number) => {
    if (!gameState || gameState.winner || gameState.turn !== playerColor) {
      return;
    }

    const clickedPiece = gameState.board.find(
      p => p.square.row === row && p.square.col === col && p.color === playerColor
    );

    if (clickedPiece) {
      setSelectedPiece(clickedPiece);
      setLegalMoves(calculateLegalMoves(clickedPiece));
      return;
    }

    if (selectedPiece) {
      const isLegalMove = legalMoves.some(m => m.row === row && m.col === col);
      
      if (isLegalMove) {
        makeMove(selectedPiece, { row, col });
      }
      
      setSelectedPiece(null);
      setLegalMoves([]);
    }
  };

  const makeMove = async (piece: Piece, toSquare: Square) => {
    if (!gameState) return;

    const captured: Square[] = [];
    const rowDiff = toSquare.row - piece.square.row;
    const colDiff = toSquare.col - piece.square.col;

    if (Math.abs(rowDiff) === 2) {
      const capturedRow = piece.square.row + rowDiff / 2;
      const capturedCol = piece.square.col + colDiff / 2;
      captured.push({ row: capturedRow, col: capturedCol });
    }

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

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'move',
        data: move
      }));
    } else {
      try {
        const response = await fetch(`${BACKEND_URL}/api/room/${roomCode}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(move)
        });
        
        const data = await response.json();
        
        if (data.error) {
          Alert.alert('Error', data.error);
        } else if (data.game_state) {
          setGameState(data.game_state);
        }
      } catch (err) {
        console.error('Move error:', err);
        Alert.alert('Error', 'Failed to make move');
      }
    }
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
        
        <Text style={styles.modeText}>
          🎮 {mode === 'jamaican' ? 'Jamaican' : 'American'} Checkers
        </Text>
        
        <Text style={styles.turnText}>
          {gameState.winner 
            ? `🏆 ${gameState.winner.toUpperCase()} WINS!`
            : `${gameState.turn === playerColor ? 'YOUR' : "OPPONENT'S"} TURN`
          }
        </Text>
        
        <View style={styles.playerInfo}>
          <Text style={[styles.playerText, playerColor === 'red' && styles.activePlayer]}>
            🔴 You ({playerColor.toUpperCase()})
          </Text>
          <Text style={styles.piecesCount}>
            Red: {gameState.board.filter(p => p.color === 'red').length} | 
            Black: {gameState.board.filter(p => p.color === 'black').length}
          </Text>
        </View>
      </View>

      <View style={styles.canvasContainer}>
        <Canvas
          shadows
          camera={{ 
            position: playerColor === 'black' ? [0, 10, -10] : [0, 10, 10], 
            fov: 50 
          }}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <pointLight position={[-10, 10, -5]} intensity={0.5} />
            
            <Board3D
              gameState={gameState}
              onSquareClick={handleSquareClick}
              selectedPiece={selectedPiece}
              legalMoves={legalMoves}
            />
          </Suspense>
        </Canvas>
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
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#FFFFFF',
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
  modeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  turnText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  playerInfo: {
    alignItems: 'center',
  },
  playerText: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  activePlayer: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  piecesCount: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  canvasContainer: {
    flex: 1,
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
    marginTop: 100,
  },
});
