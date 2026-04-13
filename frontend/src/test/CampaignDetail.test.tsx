import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Mocks (all vi.mock calls must be at top-level — they are hoisted) ──────

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'donor' }, loading: false }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: vi.fn(),
    Contract: vi.fn(),
    parseEther: vi.fn((v: string) => BigInt(Math.round(parseFloat(v) * 1e18))),
  },
}));

// api mock: factory only — no top-level variable references (hoisting safe)
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// framer-motion passthrough
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: new Proxy(actual.motion as any, {
      get(_t, key) {
        return (props: any) => {
          const { initial: _i, animate: _a, exit: _e, transition: _tr, whileHover: _wh, whileTap: _wt, ...rest } = props;
          const Tag = key as any;
          return <Tag {...rest} />;
        };
      },
    }),
  };
});

// Import AFTER mocks are declared
import api from '../services/api';
import CampaignDetail from '../pages/CampaignDetail';

// Cast to access mock methods
const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;

// ── Shared campaign factory ────────────────────────────────────────────────

const makeCampaign = (overrides: Record<string, unknown> = {}) => ({
  _id: 'camp1',
  title: 'Heart Surgery for Riya',
  description: 'Urgent heart surgery needed',
  targetAmount: 5,
  raisedAmount: 2.5,
  status: 'active',
  riskCategory: 'low',
  riskScore: 20,
  smartContractAddress: '0xABC',
  patientId: { _id: 'p1', name: 'Riya Sharma', walletAddress: '0x1' },
  hospitalId: { hospitalName: 'Apollo Hospital', verified: true },
  milestones: [
    { description: 'Initial Tests', targetAmount: 2, status: 'pending' },
    { description: 'Surgery', targetAmount: 3, status: 'confirmed' },
  ],
  documents: [{ type: 'diagnosis', url: '/files/doc.pdf', hash: 'abc123' }],
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

function renderDetail(campaignId = 'camp1') {
  return render(
    <MemoryRouter initialEntries={[`/campaign/${campaignId}`]}>
      <Routes>
        <Route path="/campaign/:id" element={<CampaignDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('CampaignDetail Page', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockNavigate.mockReset();
  });

  it('shows loading spinner initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders campaign title after data loads', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/api/campaigns/')) return Promise.resolve({ data: { campaign: makeCampaign() } });
      return Promise.resolve({ data: { donations: [] } });
    });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Heart Surgery for Riya')).toBeInTheDocument();
    });
  });

  it('renders campaign description', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/api/campaigns/')) return Promise.resolve({ data: { campaign: makeCampaign() } });
      return Promise.resolve({ data: { donations: [] } });
    });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/urgent heart surgery needed/i)).toBeInTheDocument();
    });
  });

  it('shows days remaining when expiresAt is in the future', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/api/campaigns/')) return Promise.resolve({ data: { campaign: makeCampaign() } });
      return Promise.resolve({ data: { donations: [] } });
    });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/Days Remaining/i)).toBeInTheDocument();
    });
  });

  it('shows "Campaign Expired" when expiresAt is in the past', async () => {
    const expired = makeCampaign({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/api/campaigns/')) return Promise.resolve({ data: { campaign: expired } });
      return Promise.resolve({ data: { donations: [] } });
    });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/Campaign Expired/i)).toBeInTheDocument();
    });
  });

  it('shows donation form when campaign is active and contract is deployed', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/api/campaigns/')) return Promise.resolve({ data: { campaign: makeCampaign() } });
      return Promise.resolve({ data: { donations: [] } });
    });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Amount in ETH/i)).toBeInTheDocument();
    });
  });

  it('hides donation form when campaign is not active', async () => {
    const completed = makeCampaign({ status: 'completed', smartContractAddress: '0xABC' });
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/api/campaigns/')) return Promise.resolve({ data: { campaign: completed } });
      return Promise.resolve({ data: { donations: [] } });
    });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/Campaign not active/i)).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText(/Amount in ETH/i)).not.toBeInTheDocument();
  });

  it('shows smart contract active badge when contract is deployed', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/api/campaigns/')) return Promise.resolve({ data: { campaign: makeCampaign() } });
      return Promise.resolve({ data: { donations: [] } });
    });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/Smart Contract Active/i)).toBeInTheDocument();
    });
  });

  it('shows hospital name when assigned', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/api/campaigns/')) return Promise.resolve({ data: { campaign: makeCampaign() } });
      return Promise.resolve({ data: { donations: [] } });
    });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/Apollo Hospital/i)).toBeInTheDocument();
    });
  });

  it('shows milestones', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/api/campaigns/')) return Promise.resolve({ data: { campaign: makeCampaign() } });
      return Promise.resolve({ data: { donations: [] } });
    });
    renderDetail();
    await waitFor(() => {
      // Milestone descriptions appear as span text or input values
      const initial = screen.queryAllByText(/Initial Tests/i);
      const surgery = screen.queryAllByText(/Surgery/i);
      expect(initial.length + screen.queryAllByDisplayValue(/Initial Tests/i).length).toBeGreaterThan(0);
      expect(surgery.length + screen.queryAllByDisplayValue(/Surgery/i).length).toBeGreaterThan(0);
    });
  });

  it('renders error state when API fails', async () => {
    mockGet.mockRejectedValue({ response: { data: { error: 'Campaign not found' } } });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/Campaign not found/i)).toBeInTheDocument();
    });
  });
});
