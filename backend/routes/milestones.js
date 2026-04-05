const express = require('express');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const AuditLog = require('../models/AuditLog');
const SmartContract = require('../models/SmartContract');
const User = require('../models/User');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { ethers } = require('ethers');
const {
  confirmMilestoneOnChain,
  releaseMilestoneOnChain,
  getContractInstance,
  getContractBalance,
} = require('../utils/contractUtils');

const router = express.Router();

// @route   POST /api/milestones/:campaignId/confirm
// @desc    Hospital confirms a treatment milestone
// @access  Private (Hospital role)
router.post('/:campaignId/confirm', authMiddleware, roleMiddleware(['hospital']), async (req, res) => {
  try {
    const { milestoneIndex, transactionHash } = req.body;

    if (milestoneIndex === undefined || milestoneIndex < 0) {
      return res.status(400).json({ error: 'Valid milestone index is required' });
    }

    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Verify this hospital is associated with the campaign
    if (!campaign.hospitalId || campaign.hospitalId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: 'Not authorized - this hospital is not associated with the campaign'
      });
    }

    if (!campaign.milestones || !campaign.milestones[milestoneIndex]) {
      return res.status(400).json({ error: 'Invalid milestone index' });
    }

    const milestone = campaign.milestones[milestoneIndex];

    if (milestone.status === 'confirmed') {
      return res.status(400).json({ error: 'Milestone already confirmed' });
    }

    if (milestone.status === 'released') {
      return res.status(400).json({ error: 'Milestone already released' });
    }

    // If smart contract is deployed, verify the transactionHash from hospital
    let onChainResult = null;
    if (campaign.smartContractAddress) {
      if (!transactionHash) {
        return res.status(400).json({ 
          error: 'On-chain transaction hash is required for deployed campaigns. Please sign the confirm transaction from your wallet.' 
        });
      }

      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
      try {
        console.log(`Verifying milestone ${milestoneIndex} tx on contract ${campaign.smartContractAddress}`);

        const receipt = await provider.getTransactionReceipt(transactionHash);
        if (!receipt) {
          await provider.waitForTransaction(transactionHash);
        }

        const finalReceipt = await provider.getTransactionReceipt(transactionHash);
        if (!finalReceipt || finalReceipt.status === 0) {
          return res.status(400).json({ error: 'Transaction failed on blockchain' });
        }

        // Verify transaction was to the correct contract
        if (finalReceipt.to?.toLowerCase() !== campaign.smartContractAddress.toLowerCase()) {
          return res.status(400).json({ error: 'Transaction was not sent to the correct campaign contract' });
        }

        onChainResult = {
          success: true,
          transactionHash,
          blockNumber: finalReceipt.blockNumber,
        };
      } catch (txError) {
        console.error('On-chain confirmation error:', txError.message);
        return res.status(400).json({ error: 'Failed to verify transaction: ' + txError.message });
      }
    }

    // Update milestone status
    milestone.status = 'confirmed';
    milestone.confirmedAt = new Date();
    await campaign.save();

    // Update smart contract record
    if (campaign.smartContractAddress) {
      await SmartContract.findOneAndUpdate(
        { contractAddress: campaign.smartContractAddress },
        {
          $set: {
            [`milestones.${milestoneIndex}.confirmed`]: true,
          },
        }
      );
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user.userId,
      action: 'milestone_confirmed',
      entityType: 'milestone',
      entityId: campaign._id,
      details: {
        milestoneIndex,
        milestoneDescription: milestone.description,
        targetAmount: milestone.targetAmount,
        onChain: !!onChainResult && !onChainResult.databaseOnly,
      },
      status: 'success',
    });

    res.json({
      message: 'Milestone confirmed successfully',
      milestone,
      onChainResult,
      nextStep: 'Funds can now be released by calling the release endpoint',
    });
  } catch (error) {
    console.error('Milestone confirmation error:', error);
    res.status(500).json({ error: `Failed to confirm milestone: ${error.message}` });
  }
});

// @route   POST /api/milestones/:campaignId/release
// @desc    Release funds for a confirmed milestone (Patient/Admin only)
// @access  Private (Patient/Admin role)
router.post('/:campaignId/release', authMiddleware, roleMiddleware(['patient', 'admin']), async (req, res) => {
  try {
    const { milestoneIndex } = req.body;

    if (milestoneIndex === undefined || milestoneIndex < 0) {
      return res.status(400).json({ error: 'Valid milestone index is required' });
    }

    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check permission - patient who created it or admin
    if (req.user.role !== 'admin' && campaign.patientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to release funds for this campaign' });
    }

    if (!campaign.milestones || !campaign.milestones[milestoneIndex]) {
      return res.status(400).json({ error: 'Invalid milestone index' });
    }

    const milestone = campaign.milestones[milestoneIndex];

    if (milestone.status !== 'confirmed') {
      return res.status(400).json({
        error: 'Milestone must be confirmed by hospital before funds can be released'
      });
    }

    if (milestone.status === 'released') {
      return res.status(400).json({ error: 'Milestone funds already released' });
    }

    let onChainResult = null;

    // If smart contract is deployed, interact with it
    if (campaign.smartContractAddress) {
      try {
        console.log(`Releasing milestone ${milestoneIndex} on contract ${campaign.smartContractAddress}`);

        // Call the smart contract to release funds
        const releaseResult = await releaseMilestoneOnChain(
          campaign.smartContractAddress,
          milestoneIndex
        );

        onChainResult = {
          success: true,
          transactionHash: releaseResult.transactionHash,
          blockNumber: releaseResult.blockNumber,
          gasUsed: releaseResult.gasUsed,
        };

        // Get contract balance after release
        const balance = await getContractBalance(campaign.smartContractAddress);
        onChainResult.remainingBalance = balance;

      } catch (contractError) {
        console.error('Smart contract release error:', contractError.message);

        // Check if it's a gas/balance issue
        if (contractError.message.includes('insufficient funds')) {
          return res.status(400).json({
            error: 'Insufficient funds in contract for this milestone',
            onChainError: contractError.message,
          });
        }

        // Continue with database update for offline mode
        onChainResult = {
          error: contractError.message,
          databaseOnly: true,
        };
      }
    }

    // Update milestone status
    milestone.status = 'released';
    milestone.releasedAt = new Date();
    await campaign.save();

    // Update smart contract record
    if (campaign.smartContractAddress) {
      await SmartContract.findOneAndUpdate(
        { contractAddress: campaign.smartContractAddress },
        {
          $set: {
            [`milestones.${milestoneIndex}.confirmed`]: true,
            [`milestones.${milestoneIndex}.releasedAt`]: new Date(),
            status: 'active',
          },
        }
      );
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user.userId,
      action: 'milestone_funds_released',
      entityType: 'milestone',
      entityId: campaign._id,
      details: {
        milestoneIndex,
        milestoneDescription: milestone.description,
        amount: milestone.targetAmount,
        onChain: !!onChainResult && !onChainResult.databaseOnly,
        transactionHash: onChainResult?.transactionHash,
      },
      status: 'success',
    });

    // Update related donations status
    await Donation.updateMany(
      { campaignId: campaign._id, status: 'locked_in_escrow' },
      { status: 'released' }
    );

    res.json({
      message: 'Milestone funds released successfully',
      milestone,
      onChainResult,
    });
  } catch (error) {
    console.error('Milestone release error:', error);
    res.status(500).json({ error: `Failed to release milestone funds: ${error.message}` });
  }
});

// @route   GET /api/milestones/:campaignId
// @desc    Get all milestones for a campaign
// @access  Public
router.get('/:campaignId', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId)
      .select('milestones hospitalId');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      milestones: campaign.milestones || [],
      hospitalId: campaign.hospitalId,
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch milestones: ${error.message}` });
  }
});

// @route   GET /api/milestones/hospital/my-campaigns
// @desc    Get all campaigns associated with logged-in hospital
// @access  Private (Hospital role)
router.get('/hospital/my-campaigns', authMiddleware, roleMiddleware(['hospital']), async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      hospitalId: req.user.userId,
    }).select('title description status milestones raisedAmount targetAmount');

    res.json({ campaigns });
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch hospital campaigns: ${error.message}` });
  }
});

module.exports = router;
