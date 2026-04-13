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
const { sendMilestoneConfirmedEmail, sendFundsReleasedEmail } = require('../utils/emailService');
const { getIO } = require('../utils/socket');
const logger = require('../utils/logger');

const router = express.Router();

// Get IO instance for emitting events
const getIoInstance = () => {
  try {
    return getIO();
  } catch (e) {
    logger.warn('Socket.IO not initialized');
    return null;
  }
};

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
      if (transactionHash) {
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

          const txDetails = await provider.getTransaction(transactionHash);
          if (!txDetails) {
            return res.status(400).json({ error: 'Transaction details not found on blockchain' });
          }

          // Verify sender matches the hospital's linked wallet address
          const hospitalUser = await User.findById(req.user.userId).select('walletAddress');
          if (!hospitalUser?.walletAddress) {
            return res.status(400).json({ error: 'Hospital wallet is not linked. Please link/verify your wallet first.' });
          }
          if ((txDetails.from || '').toLowerCase() !== hospitalUser.walletAddress.toLowerCase()) {
            return res.status(400).json({ error: 'Transaction sender does not match hospital linked wallet address' });
          }

          // Verify calldata is confirmMilestone(milestoneIndex) and value is 0
          const iface = new ethers.Interface(['function confirmMilestone(uint256 index)']);
          let parsed = null;
          try {
            parsed = iface.parseTransaction({ data: txDetails.data, value: txDetails.value });
          } catch (e) {
            return res.status(400).json({ error: 'Transaction data does not match confirmMilestone() call' });
          }
          if (!parsed || parsed.name !== 'confirmMilestone') {
            return res.status(400).json({ error: 'Transaction is not a confirmMilestone() call' });
          }

          const argIndex = Number(parsed.args?.[0]);
          if (Number.isNaN(argIndex) || argIndex !== Number(milestoneIndex)) {
            return res.status(400).json({ error: 'Transaction milestone index does not match requested index' });
          }
          if (txDetails.value && txDetails.value !== 0n) {
            return res.status(400).json({ error: 'confirmMilestone() transaction must not send ETH value' });
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
      } else {
        // Fallback for Backend test bypass
        try {
          console.log(`Confirming milestone ${milestoneIndex} directly from backend on contract ${campaign.smartContractAddress}`);
          
          const hospitalUser = await User.findById(req.user.userId).select('walletAddress');
          if (!hospitalUser?.walletAddress) {
            return res.status(400).json({ error: 'Hospital wallet is not linked. Please link/verify your wallet first.' });
          }

          const confirmResult = await confirmMilestoneOnChain(
            campaign.smartContractAddress,
            milestoneIndex,
            hospitalUser.walletAddress
          );

          onChainResult = {
            success: true,
            transactionHash: confirmResult.transactionHash,
            blockNumber: confirmResult.blockNumber,
            gasUsed: confirmResult.gasUsed,
          };
        } catch (contractError) {
          console.error('Smart contract backend confirm error:', contractError.message);
          return res.status(400).json({
            error: 'Failed to execute backend confirmation: ' + contractError.message
          });
        }
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

    // Emit socket events for real-time update
    const io = getIoInstance();
    if (io) {
      io.to(`campaign:${campaign._id}`).emit('milestone:confirmed', {
        campaignId: campaign._id,
        milestoneIndex,
        milestoneDescription: milestone.description,
        confirmedAt: new Date(),
      });

      // Emit to patient's user room
      if (campaign.patientId) {
        io.to(`user:${campaign.patientId.toString()}`).emit('milestone:confirmed', {
          campaignId: campaign._id,
          milestoneIndex,
          milestoneDescription: milestone.description,
          confirmedAt: new Date(),
        });
      }

      logger.info(`Emitted milestone:confirmed event for campaign ${campaign._id}`);
    }

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
    const { milestoneIndex, transactionHash } = req.body;

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

    // If smart contract is deployed, either:
    // - verify a client-signed on-chain release tx (preferred for patient non-custodial flow), OR
    // - fallback to server-signed release (legacy / admin tooling).
    if (campaign.smartContractAddress) {
      if (transactionHash) {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
        try {
          const receipt = await provider.getTransactionReceipt(transactionHash);
          if (!receipt) {
            await provider.waitForTransaction(transactionHash);
          }

          const finalReceipt = await provider.getTransactionReceipt(transactionHash);
          if (!finalReceipt || finalReceipt.status === 0) {
            return res.status(400).json({ error: 'Release transaction failed on blockchain' });
          }

          if (finalReceipt.to?.toLowerCase() !== campaign.smartContractAddress.toLowerCase()) {
            return res.status(400).json({ error: 'Transaction was not sent to the correct campaign contract' });
          }

          const txDetails = await provider.getTransaction(transactionHash);
          if (!txDetails) {
            return res.status(400).json({ error: 'Transaction details not found on blockchain' });
          }

          // If the caller is patient, enforce that tx sender matches their linked wallet.
          // If caller is admin, require linked wallet too (or omit transactionHash and use server-signed fallback).
          const caller = await User.findById(req.user.userId).select('walletAddress role');
          if (!caller?.walletAddress) {
            return res.status(400).json({ error: 'Caller wallet is not linked. Provide no tx hash to use admin server release, or link your wallet.' });
          }
          if ((txDetails.from || '').toLowerCase() !== caller.walletAddress.toLowerCase()) {
            return res.status(400).json({ error: 'Transaction sender does not match caller linked wallet address' });
          }

          // Verify calldata is releaseMilestone(milestoneIndex) and value is 0
          const iface = new ethers.Interface(['function releaseMilestone(uint256 index)']);
          let parsed = null;
          try {
            parsed = iface.parseTransaction({ data: txDetails.data, value: txDetails.value });
          } catch (e) {
            return res.status(400).json({ error: 'Transaction data does not match releaseMilestone() call' });
          }
          if (!parsed || parsed.name !== 'releaseMilestone') {
            return res.status(400).json({ error: 'Transaction is not a releaseMilestone() call' });
          }
          const argIndex = Number(parsed.args?.[0]);
          if (Number.isNaN(argIndex) || argIndex !== Number(milestoneIndex)) {
            return res.status(400).json({ error: 'Transaction milestone index does not match requested index' });
          }
          if (txDetails.value && txDetails.value !== 0n) {
            return res.status(400).json({ error: 'releaseMilestone() transaction must not send ETH value' });
          }

          onChainResult = {
            success: true,
            transactionHash,
            blockNumber: finalReceipt.blockNumber,
            gasUsed: finalReceipt.gasUsed?.toString?.() || undefined,
            verifiedOnly: true,
          };

          const balance = await getContractBalance(campaign.smartContractAddress);
          onChainResult.remainingBalance = balance;
        } catch (txError) {
          return res.status(400).json({ error: 'Failed to verify release transaction: ' + txError.message });
        }
      } else {
        try {
          console.log(`Releasing milestone ${milestoneIndex} on contract ${campaign.smartContractAddress}`);

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

          const balance = await getContractBalance(campaign.smartContractAddress);
          onChainResult.remainingBalance = balance;
        } catch (contractError) {
          console.error('Smart contract release error:', contractError.message);

          if (contractError.message.includes('insufficient funds')) {
            return res.status(400).json({
              error: 'Insufficient funds in contract for this milestone',
              onChainError: contractError.message,
            });
          }

          onChainResult = {
            error: contractError.message,
            databaseOnly: true,
          };
        }
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
      action: 'funds_released',
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

    // Send email notification to patient and hospital
    const io = getIoInstance();

    const patient = await User.findById(campaign.patientId);
    const hospital = await User.findById(campaign.hospitalId);

    if (patient?.email) {
      await sendFundsReleasedEmail(
        patient.email,
        campaign.title,
        milestone.description,
        milestone.targetAmount
      );
    }

    if (hospital?.email) {
      await sendFundsReleasedEmail(
        hospital.email,
        campaign.title,
        milestone.description,
        milestone.targetAmount
      );
    }

    // Emit socket events for real-time update
    if (io) {
      io.to(`campaign:${campaign._id}`).emit('milestone:released', {
        campaignId: campaign._id,
        milestoneIndex,
        milestoneDescription: milestone.description,
        amount: milestone.targetAmount,
        releasedAt: new Date(),
      });

      // Emit to patient's user room
      if (campaign.patientId) {
        io.to(`user:${campaign.patientId.toString()}`).emit('milestone:released', {
          campaignId: campaign._id,
          milestoneIndex,
          milestoneDescription: milestone.description,
          amount: milestone.targetAmount,
          releasedAt: new Date(),
        });
      }

      // Emit to hospital's user room
      if (campaign.hospitalId) {
        io.to(`user:${campaign.hospitalId.toString()}`).emit('milestone:released', {
          campaignId: campaign._id,
          milestoneIndex,
          milestoneDescription: milestone.description,
          amount: milestone.targetAmount,
          releasedAt: new Date(),
        });
      }

      logger.info(`Emitted milestone:released event for campaign ${campaign._id}`);
    }

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
    }).select('title description status milestones raisedAmount targetAmount smartContractAddress');

    res.json({ campaigns });
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch hospital campaigns: ${error.message}` });
  }
});

module.exports = router;
