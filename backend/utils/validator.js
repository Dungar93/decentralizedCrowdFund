const { z } = require('zod');

// User schemas
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'hospital', 'admin']).optional(),
  phone: z.string().optional(),
  walletAddress: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional()
});

// Campaign schemas
const createCampaignSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000, 'Description must be less than 5000 characters'),
  targetAmount: z.number().positive('Target amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  patientName: z.string().min(2, 'Patient name is required'),
  patientAge: z.number().positive().optional(),
  hospitalName: z.string().min(2, 'Hospital name is required'),
  hospitalWallet: z.string().optional(),
  medicalDocuments: z.array(z.string()).optional(),
  milestones: z.array(z.object({
    description: z.string().min(10, 'Milestone description must be at least 10 characters'),
    targetAmount: z.number().positive('Milestone amount must be positive')
  })).min(1, 'At least one milestone is required')
});

const updateCampaignSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  description: z.string().min(50).max(5000).optional(),
  targetAmount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled']).optional()
});

// Donation schemas
const createDonationSchema = z.object({
  campaignId: z.string().mongooseId('Invalid campaign ID'),
  amount: z.number().positive('Donation amount must be positive'),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional(),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
  isAnonymous: z.boolean().optional()
});

// Milestone schemas
const confirmMilestoneSchema = z.object({
  milestoneIndex: z.number().int().nonnegative('Invalid milestone index'),
  hospitalWallet: z.object({
    address: z.string(),
    privateKey: z.string()
  }).optional()
});

// Hospital schemas
const verifyHospitalLicenseSchema = z.object({
  licenseNumber: z.string().min(6, 'License number must be at least 6 characters'),
  hospitalName: z.string().min(2, 'Hospital name is required'),
  state: z.string().optional()
});

const hospitalUpdateSchema = z.object({
  hospitalName: z.string().min(2).optional(),
  licenseNumber: z.string().min(6).optional(),
  specialization: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional()
});

// Admin schemas
const approveCampaignSchema = z.object({
  adminNotes: z.string().max(1000, 'Admin notes must be less than 1000 characters').optional()
});

const refundDonationSchema = z.object({
  donationId: z.string().mongooseId('Invalid donation ID'),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional()
});

// Validation middleware factory
function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      next(error);
    }
  };
}

// Query parameter validation
const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().default(1)),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(100).default(10))
});

function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors
        });
      }
      next(error);
    }
  };
}

module.exports = {
  // Schemas
  signupSchema,
  loginSchema,
  profileUpdateSchema,
  createCampaignSchema,
  updateCampaignSchema,
  createDonationSchema,
  confirmMilestoneSchema,
  verifyHospitalLicenseSchema,
  hospitalUpdateSchema,
  approveCampaignSchema,
  refundDonationSchema,
  paginationSchema,
  // Middleware
  validate,
  validateQuery
};
