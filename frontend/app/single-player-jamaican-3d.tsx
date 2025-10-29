import React, { useState, useEffect, useRef, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, PanResponder } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getPieceIcon, getPieceClass } from '../utils/pieceClasses';

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
  board: Piece[];
  turn: PieceColor;
  history: Move[];
  winner: PieceColor | null;
}

// 3D Board Component
function Board3D({ gameState, onSquareClick, selectedPiece, legalMoves, capturingPiece, playerClass, aiClass }: any) {
  const SQUARE_SIZE = 1;
  const BOARD_OFFSET = -3.5;
  
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
          const isCapturing = capturingPiece?.row === row && capturingPiece?.col === col;
          
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
                  isCapturing ? '#4CAF50' :
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
        
        return (
          <group key={piece.id} position={[x, 0.5, z]}>
            {/* Piece body */}
            <mesh castShadow onClick={() => onSquareClick(piece.square.row, piece.square.col)}>
              <cylinderGeometry args={[0.35, 0.35, isKing ? 0.3 : 0.2, 32]} />
              <meshStandardMaterial 
                color={piece.color === 'red' ? '#FF6B6B' : '#2C3E50'}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
            
            {/* King crown */}
            {isKing && (
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

// Jamaican Checkers AI Engine (same as before)
class JamaicanCheckersAI {
  static evaluateBoard(board: Piece[], color: PieceColor): number {
    let score = 0;
    for (const piece of board) {
      const value = piece.rank === 'king' ? 4 : 1;
      if (piece.color === color) {
        score += value;
        if (color === 'red') {
          score += (7 - piece.square.row) * 0.15;
        } else {
          score += piece.square.row * 0.15;
        }
      } else {
        score -= value;
      }
    }
    return score;
  }

  static findBestMove(state: GameState): Move | null {
    const legalMoves = this.getAllLegalMoves(state);
    if (legalMoves.length === 0) return null;
    
    let maxCaptures = 0;
    for (const move of legalMoves) {
      if (move.captured.length > maxCaptures) {
        maxCaptures = move.captured.length;
      }
    }
    
    const maxCaptureMoves = legalMoves.filter(m => m.captured.length === maxCaptures);
    const movesToConsider = maxCaptures > 0 ? maxCaptureMoves : legalMoves;
    
    let bestMove = movesToConsider[0];
    let bestScore = -Infinity;
    
    for (const move of movesToConsider) {
      const newState = this.applyMove(state, move);
      let score = this.evaluateBoard(newState.board, state.turn);
      score += move.captured.length * 3;
      if (move.promotes) score += 2;
      
      const opponentMoves = this.getAllLegalMoves(newState);
      if (opponentMoves.length === 0) {
        score += 100;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }

  static createInitialBoard(): Piece[] {
    const pieces: Piece[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          pieces.push({
            id: `black-${row}-${col}`,
            color: 'black',
            rank: 'man',
            square: { row, col }
          });
        }
      }
    }
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          pieces.push({
            id: `red-${row}-${col}`,
            color: 'red',
            rank: 'man',
            square: { row, col }
          });
        }
      }
    }
    return pieces;
  }

  static getPieceAt(board: Piece[], square: Square): Piece | null {
    return board.find(p => p.square.row === square.row && p.square.col === square.col) || null;
  }

  static getLegalMoves(state: GameState, piece: Piece, only_captures: boolean = false): Move[] {
    const moves: Move[] = [];
    const directions: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    
    // Regular moves (simplified for 3D demo)
    if (!only_captures && piece.rank === 'man') {
      const forwardDir = piece.color === 'red' ? -1 : 1;
      const moveDirections: [number, number][] = [[forwardDir, -1], [forwardDir, 1]];
      
      for (const [dr, dc] of moveDirections) {
        const newRow = piece.square.row + dr;
        const newCol = piece.square.col + dc;
        
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          if (!this.getPieceAt(state.board, { row: newRow, col: newCol })) {
            const promotes = (piece.color === 'red' && newRow === 0) || 
                           (piece.color === 'black' && newRow === 7);
            
            moves.push({
              from_square: piece.square,
              to_square: { row: newRow, col: newCol },
              captured: [],
              promotes
            });
          }
        }
      }
    }
    
    // Capture moves
    for (const [dr, dc] of directions) {
      const midRow = piece.square.row + dr;
      const midCol = piece.square.col + dc;
      const landRow = piece.square.row + 2 * dr;
      const landCol = piece.square.col + 2 * dc;
      
      if (landRow >= 0 && landRow < 8 && landCol >= 0 && landCol < 8) {
        const midPiece = this.getPieceAt(state.board, { row: midRow, col: midCol });
        const landPiece = this.getPieceAt(state.board, { row: landRow, col: landCol });
        
        if (midPiece && midPiece.color !== piece.color && !landPiece) {
          const promotes = (piece.color === 'red' && landRow === 0) || 
                         (piece.color === 'black' && landRow === 7);
          
          moves.push({
            from_square: piece.square,
            to_square: { row: landRow, col: landCol },
            captured: [{ row: midRow, col: midCol }],
            promotes
          });
        }
      }
    }

    return moves;
  }

  static getAllLegalMoves(state: GameState): Move[] {
    const allMoves: Move[] = [];
    const captureMoves: Move[] = [];
    
    for (const piece of state.board) {
      if (piece.color === state.turn) {
        const moves = this.getLegalMoves(state, piece);
        for (const move of moves) {
          if (move.captured.length > 0) {
            captureMoves.push(move);
          } else {
            allMoves.push(move);
          }
        }
      }
    }
    
    if (captureMoves.length > 0) {
      let maxCaptures = 0;
      for (const move of captureMoves) {
        if (move.captured.length > maxCaptures) {
          maxCaptures = move.captured.length;
        }
      }
      return captureMoves.filter(m => m.captured.length === maxCaptures);
    }
    
    return allMoves;
  }

  static applyMove(state: GameState, move: Move): GameState {
    const newBoard = state.board.map(p => ({ ...p, square: { ...p.square } }));
    
    const piece = newBoard.find(p => 
      p.square.row === move.from_square.row && p.square.col === move.from_square.col
    );
    
    if (piece) {
      piece.square = move.to_square;
      if (move.promotes) {
        piece.rank = 'king';
      }
    }
    
    const filteredBoard = newBoard.filter(p => 
      !move.captured.some(cap => p.square.row === cap.row && p.square.col === cap.col)
    );
    
    const newTurn = state.turn === 'red' ? 'black' : 'red';
    const winner = this.checkWinner({ ...state, board: filteredBoard, turn: newTurn });
    
    return {
      board: filteredBoard,
      turn: newTurn,
      history: [...state.history, move],
      winner
    };
  }

  static checkWinner(state: GameState): PieceColor | null {
    const redPieces = state.board.filter(p => p.color === 'red');
    const blackPieces = state.board.filter(p => p.color === 'black');
    
    if (redPieces.length === 0) return 'black';
    if (blackPieces.length === 0) return 'red';
    
    const legalMoves = this.getAllLegalMoves(state);
    if (legalMoves.length === 0) {
      return state.turn === 'red' ? 'black' : 'red';
    }
    
    return null;
  }
}

export default function Jamaican3DGame() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const playerClass = (params.class as string) || 'jamaican';
  const aiClass = 'european';
  
  const [gameState, setGameState] = useState<GameState>({
    board: JamaicanCheckersAI.createInitialBoard(),
    turn: 'red',
    history: [],
    winner: null
  });
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [thinking, setThinking] = useState(false);
  const [capturingPiece, setCapturingPiece] = useState<Square | null>(null);

  useEffect(() => {
    if (gameState.turn === 'black' && !gameState.winner) {
      makeAIMove();
    }
  }, [gameState.turn]);

  useEffect(() => {
    if (gameState.winner) {
      setTimeout(() => {
        Alert.alert(
          'Game Over!',
          `${gameState.winner === 'red' ? 'You Win! 🎉' : 'AI Wins! 🤖'}`,
          [
            { text: 'Play Again', onPress: resetGame },
            { text: 'Home', onPress: () => router.push('/') }
          ]
        );
      }, 500);
    }
  }, [gameState.winner]);

  const makeAIMove = async () => {
    setThinking(true);
    setTimeout(() => {
      const bestMove = JamaicanCheckersAI.findBestMove(gameState);
      if (bestMove) {
        const newState = JamaicanCheckersAI.applyMove(gameState, bestMove);
        setGameState(newState);
      }
      setThinking(false);
    }, 1200);
  };

  const resetGame = () => {
    setGameState({
      board: JamaicanCheckersAI.createInitialBoard(),
      turn: 'red',
      history: [],
      winner: null
    });
    setSelectedPiece(null);
    setLegalMoves([]);
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameState.winner || gameState.turn !== 'red' || thinking) return;

    const clickedPiece = gameState.board.find(
      p => p.square.row === row && p.square.col === col && p.color === 'red'
    );

    if (clickedPiece) {
      setSelectedPiece(clickedPiece);
      const moves = JamaicanCheckersAI.getLegalMoves(gameState, clickedPiece);
      setLegalMoves(moves.map(m => m.to_square));
      return;
    }

    if (selectedPiece) {
      const isLegalMove = legalMoves.some(m => m.row === row && m.col === col);
      
      if (isLegalMove) {
        const allMoves = JamaicanCheckersAI.getLegalMoves(gameState, selectedPiece);
        const move = allMoves.find(m => m.to_square.row === row && m.to_square.col === col);
        
        if (move) {
          const newState = JamaicanCheckersAI.applyMove(gameState, move);
          setGameState(newState);
        }
      }
      
      setSelectedPiece(null);
      setLegalMoves([]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🇯🇲 3D Jamaican Checkers</Text>
        
        <Text style={[styles.turnText, thinking && styles.thinkingText]}>
          {gameState.winner 
            ? `🏆 ${gameState.winner === 'red' ? 'YOU WIN!' : 'AI WINS!'}`
            : thinking
              ? '🤔 AI is thinking...'
              : gameState.turn === 'red' 
                ? '🎮 YOUR TURN' 
                : '⏳ AI Turn'
          }
        </Text>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            You: {gameState.board.filter(p => p.color === 'red').length}
          </Text>
          <Text style={styles.scoreText}>
            AI: {gameState.board.filter(p => p.color === 'black').length}
          </Text>
        </View>
      </View>

      <View style={styles.canvasContainer}>
        <Canvas
          shadows
          camera={{ position: [0, 10, 10], fov: 50 }}
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
              capturingPiece={capturingPiece}
              playerClass={playerClass}
              aiClass={aiClass}
            />
            
            <OrbitControls
              enablePan={false}
              minDistance={8}
              maxDistance={20}
              maxPolarAngle={Math.PI / 2.2}
            />
          </Suspense>
        </Canvas>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]}
          onPress={resetGame}
        >
          <Text style={styles.buttonText}>🔄 New Game</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.homeButton]}
          onPress={() => router.push('/')}
        >
          <Text style={styles.buttonText}>🏠 Home</Text>
        </TouchableOpacity>
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
    paddingTop: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  turnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  thinkingText: {
    color: '#FF6B6B',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  canvasContainer: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
  },
  homeButton: {
    backgroundColor: '#4ECDC4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
