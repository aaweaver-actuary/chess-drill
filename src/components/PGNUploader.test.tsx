import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PGNUploader from './PGNUploader';

describe('PGNUploader', () => {
  it('renders an input type="file" with accept=".pgn"', () => {
    render(<PGNUploader onPgnLoad={jest.fn()} />);
    const fileInput = screen.getByLabelText(/upload pgn/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.pgn');
  });

  it('calls onPgnLoad prop with PGN string when a file is selected', async () => {
    const mockOnPgnLoad = jest.fn();
    render(<PGNUploader onPgnLoad={mockOnPgnLoad} />);
    const fileInput = screen.getByLabelText(/upload pgn/i);

    const pgnContent = '1. e4 e5 2. Nf3 Nc6';
    const file = new File([pgnContent], 'test.pgn', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnPgnLoad).toHaveBeenCalledWith(pgnContent);
    });
  });
});
