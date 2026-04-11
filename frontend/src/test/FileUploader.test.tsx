import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUploader from '../components/ui/FileUploader';

describe('FileUploader', () => {
  const mockOnFilesChange = vi.fn();

  beforeEach(() => {
    mockOnFilesChange.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders dropzone with correct text', () => {
    render(<FileUploader onFilesChange={mockOnFilesChange} />);

    expect(screen.getByText(/Drag & drop documents or click to select/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF, JPG, PNG/i)).toBeInTheDocument();
  });

  it('shows upload icon', () => {
    render(<FileUploader onFilesChange={mockOnFilesChange} />);

    const uploadIcon = document.querySelector('svg');
    expect(uploadIcon).toBeInTheDocument();
  });

  it('calls onFilesChange when files are dropped', async () => {
    render(<FileUploader onFilesChange={mockOnFilesChange} />);

    // Get the dropzone element (the div with role="presentation")
    const dropzone = screen.getByRole('presentation');
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    // Fire drop event with proper dataTransfer
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [mockFile],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalled();
    });
  });

  it('displays uploaded files list', async () => {
    const { container } = render(<FileUploader onFilesChange={mockOnFilesChange} />);

    // Simulate file upload by calling the dropzone programmatically
    const input = container.querySelector('input[type="file"]');
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    if (input) {
      fireEvent.change(input, {
        target: {
          files: [mockFile],
        },
      });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
    expect(screen.getByText(/KB/i)).toBeInTheDocument();
  });

  it('allows removing uploaded files', async () => {
    const { container } = render(<FileUploader onFilesChange={mockOnFilesChange} />);

    const input = container.querySelector('input[type="file"]');
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    if (input) {
      fireEvent.change(input, {
        target: {
          files: [mockFile],
        },
      });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // Find the remove button by its SVG icon (FiX)
    const removeButton = screen.getByRole('button');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    });
  });

  it('is disabled when isDisabled prop is true', () => {
    render(<FileUploader onFilesChange={mockOnFilesChange} isDisabled />);

    // The dropzone div should have cursor-not-allowed class
    const dropzone = screen.getByRole('presentation');
    expect(dropzone).toHaveClass('cursor-not-allowed');
  });
});
