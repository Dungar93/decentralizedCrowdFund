const express = require('express');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const SmartContract = require('../models/SmartContract');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get all transactions for current user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, status, limit = 50, campaignId } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Build filter based on user role
    let filter = {};

    // Role-based filtering
    if (userRole === 'donor') {
      filter.donorId = userId;
    } else if (userRole === 'patient') {
      // Patients see all transactions for their campaigns
      const patientCampaigns = await Campaign.find({ patientId: userId }).select('_id');
      const campaignIds = patientCampaigns.map(c => c._id);
      filter.campaignId = { $in: campaignIds };
    } else if (userRole === 'hospital') {
      // Hospitals see transactions for their assigned campaigns
      const hospitalCampaigns = await Campaign.find({ hospitalId: userId }).select('_id');
      const campaignIds = hospitalCampaigns.map(c => c._id);
      filter.campaignId = { $in: campaignIds };
    } else if (userRole !== 'admin') {
      // Default: show user's own donations
      filter.donorId = userId;
    }

    // Apply additional filters
    if (type) {
      filter.type = type;
    }
    if (status) {
      filter.status = status;
    }
    if (campaignId) {
      filter.campaignId = campaignId;
    }

    // Fetch transactions (donations)
    const donations = await Donation.find(filter)
      .populate('campaignId', 'title status smartContractAddress')
      .populate('donorId', 'name email walletAddress')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Map donations to unified transaction format
    const transactions = donations.map(d => ({
      _id: d._id,
      type: 'donation',
      amount: d.amount,
      currency: d.currency || 'ETH',
      status: d.status,
      txHash: d.transactionHash,
      refundTxHash: d.refundTxHash,
      campaignId: d.campaignId,
      donorId: d.donorId,
      donorName: d.anonymous ? 'Anonymous' : (d.donorId?.name || 'Anonymous'),
      createdAt: d.createdAt,
      confirmedAt: d.confirmedAt || d.blockNumber ? new Date(d.blockNumber * 12000) : d.createdAt,
      description: `Donation to ${d.campaignId?.title || 'campaign'}`,
      donorMessage: d.donorMessage,
      escrowDetails: d.escrowDetails,
    }));

    // Get transaction count
    const total = await Donation.countDocuments(filter);

    // Calculate summary statistics
    const stats = await Donation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
        },
      },
    ]);

    const statusBreakdown = {};
    stats.forEach(s => {
      statusBreakdown[s._id] = {
        count: s.count,
        totalAmount: s.totalAmount,
      };
    });

    res.json({
      transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        showing: transactions.length,
      },
      summary: {
        totalTransactions: total,
        totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
        byStatus: statusBreakdown,
      },
    });
  } catch (error) {
    logger.error(`Transactions fetch error: ${error.message}`, error);
    res.status(500).json({ error: `Failed to fetch transactions: ${error.message}` });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction details
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('campaignId', 'title status smartContractAddress')
      .populate('donorId', 'name email walletAddress');

    if (!donation) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check permission
    const userRole = req.user.role;
    const isDonor = donation.donorId?._id.toString() === req.user.userId;
    const isCampaignOwner = donation.campaignId?.patientId?.toString() === req.user.userId;
    const isAdmin = userRole === 'admin';

    if (!isDonor && !isCampaignOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this transaction' });
    }

    // Get smart contract details if available
    let smartContract = null;
    if (donation.campaignId?.smartContractAddress) {
      smartContract = await SmartContract.findOne({
        contractAddress: donation.campaignId.smartContractAddress
      });
    }

    const transaction = {
      _id: donation._id,
      type: 'donation',
      amount: donation.amount,
      currency: donation.currency || 'ETH',
      status: donation.status,
      txHash: donation.transactionHash,
      refundTxHash: donation.refundTxHash,
      refundReason: donation.refundReason,
      refundedAt: donation.refundedAt,
      campaignId: donation.campaignId,
      donorId: donation.donorId,
      donorName: donation.anonymous ? 'Anonymous' : (donation.donorId?.name || 'Anonymous'),
      createdAt: donation.createdAt,
      blockNumber: donation.blockNumber,
      gasUsed: donation.gasUsed,
      description: `Donation to ${donation.campaignId?.title || 'campaign'}`,
      donorMessage: donation.donorMessage,
      escrowDetails: donation.escrowDetails,
      smartContract,
    };

    res.json({ transaction });
  } catch (error) {
    logger.error(`Transaction details fetch error: ${error.message}`, error);
    res.status(500).json({ error: `Failed to fetch transaction details: ${error.message}` });
  }
});

// @route   GET /api/transactions/export/csv
// @desc    Export transactions as CSV
// @access  Private
router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const { type, status, startDate, endDate } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Build filter
    let filter = {};

    if (userRole === 'donor') {
      filter.donorId = userId;
    } else if (userRole === 'patient') {
      const patientCampaigns = await Campaign.find({ patientId: userId }).select('_id');
      const campaignIds = patientCampaigns.map(c => c._id);
      filter.campaignId = { $in: campaignIds };
    } else if (userRole === 'admin') {
      // Admin can filter by date range
      if (startDate) {
        filter.createdAt = { $gte: new Date(startDate) };
      }
      if (endDate) {
        filter.createdAt = filter.createdAt || {};
        filter.createdAt.$lte = new Date(endDate);
      }
    } else {
      filter.donorId = userId;
    }

    if (status) {
      filter.status = status;
    }

    const donations = await Donation.find(filter)
      .populate('campaignId', 'title')
      .populate('donorId', 'name')
      .sort({ createdAt: -1 })
      .limit(1000);

    // Generate CSV
    const csvRows = [];

    // Header
    csvRows.push('Date,Type,Amount,Currency,Status,Transaction Hash,Donor,Campaign,Refund Tx Hash');

    // Data rows
    donations.forEach(d => {
      const row = [
        d.createdAt.toISOString().split('T')[0],
        'donation',
        d.amount,
        d.currency || 'ETH',
        d.status,
        d.transactionHash || '',
        d.anonymous ? 'Anonymous' : (d.donorId?.name || 'Unknown'),
        d.campaignId?.title || 'Unknown',
        d.refundTxHash || '',
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    logger.error(`CSV export error: ${error.message}`, error);
    res.status(500).json({ error: `Failed to export transactions: ${error.message}` });
  }
});

// @route   GET /api/transactions/summary
// @desc    Get transaction summary statistics
// @access  Private
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Build filter based on role
    let filter = {};
    if (userRole === 'donor') {
      filter.donorId = userId;
    } else if (userRole === 'patient') {
      const patientCampaigns = await Campaign.find({ patientId: userId }).select('_id');
      const campaignIds = patientCampaigns.map(c => c._id);
      filter.campaignId = { $in: campaignIds };
    } else if (userRole === 'hospital') {
      const hospitalCampaigns = await Campaign.find({ hospitalId: userId }).select('_id');
      const campaignIds = hospitalCampaigns.map(c => c._id);
      filter.campaignId = { $in: campaignIds };
    }

    // Get summary statistics
    const summary = await Donation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' },
        },
      },
    ]);

    // Get status breakdown
    const byStatus = await Donation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
        },
      },
    ]);

    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Donation.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, ...filter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      summary: summary[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        avgAmount: 0,
        maxAmount: 0,
        minAmount: 0,
      },
      byStatus: byStatus.reduce((acc, s) => {
        acc[s._id] = { count: s.count, totalAmount: s.totalAmount };
        return acc;
      }, {}),
      monthlyTrend: monthlyTrend.map(m => ({
        month: m._id.month,
        year: m._id.year,
        count: m.count,
        amount: m.amount,
      })),
    });
  } catch (error) {
    logger.error(`Transaction summary error: ${error.message}`, error);
    res.status(500).json({ error: `Failed to fetch transaction summary: ${error.message}` });
  }
});

module.exports = router;
