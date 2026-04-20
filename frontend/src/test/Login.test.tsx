import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock useAuth context
const mockLogin = vi.fn();
const mockLoginWithWallet = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    loginWithWallet: mockLoginWithWallet,
    user: null,
    loading: false,
  }),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock ThemeToggle (depends on external refs)
vi.mock('../components/ui/ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle" />,
}));

import Login from '../pages/Login';

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockLoginWithWallet.mockReset();
    mockNavigate.mockReset();
  });

  it('renders email and password fields and Sign In button', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('renders the MedTrustFund heading', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: 'MedTrustFund' })).toBeInTheDocument();
  });

  it('renders a link to sign-up page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /create an account/i })).toBeInTheDocument();
  });

  it('renders Connect Wallet button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });

  it('renders Forgot Password link', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123');
    });
  });

  it('navigates to /dashboard after successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message when login fails', async () => {
    mockLogin.mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'wrong@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while signing in', async () => {
    // login never resolves during this test
    let resolveLogin!: () => void;
    mockLogin.mockReturnValueOnce(new Promise<void>((res) => { resolveLogin = res; }));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    resolveLogin();
  });

  it('calls loginWithWallet when Connect Wallet button clicked', async () => {
    mockLoginWithWallet.mockResolvedValueOnce(undefined);
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));

    await waitFor(() => {
      expect(mockLoginWithWallet).toHaveBeenCalled();
    });
  });
});
