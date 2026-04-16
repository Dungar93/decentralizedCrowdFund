import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShield, FiAlertTriangle, FiCheckCircle, FiXCircle,
  FiFileText, FiUser, FiDollarSign, FiEye, FiChevronRight,
  FiRefreshCw, FiWifi, FiActivity
} from 'react-icons/fi';
import api from '../services/api';

interface PatientRef {
  _id?: string;
  name?: string;
  email?: string;
}

interface HospitalRef {
  _id?: string;
  name?: string;
  hospitalName?: string;
  walletAddress?: string;
  verified?: boolean;
}

interface CampaignDoc {
  type?: string;
  documentType?: string;
  url?: string;
}

interface AiVerificationDetails {
  ocrConfidence?: number;
  metadataConsistency?: number;
  keywordMatch?: number;
  fileIntegrityScore?: number;
}

interface RiskData {
  riskScore?: number;
  finalRiskScore?: number;
  riskCategory?: string;
  recommendation?: string;
  // SRS v2.0 scoring breakdown
  tamperingScore?: number;
  aiGeneratedScore?: number;
  metadataMismatchScore?: number;
  // Legacy detailed breakdown
  aiVerificationDetails?: AiVerificationDetails;
}

interface Campaign {
  _id: string;
  title: string;
  description: string;
  targetAmount: number;
  status: string;
  patient?: PatientRef;
  patientId?: PatientRef;
  hospitalId?: HospitalRef;
  documents?: CampaignDoc[];
  riskAssessment?: RiskData;
  riskAssessmentId?: RiskData;
  createdAt: string;
  milestones?: Array<{
    description: string;
    targetAmount: number;
    status: string;
    confirmedAt?: string;
    releasedAt?: string;
  }>;
}

interface DonationRecord {
  _id: string;
  amount: number;
  status: string;
  donorId?: { name?: string; email?: string };
  createdAt: string;
}

function getPatient(c: Campaign): PatientRef | undefined {
  return c.patientId || c.patient;
}

function getRisk(c: Campaign): RiskData | null {
  const ra = c.riskAssessmentId || c.riskAssessment;
  if (!ra || typeof ra !== 'object') return null;
  return ra;
}

function primaryRiskScore(ra: RiskData): number {
  const n = ra.riskScore ?? ra.finalRiskScore;
  return typeof n === 'number' && !Number.isNaN(n) ? n : 0;
}

function docLabel(doc: CampaignDoc, idx: number): string {
  const t = doc.type || doc.documentType;
  if (t) return t.replace(/_/g, ' ');
  return `Document ${idx + 1}`;
}

export default function AdminCampaignReview() {
  const navigate = useNavigate();
  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  // Donation refund state
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundTarget, setRefundTarget] = useState<string | null>(null);
  const [refundError, setRefundError] = useState('');
  const [refundSuccess, setRefundSuccess] = useState('');

  useEffect(() => {
    fetchPendingCampaigns();
  }, []);

  const fetchPendingCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/campaigns/pending-review');
      setPendingCampaigns(res.data.campaigns || []);
    } catch (err: any) {
      console.error('Failed to fetch pending campaigns:', err);
      setError('Failed to load pending campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = useCallback(async (campaignId: string) => {
    try {
      setDonationsLoading(true);
      setDonations([]);
      const res = await api.get(`/api/donations?campaignId=${campaignId}`);
      const all: DonationRecord[] = res.data.donations || [];
      // Show only refundable donations
      setDonations(all.filter((d) => d.status === 'locked_in_escrow'));
    } catch (err: any) {
      console.error('Failed to fetch donations:', err);
    } finally {
      setDonationsLoading(false);
    }
  }, []);

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setRefundError('');
    setRefundSuccess('');
    setRefundTarget(null);
    setRefundReason('');
    fetchDonations(campaign._id);
  };

  const openCampaignDocument = async (campaignId: string, docIndex: number) => {
    try {
      const res = await api.get(`/api/admin/campaigns/${campaignId}/documents/${docIndex}`, {
        responseType: 'blob',
      });
      const ctype = res.headers['content-type'] || '';
      if (ctype.includes('application/json')) {
        const text = await res.data.text();
        try {
          const j = JSON.parse(text);
          alert(j.error || j.message || 'Could not open document');
        } catch {
          alert('Could not open document');
        }
        return;
      }
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to load document');
    }
  };

  const handleDecision = async (campaignId: string, decision: 'approve' | 'reject') => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      await api.post(`/api/admin/campaigns/${campaignId}/decision`, {
        decision,
        comments: reviewNote || '',
        overrideRiskScore: true,
      });

      setSuccess(`Campaign ${decision}d successfully`);
      setReviewNote('');
      setSelectedCampaign(null);
      fetchPendingCampaigns();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${decision} campaign`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async (donationId: string) => {
    if (!refundReason.trim()) {
      setRefundError('Please enter a reason for the refund.');
      return;
    }
    try {
      setRefundingId(donationId);
      setRefundError('');
      setRefundSuccess('');
      await api.post(`/api/donations/${donationId}/admin-refund`, { reason: refundReason.trim() });
      setRefundSuccess('Refund processed successfully.');
      setRefundTarget(null);
      setRefundReason('');
      // Refresh donations list
      if (selectedCampaign) fetchDonations(selectedCampaign._id);
    } catch (err: any) {
      setRefundError(err.response?.data?.error || 'Refund failed. Try again.');
    } finally {
      setRefundingId(null);
    }
  };

  const getRiskBadge = (score: number) => {
    if (score < 40) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold">
          <FiCheckCircle className="w-4 h-4" /> Low Risk
        </span>
      );
    } else if (score < 70) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold">
          <FiAlertTriangle className="w-4 h-4" /> Medium Risk
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-full text-xs font-bold">
          <FiXCircle className="w-4 h-4" /> High Risk
        </span>
      );
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 40) return 'text-emerald-400';
    if (score < 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const renderRiskBreakdown = (ra: RiskData) => {
    // First check for SRS v2.0 scoring breakdown (direct fields)
    if (
      ra.tamperingScore != null ||
      ra.aiGeneratedScore != null ||
      ra.metadataMismatchScore != null
    ) {
      // Normalize scores that might be stored as 0-100 or 0-1
      const normalize = (v: number | undefined) => {
        if (v == null) return 0;
        return v <= 1 ? v * 100 : v;
      };
      const tampering = normalize(ra.tamperingScore);
      const aiGen = normalize(ra.aiGeneratedScore);
      const metadata = normalize(ra.metadataMismatchScore);

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Tampering score</span>
            <span className={`font-bold ${getRiskColor(tampering)}`}>
              {tampering.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">AI-generated score</span>
            <span className={`font-bold ${getRiskColor(aiGen)}`}>
              {aiGen.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Metadata mismatch</span>
            <span className={`font-bold ${getRiskColor(metadata)}`}>
              {metadata.toFixed(0)}%
            </span>
          </div>
        </div>
      );
    }

    // Fallback to legacy aiVerificationDetails
    const d = ra.aiVerificationDetails;
    if (d && (d.ocrConfidence != null || d.metadataConsistency != null)) {
      const rows: { label: string; value: number }[] = [];
      if (d.ocrConfidence != null) rows.push({ label: 'OCR confidence', value: d.ocrConfidence });
      if (d.metadataConsistency != null) rows.push({ label: 'Metadata consistency', value: d.metadataConsistency });
      if (d.keywordMatch != null) rows.push({ label: 'Keyword match', value: d.keywordMatch });
      if (d.fileIntegrityScore != null) rows.push({ label: 'File integrity', value: d.fileIntegrityScore });
      return (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{row.label}</span>
              <span className={`font-bold ${getRiskColor(row.value)}`}>{row.value.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-500">No detailed breakdown available.</p>
        <p className="text-xs text-slate-600">Final risk score: {primaryRiskScore(ra)}</p>
      </div>
    );
  };

  /** Feature 6: Hospital Wallet Validation Panel */
  const renderHospitalWalletStatus = (campaign: Campaign) => {
    const hospital = campaign.hospitalId;

    if (!hospital) {
      return (
        <div className="p-3 bg-slate-800/60 border border-white/5 rounded-xl flex items-start gap-3">
          <FiUser className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hospital Assignment</p>
            <p className="text-sm text-slate-500">No hospital assigned yet. Contract deployment is blocked until a verified hospital is assigned.</p>
          </div>
        </div>
      );
    }

    const hospitalName = hospital.hospitalName || hospital.name || 'Assigned Hospital';

    if (!hospital.walletAddress) {
      return (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
          <FiAlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">⚠ Hospital Has No Wallet Linked</p>
            <p className="text-sm text-rose-300 font-medium">{hospitalName}</p>
            <p className="text-xs text-rose-300/70 mt-1">
              Contract deployment will fail (deploys to <code className="bg-rose-900/30 px-1 rounded">address(0)</code>).
              Ask the hospital to set their wallet in their Profile before you deploy.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
        <FiCheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Hospital Wallet Linked ✓</p>
          <p className="text-sm text-white font-medium">{hospitalName}</p>
          <p className="text-[10px] text-emerald-300/70 font-mono mt-1 truncate">
            {hospital.walletAddress}
          </p>
        </div>
      </div>
    );
  };

  /** Feature 8: Donor Refund Panel */
  const renderRefundPanel = () => {
    if (donationsLoading) {
      return (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
          <FiRefreshCw className="w-4 h-4 animate-spin" />
          Loading donations…
        </div>
      );
    }

    if (donations.length === 0) {
      return (
        <p className="text-sm text-slate-500 py-3">
          No refundable donations (all already released or refunded).
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {refundError && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {refundError}
          </p>
        )}
        {refundSuccess && (
          <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            {refundSuccess}
          </p>
        )}
        {donations.map((d) => {
          const donorLabel = d.donorId?.name || d.donorId?.email || 'Anonymous Donor';
          const isTargeted = refundTarget === d._id;
          return (
            <div key={d._id} className="p-3 bg-slate-900/60 border border-white/5 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{donorLabel}</p>
                  <p className="text-xs text-slate-500">
                    {parseFloat(d.amount as any).toFixed(4)} ETH · {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {!isTargeted ? (
                  <button
                    type="button"
                    onClick={() => { setRefundTarget(d._id); setRefundReason(''); setRefundError(''); setRefundSuccess(''); }}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                  >
                    Refund
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRefundTarget(null)}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {isTargeted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Reason for refund (required)…"
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                  <button
                    type="button"
                    disabled={refundingId === d._id}
                    onClick={() => handleRefund(d._id)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-lg text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {refundingId === d._id ? (
                      <><FiRefreshCw className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                      'Confirm Refund'
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 pb-20 pt-8 sm:pt-12">
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <FiShield className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-black text-white">Campaign Review</h1>
            </div>
            <p className="text-slate-400 font-medium mt-1">
              Review risk, open decrypted documents, then approve or reject
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
          >
            ← Back to Dashboard
          </button>
        </motion.div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
          >
            <p className="text-emerald-300 text-sm flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5" /> {success}
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl"
          >
            <p className="text-rose-300 text-sm flex items-center gap-2">
              <FiAlertTriangle className="w-5 h-5" /> {error}
            </p>
          </motion.div>
        )}

        {pendingCampaigns.length === 0 ? (
          <div className="glass-panel p-16 text-center rounded-3xl border border-white/5">
            <FiCheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
            <p className="text-slate-400">No campaigns pending review at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-4">
                Pending Campaigns ({pendingCampaigns.length})
              </h2>
              <AnimatePresence>
                {pendingCampaigns.map((campaign) => {
                  const risk = getRisk(campaign);
                  const score = risk ? primaryRiskScore(risk) : undefined;
                  const patient = getPatient(campaign);
                  return (
                    <motion.div
                      key={campaign._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectCampaign(campaign)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectCampaign(campaign);
                        }
                      }}
                      className={`glass-card p-5 rounded-2xl border cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 ${
                        selectedCampaign?._id === campaign._id
                          ? 'border-purple-500/50 shadow-lg shadow-purple-500/10'
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg line-clamp-1">
                            {campaign.title}
                          </h3>
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                            {campaign.description}
                          </p>
                        </div>
                        <FiChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <FiUser className="w-3 h-3" />
                            {patient?.name || patient?.email?.split('@')[0] || 'Patient'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <FiDollarSign className="w-3 h-3" />
                            {campaign.targetAmount} ETH
                          </span>
                        </div>
                        {score !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-black ${getRiskColor(score)}`}>
                              {score}
                            </span>
                            {getRiskBadge(score)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              {selectedCampaign ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 max-h-[85vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Review Campaign</h2>
                    <button
                      type="button"
                      onClick={() => setSelectedCampaign(null)}
                      className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
                      aria-label="Close panel"
                    >
                      <FiXCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Campaign Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-white text-lg mb-2">
                        {selectedCampaign.title}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {selectedCampaign.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-900/50 rounded-xl">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Target Amount</p>
                        <p className="text-white font-bold">{selectedCampaign.targetAmount} ETH</p>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-xl">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Patient</p>
                        <p className="text-white font-medium">
                          {getPatient(selectedCampaign)?.name || getPatient(selectedCampaign)?.email || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* --- Feature 6: Hospital Wallet Status --- */}
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FiWifi className="w-3.5 h-3.5" /> Hospital Wallet Status
                      </p>
                      {renderHospitalWalletStatus(selectedCampaign)}
                    </div>

                    {/* Risk Assessment */}
                    {(() => {
                      const ra = getRisk(selectedCampaign);
                      if (!ra) return null;
                      const score = primaryRiskScore(ra);
                      return (
                        <div className="p-4 bg-slate-900/50 rounded-xl">
                          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h4 className="font-bold text-white">Risk Assessment</h4>
                            {getRiskBadge(score)}
                          </div>
                          {ra.riskCategory && (
                            <p className="text-xs text-slate-500 uppercase font-bold mb-3">
                              Category: <span className="text-slate-300">{ra.riskCategory}</span>
                            </p>
                          )}
                          {renderRiskBreakdown(ra)}
                          {ra.recommendation && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Recommendation</p>
                              <p className="text-sm text-white font-medium capitalize">
                                {ra.recommendation.replace(/_/g, ' ')}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Documents */}
                    {selectedCampaign.documents && selectedCampaign.documents.length > 0 && (
                      <div>
                        <h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2">
                          <FiFileText className="w-4 h-4 text-purple-400" />
                          Campaign documents
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">
                          Files are encrypted on disk; opens decrypted copy (admin only).
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCampaign.documents.map((doc, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => openCampaignDocument(selectedCampaign._id, idx)}
                              className="px-3 py-2 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 rounded-lg text-sm text-violet-200 flex items-center gap-2 transition-colors"
                            >
                              <FiEye className="w-4 h-4 shrink-0" />
                              {docLabel(doc, idx)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Milestones */}
                    {selectedCampaign.milestones && selectedCampaign.milestones.length > 0 && (
                      <div>
                        <h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2">
                          <FiActivity className="w-4 h-4 text-purple-400" />
                          Treatment Milestones ({selectedCampaign.milestones.length})
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">
                          Funds are locked in escrow and released per milestone after hospital confirmation.
                        </p>
                        <div className="space-y-2">
                          {selectedCampaign.milestones.map((milestone, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-900/50 border border-white/5 rounded-xl flex items-center justify-between gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">
                                  {milestone.description}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Status: <span className="text-slate-300 capitalize">{milestone.status}</span>
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-purple-400">
                                  {milestone.targetAmount} ETH
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Review Note */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Review note (optional)
                    </label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      rows={3}
                      placeholder="Add any notes about your decision..."
                      className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white text-sm resize-none"
                    />
                  </div>

                  {/* Approve / Reject */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleDecision(selectedCampaign._id, 'approve')}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FiCheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(selectedCampaign._id, 'reject')}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FiXCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </div>

                  {/* --- Feature 8: Donor Refund Panel --- */}
                  <div className="pt-4 border-t border-white/5">
                    <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <FiDollarSign className="w-4 h-4 text-amber-400" />
                      Refund Donations
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Refundable donations (status: locked in escrow) for this campaign.
                    </p>
                    {renderRefundPanel()}
                  </div>
                </motion.div>
              ) : (
                <div className="glass-panel p-16 text-center rounded-3xl border border-white/5">
                  <FiEye className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Select a Campaign</h3>
                  <p className="text-slate-400">Click on a campaign from the list to review it.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
