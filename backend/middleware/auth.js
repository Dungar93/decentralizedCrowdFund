const { verifyToken } = require('../utils/jwtUtils');
const AuditLog = require('../models/AuditLog');

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({ error: `Auth error: ${error.message}` });
  }
};

// Middleware to check user role
const roleMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const hasRole = Array.isArray(requiredRoles)
      ? requiredRoles.includes(req.user.role)
      : req.user.role === requiredRoles;

    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions. Required role(s): ' + 
               (Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles)
      });
    }

    next();
  };
};

// Middleware to log audit trail
const auditLogMiddleware = async (req, res, next) => {
  // Store original res.json method
  const originalJson = res.json;

  const inferAudit = () => {
    const p = req.path || '';
    const m = (req.method || '').toUpperCase();

    // Admin routes
    if (p.startsWith('/admin/')) {
      if (p.includes('/audit-logs')) return { action: 'api_call', entityType: 'audit_log' };
      if (p.includes('/contracts')) return { action: 'api_call', entityType: 'smart_contract' };
      if (p.includes('/campaigns') && m === 'POST') return { action: 'admin_campaign_decision', entityType: 'campaign' };
      if (p.includes('/users') && (m === 'PUT')) return { action: 'admin_user_update', entityType: 'user' };
      if (p.includes('/users') && (m === 'DELETE')) return { action: 'admin_user_deactivated', entityType: 'user' };
      return { action: 'api_call' };
    }

    // Auth routes
    if (p.startsWith('/auth/')) {
      if (p.endsWith('/login') && m === 'POST') return { action: 'user_login', entityType: 'user' };
      if (p.endsWith('/signup') && m === 'POST') return { action: 'user_signup', entityType: 'user' };
      if (p.endsWith('/verify-wallet') && m === 'POST') return { action: 'api_call', entityType: 'user' };
      return { action: 'api_call' };
    }

    // Campaign routes
    if (p.startsWith('/campaigns')) {
      if (p === '/campaigns' && m === 'POST') return { action: 'campaign_created', entityType: 'campaign' };
      if (m === 'PUT') return { action: 'campaign_updated', entityType: 'campaign' };
      if (m === 'DELETE') return { action: 'campaign_deleted', entityType: 'campaign' };
      if (p.endsWith('/deploy-contract') && m === 'POST') return { action: 'smart_contract_deployed', entityType: 'smart_contract' };
      return { action: 'api_call', entityType: 'campaign' };
    }

    // Donation routes
    if (p.startsWith('/donations')) {
      if (p === '/donations' && m === 'POST') return { action: 'donation_created', entityType: 'donation' };
      if (p.endsWith('/refund') && m === 'POST') return { action: 'donation_refunded', entityType: 'donation' };
      return { action: 'api_call', entityType: 'donation' };
    }

    // Milestone routes
    if (p.startsWith('/milestones')) {
      if (p.endsWith('/confirm') && m === 'POST') return { action: 'milestone_confirmed', entityType: 'milestone' };
      if (p.endsWith('/release') && m === 'POST') return { action: 'funds_released', entityType: 'milestone' };
      return { action: 'api_call', entityType: 'milestone' };
    }

    return { action: 'api_call' };
  };

  // Override res.json to capture response
  res.json = function (data) {
    // Log the action after response is sent
    if (req.user) {
      const inferred = inferAudit();
      const logEntry = new AuditLog({
        userId: req.user.userId,
        action: req.body.action || inferred.action || 'api_call',
        entityType: req.body.entityType || inferred.entityType,
        entityId: req.body.entityId,
        details: {
          path: req.path,
          method: req.method,
          ...req.body,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: res.statusCode >= 400 ? 'failure' : 'success',
        errorMessage: data.error || null,
      });
      
      logEntry.save().catch(err => console.error('Audit log error:', err));
    }

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  auditLogMiddleware,
};
