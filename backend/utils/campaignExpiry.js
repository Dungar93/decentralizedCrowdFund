/**
 * Campaign Expiry Cron Job
 * Runs periodically to close campaigns that have passed their expiresAt date
 * without reaching their funding goal.
 */

const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const AuditLog = require('../models/AuditLog');
const { emitToAll, emitToRoom } = require('./socket');
const logger = require('./logger');

let cronInterval = null;

/**
 * Check and expire campaigns that have passed their expiresAt date.
 */
async function expireCampaigns() {
  try {
    const now = new Date();

    // Find active campaigns whose expiresAt is in the past
    const expiredCampaigns = await Campaign.find({
      status: 'active',
      expiresAt: { $lte: now },
    }).populate('patientId', 'email name');

    if (expiredCampaigns.length === 0) return;

    logger.info(`Campaign expiry job: found ${expiredCampaigns.length} expired campaigns`);

    for (const campaign of expiredCampaigns) {
      campaign.status = 'completed'; // or 'expired' — using completed to avoid enum change
      await campaign.save();

      // Create audit log
      await AuditLog.create({
        userId: null,
        action: 'campaign_expired',
        entityType: 'campaign',
        entityId: campaign._id,
        details: {
          title: campaign.title,
          raisedAmount: campaign.raisedAmount,
          targetAmount: campaign.targetAmount,
          expiredAt: now,
        },
        status: 'success',
      });

      // Notify sockets
      try {
        emitToAll('campaign:expired', {
          campaignId: campaign._id,
          title: campaign.title,
          expiredAt: now,
        });
        if (campaign.patientId?._id) {
          emitToRoom(`user:${campaign.patientId._id.toString()}`, 'campaign:expired', {
            campaignId: campaign._id,
            title: campaign.title,
            expiredAt: now,
          });
        }
      } catch (socketErr) {
        // Socket may not be initialized in test environments
      }

      logger.info(`Campaign ${campaign._id} ("${campaign.title}") marked as completed (expired)`);
    }
  } catch (err) {
    logger.error(`Campaign expiry job error: ${err.message}`, err);
  }
}

/**
 * Start the campaign expiry cron job.
 * @param {number} intervalMinutes - How often to check (default: 60 minutes)
 */
function startExpiryJob(intervalMinutes = 60) {
  if (cronInterval) return; // Already running

  logger.info(`Starting campaign expiry job (every ${intervalMinutes} min)`);

  // Run immediately on startup, then on interval
  expireCampaigns();
  cronInterval = setInterval(expireCampaigns, intervalMinutes * 60 * 1000);
}

/**
 * Stop the background job (useful for tests).
 */
function stopExpiryJob() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
}

module.exports = { startExpiryJob, stopExpiryJob, expireCampaigns };
