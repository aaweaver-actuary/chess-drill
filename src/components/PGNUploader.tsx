import React from 'react';

interface PGNUploaderProps {
  onPgnLoad: (pgn: string) => void;
}

const PGNUploader: React.FC<PGNUploaderProps> = ({ onPgnLoad }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const pgn = e.target?.result as string;
        onPgnLoad(pgn);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <label htmlFor="pgn-upload">Upload PGN</label>
      <input
        id="pgn-upload"
        type="file"
        accept=".pgn"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default PGNUploader;
