import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';

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
  board: Piece[];
  turn: PieceColor;
  history: Move[];
  winner: PieceColor | null;
}

// Jamaican Checkers AI Engine
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
    
    // JAMAICAN RULE: Maximum capture - must take move with most captures
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

  // JAMAICAN RULES: Flying Kings + Multiple Tek (Captures) for all pieces
  static getLegalMoves(state: GameState, piece: Piece): Move[] {
    const moves: Move[] = [];
    const directions: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    
    // REGULAR MOVES (non-capturing)
    if (piece.rank === 'king') {
      // FLYING KINGS: Can move multiple squares diagonally
      for (const [dr, dc] of directions) {
        for (let dist = 1; dist < 8; dist++) {
          const newRow = piece.square.row + dr * dist;
          const newCol = piece.square.col + dc * dist;
          
          if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
          
          const targetPiece = this.getPieceAt(state.board, { row: newRow, col: newCol });
          
          if (targetPiece) break; // Can't jump over pieces in regular moves
          
          moves.push({
            from_square: piece.square,
            to_square: { row: newRow, col: newCol },
            captured: [],
            promotes: false
          });
        }
      }
    } else {
      // MEN: Move only 1 square forward diagonally
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
    
    // TEK MOVES (Captures) - ALL pieces can tek, kings can tek from distance
    for (const [dr, dc] of directions) {
      if (piece.rank === 'king') {
        // FLYING KINGS: Can tek from any distance and land anywhere beyond
        for (let capDist = 1; capDist < 8; capDist++) {
          const capRow = piece.square.row + dr * capDist;
          const capCol = piece.square.col + dc * capDist;
          
          if (capRow < 0 || capRow >= 8 || capCol < 0 || capCol >= 8) break;
          
          const capPiece = this.getPieceAt(state.board, { row: capRow, col: capCol });
          
          if (capPiece && capPiece.color !== piece.color) {
            // Try landing squares beyond the captured piece
            for (let landDist = 1; landDist < 8; landDist++) {
              const landRow = capRow + dr * landDist;
              const landCol = capCol + dc * landDist;
              
              if (landRow < 0 || landRow >= 8 || landCol < 0 || landCol >= 8) break;
              
              const landPiece = this.getPieceAt(state.board, { row: landRow, col: landCol });
              
              if (!landPiece) {
                moves.push({
                  from_square: piece.square,
                  to_square: { row: landRow, col: landCol },
                  captured: [{ row: capRow, col: capCol }],
                  promotes: false
                });
              } else {
                break;
              }
            }
            break;
          } else if (capPiece) {
            break;
          }
        }
      } else {
        // MEN: Can tek in all directions (including backwards), jump only adjacent
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
    }

    return moves;
  }

  static getAllLegalMoves(state: GameState): Move[] {
    const allMoves: Move[] = [];
    
    for (const piece of state.board) {
      if (piece.color === state.turn) {
        const moves = this.getLegalMoves(state, piece);
        allMoves.push(...moves);
      }
    }
    
    // JAMAICAN RULE: Must make maximum capture
    let maxCaptures = 0;
    for (const move of allMoves) {
      if (move.captured.length > maxCaptures) {
        maxCaptures = move.captured.length;
      }
    }
    
    if (maxCaptures > 0) {
      return allMoves.filter(m => m.captured.length === maxCaptures);
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

export default function JamaicanSinglePlayerScreen() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>({
    board: JamaicanCheckersAI.createInitialBoard(),
    turn: 'red',
    history: [],
    winner: null
  });
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [thinking, setThinking] = useState(false);
  const [hoofWarning, setHoofWarning] = useState<string | null>(null);
  const [capturingPiece, setCapturingPiece] = useState<Piece | null>(null); // Piece in middle of multi-capture
  const [captureChain, setCaptureChain] = useState<Square[]>([]); // Track captured pieces in chain

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

  const calculateLegalMoves = (piece: Piece): Square[] => {
    if (piece.color !== 'red' || gameState.turn !== 'red' || gameState.winner) {
      return [];
    }
    return JamaicanCheckersAI.getLegalMoves(gameState, piece).map(m => m.to_square);
  };

  const handleSquarePress = (row: number, col: number) => {
    if (gameState.winner || gameState.turn !== 'red' || thinking) return;

    // If we're in the middle of a multi-capture, only allow continuing the chain
    if (capturingPiece) {
      const isLegalMove = legalMoves.some(m => m.row === row && m.col === col);
      
      if (isLegalMove) {
        continueCapture(row, col);
      }
      return;
    }

    const clickedPiece = gameState.board.find(
      p => p.square.row === row && p.square.col === col && p.color === 'red'
    );

    if (clickedPiece) {
      setSelectedPiece(clickedPiece);
      const moves = calculateLegalMoves(clickedPiece);
      setLegalMoves(moves);
      
      // Check for hoof warning
      const pieceMoves = JamaicanCheckersAI.getLegalMoves(gameState, clickedPiece);
      const pieceHasTeks = pieceMoves.some(m => m.captured.length > 0);
      const pieceHasNonTeks = pieceMoves.some(m => m.captured.length === 0);
      
      const allPlayerPieces = gameState.board.filter(p => p.color === 'red');
      const otherPiecesWithTek = allPlayerPieces.filter(p => {
        if (p.square.row === clickedPiece.square.row && p.square.col === clickedPiece.square.col) {
          return false;
        }
        const moves = JamaicanCheckersAI.getLegalMoves(gameState, p);
        return moves.some(m => m.captured.length > 0);
      });
      
      if (otherPiecesWithTek.length > 0) {
        setHoofWarning('🐴 Another piece has tek available! If you move this piece instead, that piece will be hoofed!');
      } else if (pieceHasTeks && pieceHasNonTeks) {
        setHoofWarning('🐴 This piece has tek available! If you move without tekking, it will be hoofed!');
      } else {
        setHoofWarning(null);
      }
      
      return;
    }

    if (selectedPiece) {
      const isLegalMove = legalMoves.some(m => m.row === row && m.col === col);
      
      if (isLegalMove) {
        const allMoves = JamaicanCheckersAI.getLegalMoves(gameState, selectedPiece);
        const move = allMoves.find(m => m.to_square.row === row && m.to_square.col === col);
        
        if (move) {
          if (move.captured.length > 0) {
            // This is a capture - start multi-capture sequence
            startCapture(move);
          } else {
            // Regular non-capture move - check hoof rules
            completeNonCaptureMove(move);
          }
        }
      }
      
      setSelectedPiece(null);
      setHoofWarning(null);
    }
  };

  const startCapture = (move: Move) => {
    if (!selectedPiece) return;

    // Update board with the capture
    const newBoard = gameState.board.map(p => ({ ...p, square: { ...p.square } }));
    
    // Move the piece
    const movingPiece = newBoard.find(p => 
      p.square.row === move.from_square.row && p.square.col === move.from_square.col
    );
    
    if (movingPiece) {
      movingPiece.square = move.to_square;
      
      // Check for promotion
      if (move.promotes) {
        movingPiece.rank = 'king';
      }
    }
    
    // Remove captured pieces
    const boardAfterCapture = newBoard.filter(p => 
      !move.captured.some(cap => p.square.row === cap.row && p.square.col === cap.col)
    );
    
    // Update game state visually
    const updatedState = {
      ...gameState,
      board: boardAfterCapture
    };
    setGameState(updatedState);
    
    // Add to capture chain
    const newCaptureChain = [...captureChain, ...move.captured];
    setCaptureChain(newCaptureChain);
    
    // Check if more captures are available from new position
    const continuingPiece: Piece = {
      ...selectedPiece,
      square: move.to_square,
      rank: move.promotes ? 'king' : selectedPiece.rank
    };
    
    const furtherCaptures = JamaicanCheckersAI.getLegalMoves(updatedState, continuingPiece)
      .filter(m => m.captured.length > 0);
    
    if (furtherCaptures.length > 0) {
      // MULTI-CAPTURE: More captures available!
      setCapturingPiece(continuingPiece);
      setLegalMoves(furtherCaptures.map(m => m.to_square));
      setHoofWarning('🔗 Continue capturing! Select next tek.');
    } else {
      // Capture chain complete - end turn
      completeCapture(updatedState, newCaptureChain);
    }
  };

  const continueCapture = (row: number, col: number) => {
    if (!capturingPiece) return;

    const allMoves = JamaicanCheckersAI.getLegalMoves(gameState, capturingPiece);
    const move = allMoves.find(m => 
      m.to_square.row === row && m.to_square.col === col && m.captured.length > 0
    );
    
    if (move) {
      // Update board with next capture in chain
      const newBoard = gameState.board.map(p => ({ ...p, square: { ...p.square } }));
      
      const movingPiece = newBoard.find(p => 
        p.square.row === capturingPiece.square.row && p.square.col === capturingPiece.square.col
      );
      
      if (movingPiece) {
        movingPiece.square = move.to_square;
        
        if (move.promotes) {
          movingPiece.rank = 'king';
        }
      }
      
      const boardAfterCapture = newBoard.filter(p => 
        !move.captured.some(cap => p.square.row === cap.row && p.square.col === cap.col)
      );
      
      const updatedState = {
        ...gameState,
        board: boardAfterCapture
      };
      setGameState(updatedState);
      
      const newCaptureChain = [...captureChain, ...move.captured];
      setCaptureChain(newCaptureChain);
      
      // Check for more captures
      const continuingPiece: Piece = {
        ...capturingPiece,
        square: move.to_square,
        rank: move.promotes ? 'king' : capturingPiece.rank
      };
      
      const furtherCaptures = JamaicanCheckersAI.getLegalMoves(updatedState, continuingPiece)
        .filter(m => m.captured.length > 0);
      
      if (furtherCaptures.length > 0) {
        setCapturingPiece(continuingPiece);
        setLegalMoves(furtherCaptures.map(m => m.to_square));
      } else {
        completeCapture(updatedState, newCaptureChain);
      }
    }
  };

  const completeCapture = (finalState: GameState, chain: Square[]) => {
    // Capture chain is complete - switch turn
    const newState = {
      ...finalState,
      turn: 'black' as PieceColor,
      winner: JamaicanCheckersAI.checkWinner({ ...finalState, turn: 'black' })
    };
    
    setGameState(newState);
    setCapturingPiece(null);
    setLegalMoves([]);
    setCaptureChain([]);
    setHoofWarning(null);
    
    if (chain.length > 1) {
      setTimeout(() => {
        Alert.alert('🔗 Multi-Tek!', `You captured ${chain.length} pieces in one turn!`, [{ text: 'Nice!' }]);
      }, 300);
    }
  };

  const completeNonCaptureMove = (move: Move) => {
    if (!selectedPiece) return;

    let newState = JamaicanCheckersAI.applyMove(gameState, move);
    let hoofedPieces: Piece[] = [];
    
    // Check hoof rules
    const selectedPieceMoves = JamaicanCheckersAI.getLegalMoves(gameState, selectedPiece);
    const selectedPieceHadTek = selectedPieceMoves.some(m => m.captured.length > 0);
    
    if (selectedPieceHadTek && move.captured.length === 0) {
      hoofedPieces.push({
        ...selectedPiece,
        square: move.to_square
      });
    }
    
    const allPlayerPieces = gameState.board.filter(p => p.color === 'red');
    const otherPiecesWithTek = allPlayerPieces.filter(p => {
      if (p.square.row === selectedPiece.square.row && p.square.col === selectedPiece.square.col) {
        return false;
      }
      const moves = JamaicanCheckersAI.getLegalMoves(gameState, p);
      return moves.some(m => m.captured.length > 0);
    });
    
    if (move.captured.length === 0 && otherPiecesWithTek.length > 0) {
      hoofedPieces.push(...otherPiecesWithTek);
    }
    
    if (hoofedPieces.length > 0) {
      const hoofedMessage = hoofedPieces.length === 1 
        ? '🐴 HOOFED! A piece had tek available but wasn\'t used!'
        : `🐴 HOOFED! ${hoofedPieces.length} pieces had tek available but weren't used!`;
      
      Alert.alert('🐴 HOOFED!', hoofedMessage, [{ text: 'OK' }]);
      
      newState = {
        ...newState,
        board: newState.board.filter(p => 
          !hoofedPieces.some(hp => 
            p.square.row === hp.square.row && p.square.col === hp.square.col
          )
        )
      };
    }
    
    setGameState(newState);
  };

  const renderSquare = (row: number, col: number) => {
    const isDark = (row + col) % 2 === 1;
    const piece = gameState.board.find(p => p.square.row === row && p.square.col === col);
    const isSelected = selectedPiece?.square.row === row && selectedPiece?.square.col === col;
    const isCapturing = capturingPiece?.square.row === row && capturingPiece?.square.col === col;
    const isLegalMove = legalMoves.some(m => m.row === row && m.col === col);

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.square,
          isDark ? styles.darkSquare : styles.lightSquare,
          isSelected && styles.selectedSquare,
          isCapturing && styles.capturingSquare,
          isLegalMove && styles.legalMoveSquare,
        ]}
        onPress={() => handleSquarePress(row, col)}
      >
        {piece && (
          <View style={[
            styles.piece,
            piece.color === 'red' ? styles.redPiece : styles.blackPiece,
            piece.rank === 'king' && styles.kingPiece,
            isCapturing && styles.capturingPiece,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🇯🇲 Jamaican Checkers</Text>
        
        {capturingPiece && (
          <View style={styles.multiCaptureIndicator}>
            <Text style={styles.multiCaptureText}>🔗 MULTI-TEK IN PROGRESS!</Text>
            <Text style={styles.multiCaptureSubtext}>Select next capture to continue chain</Text>
          </View>
        )}
        
        {hoofWarning && !capturingPiece && (
          <View style={styles.hoofWarning}>
            <Text style={styles.hoofWarningText}>{hoofWarning}</Text>
          </View>
        )}
        
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
          <View style={styles.scoreItem}>
            <View style={[styles.colorDot, styles.redDot]} />
            <Text style={styles.scoreText}>
              You: {gameState.board.filter(p => p.color === 'red').length}
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <View style={[styles.colorDot, styles.blackDot]} />
            <Text style={styles.scoreText}>
              AI: {gameState.board.filter(p => p.color === 'black').length}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {renderBoard()}
        </View>
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
    backgroundColor: '#FFD700',
    paddingTop: 50,
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  hoofWarning: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  hoofWarningText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  multiCaptureIndicator: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  multiCaptureText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  multiCaptureSubtext: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
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
    gap: 16,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
  },
  redDot: {
    backgroundColor: '#FF6B6B',
  },
  blackDot: {
    backgroundColor: '#2C3E50',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#FFD700',
  },
  capturingSquare: {
    backgroundColor: '#4CAF50',
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
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    maxWidth: 160,
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
