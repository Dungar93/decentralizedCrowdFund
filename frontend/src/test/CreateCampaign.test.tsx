import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'patient' }, loading: false }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { hospitals: [] } }),
    post: vi.fn().mockResolvedValue({ data: { campaign: { _id: 'c1' } } }),
  },
}));

// framer-motion: render children immediately without animation
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: new Proxy(actual.motion as any, {
      get(_target, key) {
        const El = (props: any) => {
          const { initial: _i, animate: _a, exit: _e, transition: _t, whileHover: _wh, whileTap: _wt, ...rest } = props;
          const Tag = key as any;
          return <Tag {...rest} />;
        };
        return El;
      },
    }),
  };
});

import CreateCampaign from '../pages/CreateCampaign';

function renderCreateCampaign() {
  return render(
    <MemoryRouter>
      <CreateCampaign />
    </MemoryRouter>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('CreateCampaign Page', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders Step 1 form with title, description, and target amount fields', () => {
    renderCreateCampaign();

    expect(screen.getByPlaceholderText(/urgent heart surgery/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe the medical condition/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('2.5')).toBeInTheDocument();
  });

  it('shows step indicator "Step 1 of 4"', () => {
    renderCreateCampaign();
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
  });

  it('shows validation error when title is empty on Continue', async () => {
    renderCreateCampaign();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter a campaign title/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when target amount is missing', async () => {
    renderCreateCampaign();

    fireEvent.change(screen.getByPlaceholderText(/urgent heart surgery/i), {
      target: { value: 'My Campaign' },
    });
    fireEvent.change(screen.getByPlaceholderText(/describe the medical condition/i), {
      target: { value: 'Detailed description here' },
    });
    // Leave targetAmount empty
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid target amount/i)).toBeInTheDocument();
    });
  });

  it('advances to Step 2 after valid Step 1', async () => {
    renderCreateCampaign();

    fireEvent.change(screen.getByPlaceholderText(/urgent heart surgery/i), {
      target: { value: 'Heart Surgery Fund' },
    });
    fireEvent.change(screen.getByPlaceholderText(/describe the medical condition/i), {
      target: { value: 'Patient needs urgent surgery' },
    });
    fireEvent.change(screen.getByPlaceholderText('2.5'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();
    });
  });

  it('renders milestone section on Step 4 with default milestones', async () => {
    renderCreateCampaign();

    // Advance through steps 1–3 quickly (mock api.get returns empty hospitals)
    // Step 1 → Step 2
    fireEvent.change(screen.getByPlaceholderText(/urgent heart surgery/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/describe the medical condition/i), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByPlaceholderText('2.5'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument());

    // Step 2 → Step 3
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByText(/step 3 of 4/i)).toBeInTheDocument());

    // On Step 3, upload at least one file to continue
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['content'], 'diagnosis.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // select a doc type
    const docTypeSelects = document.querySelectorAll('select');
    if (docTypeSelects.length > 0) {
      fireEvent.change(docTypeSelects[0], { target: { value: 'diagnosis' } });
    }

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByText(/step 4 of 4/i)).toBeInTheDocument());

    // Default milestone row is present
    expect(screen.getByPlaceholderText(/Initial hospitalization/i)).toBeInTheDocument();
  });

  it('Add Another Milestone button adds a new milestone row', async () => {
    renderCreateCampaign();

    // Navigate to step 4
    fireEvent.change(screen.getByPlaceholderText(/urgent heart surgery/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/describe the medical condition/i), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByPlaceholderText('2.5'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByText(/step 3 of 4/i)).toBeInTheDocument());

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['x'], 'evidence.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    const selects = document.querySelectorAll('select');
    if (selects.length > 0) fireEvent.change(selects[0], { target: { value: 'diagnosis' } });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByText(/step 4 of 4/i)).toBeInTheDocument());

    const initialMs = screen.getAllByText(/M-\d/i).length;
    fireEvent.click(screen.getByRole('button', { name: /Add Another Milestone/i }));
    const finalMs = screen.getAllByText(/M-\d/i).length;
    expect(finalMs).toBe(initialMs + 1);
  });
});
