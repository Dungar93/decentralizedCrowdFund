import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { FiCheckCircle, FiClock, FiActivity, FiDollarSign, FiShield, FiArrowRight, FiAlertTriangle } from "react-icons/fi";
import { ethers } from "ethers";

interface Campaign {
  _id: string;
  title: string;
  description: string;
  status: string;
  raisedAmount: number;
  targetAmount: number;
  smartContractAddress?: string;
  milestones: Array<{
    description: string;
    targetAmount: number;
    status: string;
    confirmedAt?: string;
    releasedAt?: string;
  }>;
  hospitalId?: {
    _id: string;
    hospitalName: string;
    verified: boolean;
  };
}

export default function Milestones() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingAction, setProcessingAction] = useState<{
    type: "confirm" | "release";
    campaignId: string;
    index: number;
  } | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (user.role === "hospital") {
        const response = await api.get("/api/milestones/hospital/my-campaigns");
        setCampaigns(response.data.campaigns || []);
      } else {
        const response = await api.get("/api/campaigns?limit=50");
        setCampaigns(
          response.data.campaigns.filter((c: Campaign) => c.milestones?.length > 0)
        );
      }
    } catch (err: any) {
      console.error("Failed to fetch campaigns:", err);
      setError(err.response?.data?.error || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const confirmMilestone = async (campaignId: string, index: number) => {
    try {
      setProcessingAction({ type: "confirm", campaignId, index });
      setError("");

      const campaign = campaigns.find((c) => c._id === campaignId);

      // If contract is deployed, hospital must confirm on-chain and submit tx hash.
      if (campaign?.smartContractAddress) {
        if (!window.ethereum) {
          setError("MetaMask is required to confirm on-chain milestones.");
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          campaign.smartContractAddress,
          ["function confirmMilestone(uint256 index) external"],
          signer,
        );

        const tx = await contract.confirmMilestone(index);
        await tx.wait();

        await api.post(`/api/milestones/${campaignId}/confirm`, {
          milestoneIndex: index,
          transactionHash: tx.hash,
        });
      } else {
        // Offline mode / database-only campaigns (no contract yet)
        await api.post(`/api/milestones/${campaignId}/confirm`, { milestoneIndex: index });
      }

      alert("Milestone confirmed successfully!");
      fetchCampaigns();
    } catch (err: any) {
      console.error("Confirmation error:", err);
      setError(err.response?.data?.error || "Failed to confirm milestone");
    } finally {
      setProcessingAction(null);
    }
  };

  const releaseMilestone = async (campaignId: string, index: number) => {
    if (!confirm("Release funds for this milestone? This action cannot be undone and will trigger an on-chain transaction.")) return;

    try {
      setProcessingAction({ type: "release", campaignId, index });
      setError("");

      const campaign = campaigns.find((c) => c._id === campaignId);

      // Preferred: patient signs the release on-chain with MetaMask (non-custodial).
      if (campaign?.smartContractAddress && user.role === "patient") {
        if (!window.ethereum) {
          setError("MetaMask is required for patient-side on-chain release.");
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          campaign.smartContractAddress,
          ["function releaseMilestone(uint256 index) external"],
          signer,
        );

        const tx = await contract.releaseMilestone(index);
        await tx.wait();

        // Backend verifies tx hash and updates DB.
        const response = await api.post(`/api/milestones/${campaignId}/release`, {
          milestoneIndex: index,
          transactionHash: tx.hash,
        });

        const msg = response.data.onChainResult?.transactionHash
          ? `Funds released via Smart Contract!\n\nTx Hash:\n${response.data.onChainResult.transactionHash}`
          : "Funds released successfully!";

        alert(msg);
        fetchCampaigns();
        return;
      }

      // Fallback: call backend which may perform server-side release (admin tooling / offline mode).
      const response = await api.post(`/api/milestones/${campaignId}/release`, { milestoneIndex: index });

      const msg = response.data.onChainResult?.transactionHash
        ? `Funds released via Smart Contract!\n\nTx Hash:\n${response.data.onChainResult.transactionHash}`
        : "Funds released successfully!";

      alert(msg);
      fetchCampaigns();
    } catch (err: any) {
      console.error("Release error:", err);
      setError(err.response?.data?.error || "Failed to release funds via smart contract. Ensure you have the admin role.");
    } finally {
      setProcessingAction(null);
    }
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isHospital = user.role === "hospital";
  const isAdmin = user.role === "admin";

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950" />
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 z-10"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 pt-8 sm:pt-12 bg-slate-950">
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-900/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-10 relative z-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">
              {isHospital ? "Verify Milestones" : "Milestone Management"}
            </h1>
            <p className="text-slate-400 mt-2 font-medium">
              {isHospital
                ? "Confirm treatment milestones to enable fund release"
                : "Track and manage milestone progress for active campaigns"}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
            >
               Dashboard <FiArrowRight /> 
            </button>
          </motion.div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3">
            <FiAlertTriangle className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 font-medium text-sm">{error}</p>
          </motion.div>
        )}

        {campaigns.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 px-4 glass-card rounded-3xl border border-white/5">
            <div className="w-20 h-20 bg-slate-900/80 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 text-slate-500">
              <FiActivity className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No milestones found</h3>
            <p className="text-slate-400">
              {isHospital
                ? "No campaigns assigned to your hospital"
                : "No campaigns with milestones available at this time."}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {campaigns.map((campaign) => (
              <motion.div
                key={campaign._id}
                variants={itemVariants}
                className="glass-panel rounded-3xl border border-white/10 overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
                
                <div className="p-6 sm:p-8 relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/5 pb-6">
                    <div>
                      <h3
                        className="text-2xl font-bold text-white cursor-pointer hover:text-emerald-400 transition-colors mb-2"
                        onClick={() => navigate(`/campaign/${campaign._id}`)}
                      >
                        {campaign.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                        <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          {campaign.raisedAmount.toFixed(2)} / {campaign.targetAmount.toFixed(2)} ETH Raised
                        </span>
                        <span className={`px-3 py-1 rounded-full border uppercase tracking-wider text-[10px] sm:text-xs ${
                          campaign.status === 'active' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-slate-800 text-slate-400 border-white/5'
                        }`}>
                          {campaign.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    
                    {campaign.hospitalId && (
                      <div className="bg-slate-900/80 border border-white/5 px-4 py-3 rounded-2xl flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                          <FiActivity />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Assigned Facility</p>
                          <p className="text-white text-sm font-medium flex items-center gap-1.5">
                            {campaign.hospitalId.hospitalName}
                            {campaign.hospitalId.verified && <FiShield className="text-emerald-400 w-3 h-3" />}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {campaign.milestones.map((milestone, index) => {
                      const isConfirmed = milestone.status === "confirmed";
                      const isReleased = milestone.status === "released";
                      const isPending = milestone.status === "pending";

                      return (
                        <div
                          key={index}
                          className={`p-6 rounded-2xl border transition-all ${
                            isReleased
                              ? "bg-emerald-900/10 border-emerald-500/30"
                              : isConfirmed
                              ? "bg-indigo-900/10 border-indigo-500/30"
                              : "bg-slate-900/50 border-white/5"
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            
                            <div className="flex-1 flex gap-5">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                                isReleased ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                                isConfirmed ? "bg-indigo-500 text-white shadow-indigo-500/20" :
                                "bg-slate-800 text-slate-400 border border-white/5"
                              }`}>
                                {isReleased ? <FiDollarSign className="w-6 h-6" /> : isConfirmed ? <FiCheckCircle className="w-6 h-6" /> : <FiClock className="w-6 h-6" />}
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">M-{index + 1}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    isReleased ? "bg-emerald-500/20 text-emerald-400" :
                                    isConfirmed ? "bg-indigo-500/20 text-indigo-400" :
                                    "bg-amber-500/20 text-amber-400"
                                  }`}>
                                    {milestone.status}
                                  </span>
                                </div>
                                <p className={`text-lg font-bold mb-1 ${isReleased ? 'text-emerald-50' : isConfirmed ? 'text-indigo-50' : 'text-slate-200'}`}>
                                  {milestone.description}
                                </p>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                                  <p className="text-sm font-medium text-purple-400 border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 rounded-lg">
                                    {milestone.targetAmount.toFixed(4)} ETH
                                  </p>
                                  {milestone.confirmedAt && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                      <FiCheckCircle /> Confirmed: {new Date(milestone.confirmedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                  {milestone.releasedAt && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                      <FiDollarSign /> Released: {new Date(milestone.releasedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                              {isPending && isHospital && (
                                <div className="flex flex-col gap-2 w-full lg:w-auto">
                                  <button
                                    onClick={() => confirmMilestone(campaign._id, index)}
                                    disabled={
                                      processingAction?.type === "confirm" &&
                                      processingAction?.campaignId === campaign._id &&
                                      processingAction?.index === index
                                    }
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                  >
                                    {processingAction?.type === "confirm" ? (
                                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying</>
                                    ) : (
                                      <><FiCheckCircle /> Verify Completion</>
                                    )}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        setProcessingAction({ type: "confirm", campaignId: campaign._id, index });
                                        await api.post(`/api/milestones/${campaign._id}/confirm`, { milestoneIndex: index });
                                        alert("Backend test milestone confirmed!");
                                        fetchCampaigns();
                                      } catch (err: any) {
                                        alert(err.response?.data?.error || "Error");
                                      } finally { 
                                        setProcessingAction(null); 
                                      }
                                    }}
                                    disabled={
                                      processingAction?.type === "confirm" &&
                                      processingAction?.campaignId === campaign._id &&
                                      processingAction?.index === index
                                    }
                                    className="px-6 py-3 bg-slate-800 border border-slate-600 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                  >
                                    Test Bypass (Backend)
                                  </button>
                                </div>
                              )}

                              {isConfirmed && (isAdmin || user.role === "patient") && (
                                <div className="flex flex-col gap-2 w-full lg:w-auto">
                                  <button
                                    onClick={() => releaseMilestone(campaign._id, index)}
                                    disabled={
                                      processingAction?.type === "release" &&
                                      processingAction?.campaignId === campaign._id &&
                                      processingAction?.index === index
                                    }
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                  >
                                    {processingAction?.type === "release" ? (
                                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing Tx</>
                                    ) : (
                                      <><FiDollarSign /> Release Funds</>
                                    )}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        setProcessingAction({ type: "release", campaignId: campaign._id, index });
                                        await api.post(`/api/milestones/${campaign._id}/release`, { milestoneIndex: index });
                                        alert("Backend test funds released!");
                                        fetchCampaigns();
                                      } catch (err: any) {
                                        alert(err.response?.data?.error || "Error");
                                      } finally { 
                                        setProcessingAction(null); 
                                      }
                                    }}
                                    disabled={
                                      processingAction?.type === "release" &&
                                      processingAction?.campaignId === campaign._id &&
                                      processingAction?.index === index
                                    }
                                    className="px-6 py-3 bg-slate-800 border border-slate-600 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                  >
                                    Test Bypass (Backend)
                                  </button>
                                </div>
                              )}
                              
                              {isReleased && (
                                <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-default shrink-0 w-full lg:w-auto">
                                  <FiCheckCircle /> Funds Released
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })}
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
