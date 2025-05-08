'use client';

import { Chess, Piece, Square } from 'chess.js';
import { get } from 'http';
import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';

interface ChessBoardProps {
  position: string;
  onDrop: {
    (sourceSquare: Square, targetSquare: Square, piece: Piece): boolean;
  };
}

/**
 * @param {{position:string, onDrop:OnDropType}: ChessBoardProps} props
 * @returns {React.JSX.Element}
 * @description A chessboard component that displays the current position of the chess pieces and allows the user to move them.
 * @example
 * <ChessBoard
 *    position="start"
 *    onDrop={
 *      (sourceSquare, targetSquare) => console.log(sourceSquare, targetSquare)
 *    }
 * />
 */
export function ChessBoard({}: ChessBoardProps): React.JSX.Element {
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState('');
  const [moveTo, setMoveTo] = useState<Square | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [rightClickedSquares, setRightClickedSquares] = useState({});
  const [moveSquares, setMoveSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});

  function isPieceOnSquare(square: Square): boolean {
    const piece = game.get(square);
    return !(piece === null);
  }

  function getPieceOnSquare(square: Square): string {
    const piece = game.get(square);
    if (piece) {
      return piece.type;
    }
    return '';
  }

  function getPieceColorOnSquare(square: Square): string | null {
    const piece = game.get(square);
    if (piece) {
      return piece.color;
    }
    return null;
  }

  function getPieceTypeOnSquare(square: Square): string {
    const piece = game.get(square);
    if (piece) {
      return piece.type;
    }
    return '';
  }

  function findLegalMoveSquares(square: Square): string[] {
    const piece = getPieceOnSquare(square);
    const pieceColor = getPieceColorOnSquare(square);
    const pieceType = getPieceTypeOnSquare(square);
    if (!piece) {
      return [];
    }

    if (!pieceColor || !pieceType) {
      return [];
    }

    const moves = game.moves({
      square,
      verbose: true,
    });
    const legalMoves = moves.filter((move: any) => {
      const movePiece = game.get(move.to) || null;
      if (movePiece) {
        return movePiece.color !== pieceColor;
      } else {
        return true;
      }
    });
    return legalMoves.map((move: any) => move.to);
  }

  function isWhitePiece(square: Square): boolean {
    return getPieceColorOnSquare(square) === 'w';
  }

  function isBlackPiece(square: Square): boolean {
    return getPieceColorOnSquare(square) === 'b';
  }

  function isPawn(square: Square): boolean {
    return getPieceTypeOnSquare(square) === 'p';
  }

  function isKnight(square: Square): boolean {
    return getPieceTypeOnSquare(square) === 'n';
  }

  function isBishop(square: Square): boolean {
    return getPieceTypeOnSquare(square) === 'b';
  }

  function isRook(square: Square): boolean {
    return getPieceTypeOnSquare(square) === 'r';
  }

  function isQueen(square: Square): boolean {
    return getPieceTypeOnSquare(square) === 'q';
  }

  function isKing(square: Square): boolean {
    return getPieceTypeOnSquare(square) === 'k';
  }

  function hasValidMove(square: Square): boolean {
    const piece = game.get(square);
    if (!piece) {
      return false;
    }
    const pieceColor = getPieceColorOnSquare(square);
    const pieceType = getPieceTypeOnSquare(square);
    const moves = game.moves({
      square,
      verbose: true,
    });
    const legalMoves = moves.filter((move: any) => {
      const movePiece = game.get(move.to) || null;
      if (movePiece) {
        return getPieceColorOnSquare(move.to) !== pieceColor;
      } else {
        return true;
      }
    });
    return legalMoves.length > 0;
  }

  function isPromotionMove(square: Square): boolean {
    const piece = game.get(square);
    if (!piece) {
      return false;
    }

    // A white pawn can promote on rank 8/black on rank 1
    const isWhitePromotion = isWhitePiece(square) && square[1] === '8';
    const isBlackPromotion = isBlackPiece(square) && square[1] === '1';

    // A promotion move is a pawn that has reached the last rank
    return isPawn(square) && (isWhitePromotion || isBlackPromotion);
  }

  function onSquareClick(square: Square) {
    setRightClickedSquares({});

    const currentSquare = square as string;
    const piece = getPieceOnSquare(square);
    const pieceColor = getPieceColorOnSquare(square);
    const pieceType = getPieceTypeOnSquare(square);

    // to square
    if (!moveTo) {
      // check if valid move before showing dialog
      if (!hasValidMove(square)) {
        return;
      }

      // valid move
      setMoveTo(square);

      // if promotion move
      if (isPromotionMove(square)) {
        // show promotion dialog
        setShowPromotionDialog(true);
        return;
      }

      // is normal move
      const gameCopy: any = {
        ...game,
      };
      const move = gameCopy.move({
        from: moveFrom,
        to: square,
        promotion: 'q',
      });

      setGame(gameCopy);
      setMoveFrom('');
      setMoveTo(null);
      setOptionSquares({});
      return;
    }
  }

  function onPromotionPieceSelect(piece: string[]) {
    // if no piece passed then user has cancelled dialog, don't make move and reset
    if (piece) {
      const gameCopy: any = {
        ...game,
      };
      gameCopy.move({
        from: moveFrom,
        to: moveTo || '',
        promotion: piece[1].toLowerCase() ?? 'q',
      });
      setGame(gameCopy);
    }
    setMoveFrom('');
    setMoveTo(null);
    setShowPromotionDialog(false);
    setOptionSquares({});
    return true;
  }

  function onSquareRightClick(square: string | number) {
    const colour = 'rgba(0, 0, 255, 0.4)';
    setRightClickedSquares({
      ...rightClickedSquares,
      [square]: {
        backgroundColor: colour,
        borderRadius: '50%',
        boxShadow: `0 0 10px ${colour}`,
      },
    });
  }

  return (
    <div>
      <Chessboard
        id="ClickToMove"
        animationDuration={200}
        arePiecesDraggable={false}
        position={game.fen()}
        onSquareClick={onSquareClick}
        onSquareRightClick={onSquareRightClick}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
        }}
        customSquareStyles={{
          ...moveSquares,
          ...optionSquares,
          ...rightClickedSquares,
        }}
        promotionToSquare={moveTo}
        showPromotionDialog={showPromotionDialog}
      />
    </div>
  );
}
