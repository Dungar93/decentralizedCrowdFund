const mongoose = require('mongoose');

const kycDocumentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  documentType: {
    type: String,
    required: true,
    enum: ['aadhaar', 'pan', 'passport', 'voter_id', 'driving_license', 'other']
  },
  documentNumber: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  documents: [{
    url: String,
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  notes: String
}, {
  timestamps: true
});

// Index for efficient queries
kycDocumentSchema.index({ user: 1, status: 1 });
kycDocumentSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.model('KYCDocument', kycDocumentSchema);
