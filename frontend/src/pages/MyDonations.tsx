import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { FiHeart, FiCornerDownLeft, FiExternalLink, FiClock, FiCheckCircle } from "react-icons/fi";

interface Donation {
  _id: string;
  campaignId: {
    _id: string;
    title: string;
    status: string;
  };
  amount: number;
  status: string;
  transactionHash?: string;
  createdAt: string;
  donorMessage?: string;
}

export default function MyDonations() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingRefund, setProcessingRefund] = useState<string | null>(null);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/donations");
      setDonations(response.data.donations || []);
    } catch (err: any) {
      console.error("Failed to fetch donations:", err);
      setError(err.response?.data?.error || "Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async (donationId: string) => {
    if (!confirm("Are you sure you want to request a refund? Funds will be returned via the smart contract.")) return;

    try {
      setProcessingRefund(donationId);
      setError("");

      await api.post(`/api/donations/${donationId}/refund`);

      alert("Refund processed via smart contract successfully!");
      fetchDonations();
    } catch (err: any) {
      console.error("Refund error:", err);
      setError(err.response?.data?.error || "Failed to process refund");
    } finally {
      setProcessingRefund(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "locked_in_escrow":
        return "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30";
      case "released":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "refunded":
        return "bg-rose-500/20 text-rose-400 border border-rose-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
    }
  };

  const truncateHash = (hash?: string) => {
    if (!hash) return "Transaction processing...";
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950" />
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500 z-10"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 pt-8 sm:pt-12 bg-slate-950">
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-pink-900/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-10 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400">
              My Donations
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Track your on-chain contributions and their impact</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => navigate("/campaigns")}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-2"
            >
              Support More <FiHeart className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 bg-red-500/10 border border-red-500/50 p-4 rounded-xl">
            <p className="text-red-300 font-medium">{error}</p>
          </motion.div>
        )}

        {donations.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 px-4 glass-card rounded-3xl border border-white/5">
            <div className="w-20 h-20 bg-slate-900/80 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 text-slate-500 shadow-[0_0_50px_rgba(236,72,153,0.1)]">
              <FiHeart className="w-8 h-8 text-pink-500/50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No donations yet</h3>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">Start supporting verified medical campaigns today and make a real difference.</p>
            <button
              onClick={() => navigate("/campaigns")}
              className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Browse Active Campaigns
            </button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {donations.map((donation) => (
              <motion.div
                key={donation._id}
                variants={itemVariants}
                className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-pink-500/20 transition-all"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-white/5 pb-6 mb-6">
                  <div>
                    <h3
                      className="text-2xl font-bold text-white cursor-pointer hover:text-pink-400 transition-colors mb-2"
                      onClick={() => navigate(`/campaign/${donation.campaignId._id}`)}
                    >
                      {donation.campaignId.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400 flex items-center gap-1"><FiClock /> {new Date(donation.createdAt).toLocaleDateString()}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 capitalize">Campaign Status: <span className="text-slate-200 font-semibold">{donation.campaignId.status.replace("_", " ")}</span></span>
                    </div>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-2">
                       {donation.amount.toFixed(4)} ETH
                    </p>
                    <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${getStatusBadge(donation.status)}`}>
                      {donation.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">On-Chain Tx Hash</p>
                      <p className="text-white text-sm font-mono truncate">
                        {truncateHash(donation.transactionHash)}
                      </p>
                    </div>
                  </div>

                  {donation.donorMessage && (
                    <div className="p-4 bg-pink-500/10 rounded-2xl border border-pink-500/20 flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                        <FiHeart className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-pink-200/50 mb-0.5">Your Message</p>
                        <p className="text-pink-100 text-sm italic">
                          "{donation.donorMessage}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div>
                    {donation.status === "released" && (
                      <p className="flex items-center gap-2 text-sm text-emerald-400 font-bold">
                        <FiCheckCircle /> Funds reached the hospital. You made an impact!
                      </p>
                    )}
                    {donation.status === "refunded" && (
                      <p className="flex items-center gap-2 text-sm text-rose-400 font-bold">
                        <FiCornerDownLeft /> Funds securely refunded to your wallet.
                      </p>
                    )}
                    {donation.status === "locked_in_escrow" && (
                      <p className="flex items-center gap-2 text-sm text-indigo-400 font-bold">
                        <FiCheckCircle /> Safely locked in Smart Contract escrow.
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    {donation.status === "locked_in_escrow" && (
                      <button
                        onClick={() => processRefund(donation._id)}
                        disabled={processingRefund === donation._id}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                      >
                        {processingRefund === donation._id ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                        ) : (
                          <><FiCornerDownLeft /> Request Refund</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/campaign/${donation.campaignId._id}`)}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <FiExternalLink /> View
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
