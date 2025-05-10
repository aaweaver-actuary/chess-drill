'use client';
import { ChessBoard } from "@/components/ChessBoard";
import PGNUploader from '@/components/PGNUploader';
import { useState } from 'react';

export default function Home() {
  const [pgn, setPgn] = useState<string | null>(null); // Added state for PGN content

  const handlePgnLoad = (loadedPgn: string) => {
    // Added handler function
    setPgn(loadedPgn);
    console.log('Loaded PGN:', loadedPgn); // Log PGN to console for verification
  };

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <PGNUploader onPgnLoad={handlePgnLoad} />{' '}
      <ChessBoard
        position="start"
        onDrop={(sourceSquare, targetSquare) => true}
      />
    </div>
  );
}
