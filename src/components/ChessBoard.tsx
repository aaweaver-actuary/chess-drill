'use client';

import { Chess, PieceSymbol, Square, Move } from 'chess.js'; // Added Move type
// import { get } from 'http'; // Removed unused import
import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
// import { MoveHistory } from './MoveHistory';

interface ChessBoardProps {
  position: string; // FEN string or "start"
  onMove: (move: {
    from: Square;
    to: Square;
    piece: PieceSymbol;
    san: string;
    fen: string;
  }) => void;
}

export function ChessBoard(props: ChessBoardProps): React.JSX.Element {
  // Added props parameter
  const [game, setGame] = useState(() => {
    const initialFen = props.position === 'start' ? undefined : props.position;
    return new Chess(initialFen);
  });
  const [moveFrom, setMoveFrom] = useState<Square | ''>(''); // Ensure Square or empty string
  const [moveTo, setMoveTo] = useState<Square | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [rightClickedSquares, setRightClickedSquares] = useState<
    Record<string, any>
  >({});
  const [moveSquares, setMoveSquares] = useState<Record<string, any>>({}); // Kept for consistency, though not explicitly used in new logic
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<string | null>(
    null,
  );
  const [lastMoveSquares, setLastMoveSquares] = useState<Record<string, any>>(
    {},
  );

  // Effect to handle external position changes
  useEffect(() => {
    const newFen = props.position === 'start' ? undefined : props.position;
    const newGameInstance = new Chess(newFen);
    setGame(newGameInstance);
    setMoveHistory([]);
    setCurrentEvaluation(null);
    setMoveFrom('');
    setMoveTo(null);
    setOptionSquares({});
    setRightClickedSquares({});
    setShowPromotionDialog(false);
    setLastMoveSquares({}); // Clear last move highlight
  }, [props.position]);

  // Effect for updating evaluation (mocked)
  useEffect(() => {
    const currentFen = game.fen();
    setCurrentEvaluation('Calculating...');

    const timerId = setTimeout(() => {
      const mockEvalRaw = (Math.random() * 5 - 2.5).toFixed(2); // e.g., -2.50 to +2.50
      const displayEval =
        parseFloat(mockEvalRaw) >= 0 ? `+${mockEvalRaw}` : mockEvalRaw;
      setCurrentEvaluation(displayEval);
    }, 1200); // Simulate engine processing time

    return () => {
      clearTimeout(timerId);
    };
  }, [game.fen()]); // Re-run when FEN changes

  function getSafeMoves(square: Square): Move[] {
    const moves = game.moves({ square, verbose: true });
    return moves as Move[];
  }

  function onSquareClick(square: Square) {
    setRightClickedSquares({});

    if (!moveFrom) {
      // First click (selecting a piece to move)
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        // Check if it's the current player's piece
        setMoveFrom(square);
        const moves = getSafeMoves(square);
        const newOptionSquares: Record<string, any> = {};
        moves.forEach((move) => {
          newOptionSquares[move.to] = {
            background:
              game.get(move.to) && game.get(move.to)?.color !== piece.color
                ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
            borderRadius: '50%',
          };
        });
        setOptionSquares(newOptionSquares);
      }
      return;
    }

    // Second click (selecting a destination square)
    const pieceToMove = game.get(moveFrom);
    if (!pieceToMove) {
      setMoveFrom('');
      setOptionSquares({});
      return;
    }

    // Check if the move is a promotion
    // A pawn move to the 1st or 8th rank
    if (
      pieceToMove.type === 'p' &&
      ((pieceToMove.color === 'w' &&
        (moveFrom as string)[1] === '7' &&
        square[1] === '8') ||
        (pieceToMove.color === 'b' &&
          (moveFrom as string)[1] === '2' &&
          square[1] === '1'))
    ) {
      // Check if the move is legal before showing promotion dialog
      const isLegalPromotionMove = getSafeMoves(moveFrom).some(
        (m) => m.to === square && m.flags.includes('p'),
      );
      if (isLegalPromotionMove) {
        setMoveTo(square); // react-chessboard uses this for promotion
        setShowPromotionDialog(true);
        setOptionSquares({}); // Clear options, next action is promotion
        // Move will be made in onPromotionPieceSelect
        return;
      } else {
        // Illegal promotion attempt, reset
        setMoveFrom('');
        setMoveTo(null);
        setOptionSquares({});
        return;
      }
    }

    // Attempt normal move
    const newGame = new Chess(game.fen());
    const moveResult = newGame.move({
      from: moveFrom,
      to: square,
      promotion: 'q',
    }); // 'q' is default for non-promotions

    if (moveResult) {
      setGame(newGame);
      setMoveHistory((prev) => [...prev, moveResult.san]);
      setLastMoveSquares({
        // Highlight last move
        [moveResult.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
        [moveResult.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
      });
      if (props.onMove) {
        props.onMove({
          from: moveFrom as Square,
          to: square,
          piece: pieceToMove.type,
          san: moveResult.san,
          fen: newGame.fen(),
        });
      }
    }
    // Reset for next move
    setMoveFrom('');
    setMoveTo(null);
    setOptionSquares({});
  }

  function onPromotionPieceSelect(
    piece?: string,
    promoteFromSquare?: Square,
    promoteToSquare?: Square
  ): boolean {
    // react-chessboard passes piece as "wQ", "bN", etc.
    // We need to extract the piece symbol ("q", "n", etc.)
    if (piece && promoteFromSquare && promoteToSquare) {
      const pieceSymbol = piece[1]?.toLowerCase() as PieceSymbol; // "wQ" -> "q"
      const newGame = new Chess(game.fen());
      const pieceToMoveDetails = game.get(promoteFromSquare);

      const moveResult = newGame.move({
        from: promoteFromSquare,
        to: promoteToSquare,
        promotion: pieceSymbol,
      });

      if (moveResult) {
        setGame(newGame);
        setMoveHistory((prev) => [...prev, moveResult.san]);
        setLastMoveSquares({
          [moveResult.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
          [moveResult.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
        });
        if (props.onMove && pieceToMoveDetails) {
          props.onMove({
            from: promoteFromSquare as Square,
            to: promoteToSquare,
            piece: pieceToMoveDetails.type,
            san: moveResult.san,
            fen: newGame.fen(),
          });
        }
      }
    }
    setMoveFrom('');
    setMoveTo(null);
    setShowPromotionDialog(false);
    setOptionSquares({});
    return true;
  }

  function onSquareRightClick(square: Square) {
    const colour = 'rgba(0, 0, 255, 0.4)';
    setRightClickedSquares({
      ...rightClickedSquares,
      [square]: {
        backgroundColor: colour,
        // borderRadius: '50%', // Optional: keep or remove based on desired style
        // boxShadow: `0 0 10px ${colour}`, // Optional
      },
    });
  }

  // The old handleUserMove is removed as move history is updated directly.
  // const handleUserMove = useCallback(async (from: string, to: string) => {
  // setMoveHistory(prev => [...prev, `${from}-${to}`]);
  // }, []);

  return (
    <div className="flex flex-col items-center">
      <div>
        <Chessboard
          id="ClickToMoveChessBoard" // Changed ID for clarity
          animationDuration={200}
          arePiecesDraggable={false} // Using click-to-move
          position={game.fen()}
          onSquareClick={onSquareClick}
          onSquareRightClick={onSquareRightClick}
          onPromotionPieceSelect={onPromotionPieceSelect}
          promotionToSquare={moveTo}
          showPromotionDialog={showPromotionDialog}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          }}
          customSquareStyles={{
            ...moveSquares, // Kept for potential future use
            ...optionSquares,
            ...rightClickedSquares,
            ...lastMoveSquares, // Added for last move highlight
          }}
        />
      </div>
      <div className="w-full max-w-md mt-4">
        <h3 className="text-lg font-semibold mb-2">Move History</h3>
        <ul className="list-decimal list-inside text-sm">
          {moveHistory.map((move, idx) => (
            <li key={idx}>{move}</li>
          ))}
        </ul>
      </div>
      {/* Corrected JSX structure for Evaluation section */}
      <div className="w-full max-w-md mt-2">
        <h3 className="text-lg font-semibold mb-1">Evaluation</h3>
        <p className="text-sm text-gray-700">
          {currentEvaluation !== null ? currentEvaluation : 'N/A'}
        </p>
      </div>
    </div>
  );
}

// Removed helper functions like isPieceOnSquare, getPieceOnSquare etc. as they are not directly
// used in the refactored logic or are encapsulated within chess.js instance (game.get, game.moves)
// If any specific checks are needed, they can be done via game instance.
// For example, game.get(square) returns piece details or null.
// game.moves({ square, verbose: true }) gives all legal moves from a square.
