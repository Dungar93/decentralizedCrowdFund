import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (error) {
      navigate('/login');
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        localStorage.setItem('token', token);
        localStorage.setItem('user', userStr);

        // Notify parent via BroadcastChannel
        const authChannel = new BroadcastChannel('google-auth-channel');
        authChannel.postMessage({ type: 'google-auth-success' });
        
        // Notify parent via postMessage (fallback if opener exists)
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: 'google-auth-success', token, user },
            window.location.origin
          );
        }

        // Try to close popup natively
        window.close();

        // If window doesn't close natively (fallback), navigate inside this tab
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } catch (err) {
        setError('Failed to process authentication');
      }
    } else {
      setError('Authentication failed - missing credentials');
    }
  }, [searchParams, navigate, error]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 text-center max-w-md"
      >
        {error ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Authentication Failed</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-400 hover:to-pink-400 transition-all"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </motion.div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Completing Authentication</h2>
            <p className="text-slate-400">Please wait while we set up your session...</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
