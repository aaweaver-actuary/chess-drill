// __tests__/PGNUploader.test.jsx
import '@testing-library/jest-dom';        // loads all jest-dom matchers
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PGNUploader from '@/components/PGNUploader';

describe('PGNUploader', () => {
  it('renders an input type="file" with accept=".pgn"', () => {
    render(<PGNUploader onPgnLoad={() => {}} />);
    const fileInput = screen.getByLabelText(/upload pgn/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.pgn');
  });
});