import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    } catch (err) {
      setError('Failed to load user data');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>MedTrustFund</h1>
          <div className="user-menu">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome, {user.name}! 👋</h2>
          <p>Role: <strong>{user.role.toUpperCase()}</strong></p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Role-based sections */}
        <div className="dashboard-grid">
          {user.role === 'donor' && (
            <>
              <div className="dashboard-card">
                <h3>📋 Browse Campaigns</h3>
                <p>Discover and support medical campaigns</p>
                <button onClick={() => navigate('/campaigns')}>View Campaigns</button>
              </div>
              <div className="dashboard-card">
                <h3>💰 My Donations</h3>
                <p>Track your donations and impact</p>
                <button onClick={() => navigate('/my-donations')}>View Donations</button>
              </div>
              <div className="dashboard-card">
                <h3>👤 My Profile</h3>
                <p>Update your profile and wallet</p>
                <button onClick={() => navigate('/profile')}>Edit Profile</button>
              </div>
            </>
          )}

          {user.role === 'patient' && (
            <>
              <div className="dashboard-card">
                <h3>🆕 Create Campaign</h3>
                <p>Start a fundraising campaign</p>
                <button onClick={() => navigate('/create-campaign')}>Create New</button>
              </div>
              <div className="dashboard-card">
                <h3>📊 My Campaigns</h3>
                <p>Manage your campaigns</p>
                <button onClick={() => navigate('/my-campaigns')}>View My Campaigns</button>
              </div>
              <div className="dashboard-card">
                <h3>📈 Analytics</h3>
                <p>Track your fundraising progress</p>
                <button onClick={() => navigate('/analytics')}>View Analytics</button>
              </div>
            </>
          )}

          {user.role === 'hospital' && (
            <>
              <div className="dashboard-card">
                <h3>✅ Verify Milestones</h3>
                <p>Confirm treatment milestones</p>
                <button onClick={() => navigate('/milestones')}>Verify Milestones</button>
              </div>
              <div className="dashboard-card">
                <h3>📋 Assigned Campaigns</h3>
                <p>View campaigns assigned to you</p>
                <button onClick={() => navigate('/my-campaigns')}>View Campaigns</button>
              </div>
              <div className="dashboard-card">
                <h3>🏥 Hospital Info</h3>
                <p>Manage hospital profile</p>
                <button onClick={() => navigate('/hospital-profile')}>Edit Profile</button>
              </div>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <div className="dashboard-card">
                <h3>👥 User Management</h3>
                <p>Manage all users</p>
                <button onClick={() => navigate('/admin/users')}>Manage Users</button>
              </div>
              <div className="dashboard-card">
                <h3>📊 System Dashboard</h3>
                <p>View platform statistics</p>
                <button onClick={() => navigate('/admin/dashboard')}>View Stats</button>
              </div>
              <div className="dashboard-card">
                <h3>📜 Audit Logs</h3>
                <p>Review audit trail</p>
                <button onClick={() => navigate('/admin/audit-logs')}>View Logs</button>
              </div>
            </>
          )}
        </div>

        {/* Wallet Info */}
        {user.walletAddress && (
          <div className="wallet-info-section">
            <h3>🔗 Connected Wallet</h3>
            <p>{user.walletAddress}</p>
          </div>
        )}

        {!user.walletAddress && (
          <div className="wallet-connect-section">
            <h3>🔗 Connect Wallet</h3>
            <p>Connect your wallet to participate in blockchain transactions</p>
            <button className="connect-wallet-btn">Connect Wallet</button>
          </div>
        )}
      </main>
    </div>
  );
}
