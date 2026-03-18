import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-900 bg-clip-text text-transparent">
            MedTrustFund
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{user.fullName || user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user.fullName || user.name}! 👋
          </h2>
          <p className="text-gray-600">
            Role: <span className="font-semibold capitalize">{user.role}</span>
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {user.role === 'donor' && (
            <>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/campaigns')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📋 Browse Campaigns</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Discover and support medical campaigns
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  View Campaigns
                </button>
              </div>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/my-donations')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 My Donations</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Track your donations and impact
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  View Donations
                </button>
              </div>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/profile')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">👤 My Profile</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Update your profile and wallet
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  Edit Profile
                </button>
              </div>
            </>
          )}

          {user.role === 'patient' && (
            <>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/create-campaign')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🆕 Create Campaign</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Start a fundraising campaign
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  Create New
                </button>
              </div>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/my-campaigns')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 My Campaigns</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage your campaigns
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  View My Campaigns
                </button>
              </div>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/analytics')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📈 Analytics</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Track your fundraising progress
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  View Analytics
                </button>
              </div>
            </>
          )}

          {user.role === 'hospital' && (
            <>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/milestones')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Verify Milestones</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Confirm treatment milestones
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  Verify Milestones
                </button>
              </div>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/my-campaigns')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📋 Assigned Campaigns</h3>
                <p className="text-gray-600 text-sm mb-4">
                  View campaigns assigned to you
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  View Campaigns
                </button>
              </div>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/hospital-profile')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🏥 Hospital Info</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage hospital profile
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  Edit Profile
                </button>
              </div>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/admin/users')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">👥 User Management</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage all users
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  Manage Users
                </button>
              </div>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/admin/dashboard')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 System Dashboard</h3>
                <p className="text-gray-600 text-sm mb-4">
                  View platform statistics
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  View Stats
                </button>
              </div>
              <div
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
                onClick={() => navigate('/admin/audit-logs')}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📜 Audit Logs</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Review audit trail
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
                  View Logs
                </button>
              </div>
            </>
          )}
        </div>

        {/* Wallet Section */}
        {user.walletAddress ? (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🔗 Connected Wallet</h3>
            <p className="text-gray-600 font-mono text-sm break-all">{user.walletAddress}</p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-md p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🔗 Connect Wallet</h3>
            <p className="text-gray-700 mb-4">
              Connect your wallet to participate in blockchain transactions
            </p>
            <button className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition">
              Connect Wallet
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
