import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiBriefcase, FiMapPin, FiMail, FiShield, FiThumbsUp, FiActivity, FiGlobe } from "react-icons/fi";

export default function HospitalProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/login");
      return;
    }
    
    const parsed = JSON.parse(savedUser);
    setUser(parsed);

    // Mock API call simulation for extra hospital details if they aren't explicitly inside the auth token
    setTimeout(() => {
      setStats({
        activePatients: 24,
        milestonesConfirmed: 156,
        trustRating: "A+"
      });
      setLoading(false);
    }, 600);
  }, [navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-slate-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500 z-10"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 pb-20 pt-8 sm:pt-12">
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-pink-900/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-10 relative z-10">
        <div className="flex justify-between items-center mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              Institution Profile
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Manage hospital credentials and platform statistics</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 border border-white/10 text-white bg-white/5 hover:bg-white/10 rounded-lg font-bold transition-all"
          >
            ← Dashboard
          </motion.button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 relative overflow-hidden group mb-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/20 transition-all" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="w-32 h-32 bg-slate-900 border border-white/10 shadow-2xl rounded-2xl flex items-center justify-center text-pink-400 text-5xl shrink-0">
              <FiBriefcase />
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    {user.name || user.fullName || "Hospital Facility"}
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
                      <FiShield/> Verified
                    </span>
                  </h2>
                  <p className="text-pink-300 font-mono text-sm tracking-wide">
                    License No: {user.hospitalLicense || "LIC-90283-MTF"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
                  <FiMail className="text-purple-400" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
                  <FiMapPin className="text-purple-400" />
                  <span className="text-sm">Main Medical Campus</span>
                </div>
                <div className="col-span-1 sm:col-span-2 flex items-center gap-3 text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
                  <FiGlobe className="text-purple-400" />
                  <span className="text-sm font-mono break-all text-indigo-300">{user.walletAddress || "Web3 Wallet Not Connected"}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-2xl border border-white/5">
            <div className="p-3 bg-blue-500/20 text-blue-400 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><FiActivity className="w-6 h-6"/></div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Patients</h3>
            <p className="text-4xl font-black text-white">{stats.activePatients}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-2xl border border-white/5">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><FiThumbsUp className="w-6 h-6"/></div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Milestones Verified</h3>
            <p className="text-4xl font-black text-white">{stats.milestonesConfirmed}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-2xl border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <div className="p-3 bg-amber-500/20 text-amber-400 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><FiShield className="w-6 h-6"/></div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trust Rating</h3>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">{stats.trustRating}</p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
