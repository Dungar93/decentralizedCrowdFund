# MedTrustFund Backend - Complete Technical Documentation

> **Complete Backend Architecture, Theory, Implementation & Flow**  
> For: Official Project Submission  
> Version: 2.0 (Production-Ready)

---

## Table of Contents

1. [Backend Architecture Overview](#1-backend-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure & File Purposes](#3-directory-structure--file-purposes)
4. [Core Models (Database Schema)](#4-core-models-database-schema)
5. [Middleware & Security Layer](#5-middleware--security-layer)
6. [API Routes & Endpoints](#6-api-routes--endpoints)
7. [Business Logic Services](#7-business-logic-services)
8. [Smart Contract Interaction Layer](#8-smart-contract-interaction-layer)
9. [AI Verification Pipeline](#9-ai-verification-pipeline)
10. [Complete Data Flow Diagrams](#10-complete-data-flow-diagrams)
11. [Authentication & Authorization (RBAC)](#11-authentication--authorization-rbac)
12. [Testing Strategy & Test Suites](#12-testing-strategy--test-suites)
13. [Error Handling & Logging](#13-error-handling--logging)
14. [Socket.IO Real-Time Communication](#14-socketio-real-time-communication)
15. [Deployment & Configuration](#15-deployment--configuration)

---

## 1. Backend Architecture Overview

### 1.1 High-Level Design

The backend is built on **Node.js with Express.js** following a **layered architecture pattern**:

```
┌─────────────────────────────────────────────────┐
│         CLIENT LAYER (Frontend)                 │
│       (React + MetaMask Wallet)                │
└──────────────┬──────────────────────────────────┘
               │ HTTPS/REST + Socket.IO
┌──────────────▼──────────────────────────────────┐
│    API GATEWAY LAYER (Express Server)           │
│  ├─ CORS & Security Headers (Helmet)           │
│  ├─ Rate Limiting (15 min window, 500 req/IP)  │
│  ├─ Input Sanitization (NoSQL Inject, XSS)     │
│  └─ JWT Token Verification                     │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│    MIDDLEWARE LAYER                             │
│  ├─ Authentication (authMiddleware)             │
│  ├─ Authorization (roleMiddleware)              │
│  ├─ Audit Logging (auditLogMiddleware)          │
│  └─ Error Handling                              │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│    ROUTE HANDLERS LAYER                         │
│  ├─ /api/auth      (Authentication endpoints)  │
│  ├─ /api/campaigns (Campaign CRUD)              │
│  ├─ /api/donations (Donation management)       │
│  ├─ /api/milestones (Milestone tracking)       │
│  ├─ /api/admin     (Admin operations)          │
│  ├─ /api/analytics (Data analytics)            │
│  ├─ /api/hospitals (Hospital verification)     │
│  ├─ /api/kyc       (KYC review workflows)      │
│  └─ /api/transactions (Blockchain interactions)│
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│    SERVICE & BUSINESS LOGIC LAYER               │
│  ├─ Campaign Service                            │
│  ├─ Authentication Service                      │
│  ├─ Smart Contract Utils (ethers.js)            │
│  ├─ Email Service (Nodemailer)                  │
│  ├─ Encryption/Decryption                       │
│  └─ Wallet Verification                         │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│    DATA ACCESS LAYER                            │
│  └─ Mongoose Models & MongoDB Queries           │
└──────────────┬──────────────────────────────────┘
               │
          ┌────┴─────────────────────────────┐
          │                                  │
┌─────────▼──────────┐       ┌──────────────▼──────┐
│   MongoDB (Local)  │       │ Blockchain Network  │
│                    │       │ (Polygon Amoy/      │
│ Collections:       │       │  Ethereum Sepolia)  │
│ ├─ users           │       │                     │
│ ├─ campaigns       │       │ Smart Contracts:    │
│ ├─ donations       │       │ ├─ MedTrustFundFactory│
│ ├─ risk_assessments│       │ └─ MedTrustFundEscrow │
│ ├─ audit_logs      │       │                     │
│ ├─ milestones      │       │ Connected via:      │
│ └─ smartcontracts  │       │ ethers.js v6 + RPC  │
└────────────────────┘       └─────────────────────┘
```

### 1.2 Key Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Separation of Concerns** | Routes → Services → DAL (Models) |
| **Role-Based Access Control** | Middleware checks roles on every protected endpoint |
| **Audit Trail** | Every action logged to `AuditLog` collection (TTL: 5 years) |
| **Error Resilience** | Exponential backoff retry logic for blockchain operations |
| **Security** | JWT tokens, bcryptjs password hashing, helmet headers, input sanitization |
| **Real-Time Updates** | Socket.IO for live campaign/donation status changes |
| **Scalability** | Pagination on API responses, rate limiting, efficient query indexing |

---

## 2. Technology Stack

### 2.1 Core Dependencies

```json
{
  "framework": "Express.js 4.21.0 - HTTP server & routing",
  "database": "MongoDB 8.7.0 - NoSQL persistence",
  "blockchain": "ethers.js 6.13.4 - Smart contract interaction",
  "authentication": "jsonwebtoken 9.0.2 - JWT token generation/verification",
  "security": [
    "bcryptjs 3.0.2 - Password hashing",
    "helmet 8.1.0 - HTTP security headers",
    "express-mongo-sanitize 2.2.0 - NoSQL injection prevention",
    "xss-clean 0.1.4 - XSS attack prevention"
  ],
  "validation": "express-validator 7.3.2 - Input validation",
  "rate_limiting": "express-rate-limit 8.3.2 - DDoS protection",
  "real_time": "socket.io 4.8.3 - WebSocket communication",
  "email": "nodemailer 8.0.5 - Email notifications",
  "file_upload": "multer 1.4.5-lts.1 - Multipart file handling",
  "logging": "winston 3.19.0 - Structured logging",
  "validation_schema": "zod 4.3.6 - Type-safe validation"
}
```

### 2.2 Development Dependencies

```json
{
  "testing": "jest 30.3.0 - Unit & integration tests",
  "testing_http": "supertest 7.2.2 - HTTP assertion library",
  "hot_reload": "nodemon 3.1.14 - Development server auto-restart"
}
```

---

## 3. Directory Structure & File Purposes

### 3.1 Backend Folder Structure

```
backend/
├── server.js                      # Main Express server entry point
├── package.json                   # Dependencies & scripts
├── .env                          # Environment configuration
├── middleware/
│   └── auth.js                   # JWT verification & RBAC middleware
├── models/                       # Mongoose schemas
│   ├── User.js                   # User account model
│   ├── Campaign.js               # Campaign model with milestones
│   ├── Donation.js               # Donation records
│   ├── RiskAssessment.js         # AI fraud scoring model
│   ├── SmartContract.js          # Deployed contract metadata
│   ├── AuditLog.js               # Immutable audit trail (5-year TTL)
│   └── KYCDocument.js            # Know-Your-Customer documents
├── routes/                       # API endpoint handlers
│   ├── auth.js                   # Authentication endpoints
│   ├── campaigns.js              # Campaign CRUD & deployment
│   ├── donations.js              # Donation processing
│   ├── milestones.js             # Milestone confirmation/release
│   ├── admin.js                  # Admin-only operations
│   ├── analytics.js              # Analytics & reporting
│   ├── hospitals.js              # Hospital verification
│   ├── kyc.js                    # KYC workflow
│   └── transactions.js           # Blockchain transaction tracking
├── services/
│   └── WalletService.js          # Wallet connectivity utilities
├── utils/
│   ├── contractUtils.js          # Smart contract deployment & calls
│   ├── jwtUtils.js               # JWT encode/decode functions
│   ├── encryption.js             # File encryption/decryption
│   ├── emailService.js           # Email notifications
│   ├── logger.js                 # Winston logger setup
│   ├── socket.js                 # Socket.IO room management
│   ├── indexer.js                # Blockchain indexer daemon
│   ├── campaignExpiry.js         # Campaign expiration cron job
│   ├── hospitalVerification.js   # Hospital status helpers
│   └── validator.js              # Input validation helpers
├── tests/
│   ├── jest-env.js               # Jest environment setup
│   ├── setup.js                  # Test fixtures & mocks
│   ├── auth.test.js              # Auth endpoint tests
│   ├── campaigns.test.js         # Campaign CRUD tests
│   ├── donations.test.js         # Donation flow tests
│   └── contracts.test.js         # Smart contract interaction tests
└── logs/
    └── *.log                     # Application logs
```

### 3.2 File-by-File Breakdown

#### **server.js** (Main Entry Point)

**Purpose:** Initialize Express server, database, middleware, routes, real-time communication, and background jobs.

**Key Sections:**
- Environment loading (dotenv)
- Express app configuration
- Middleware stack (CORS, Helmet, Rate Limiter, Sanitizers)
- Route registration (all 9 API route modules)
- MongoDB connection
- Socket.IO initialization for real-time updates
- Blockchain indexer daemon (listening for smart contract events)
- Campaign expiry cron job (auto-expire inactive campaigns)
- Server startup on PORT 5000

**Example Flow in server.js:**
```javascript
// 1. Load environment variables
require("dotenv").config();

// 2. Initialize Express
const app = express();
const server = http.createServer(app);

// 3. Security middleware
app.use(helmet()); // HIPAA/GDPR headers
app.use(cors()); // Cross-origin access
app.use(mongoSanitize()); // NoSQL injection prevention
app.use(xss()); // XSS attack prevention

// 4. Rate limiting
app.use(apiLimiter); // 500 req per 15 min per IP

// 5. Route registration
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignsRoutes);
// ... (7 more route modules)

// 6. Database connection
mongoose.connect(process.env.MONGODB_URI);

// 7. Socket.IO setup
const io = new Server(server, { cors: {...} });
initializeSocket(io);

// 8. Start background jobs
startIndexer(); // Listen for blockchain events
startExpiryJob(); // Auto-expire campaigns

// 9. Server listen
server.listen(5000);
```

---

## 4. Core Models (Database Schema)

### 4.1 User Model

```javascript
{
  _id: ObjectId (auto-generated),
  email: String (unique, required),
  password: String (bcryptjs-hashed, required),
  name: String (required),
  role: Enum ['patient', 'donor', 'hospital', 'admin'],
  walletAddress: String (unique, sparse),
  
  // KYC status
  kyc: {
    status: Enum ['pending', 'approved', 'rejected'],
    submittedAt: Date,
    verifiedAt: Date
  },
  
  // Profile information
  profile: {
    phone: String,
    profilePicture: String,
    bio: String,
    location: String,
    verified: Boolean (default: false)
  },
  
  // Hospital-specific
  hospitalName: String,
  hospitalLicense: String,
  hospitalVerificationToken: String,
  
  // Patient-specific
  medicalCondition: String,
  targetAmount: Number,
  
  // Authentication & security
  passwordResetTokenHash: String (select: false),
  passwordResetExpires: Date (select: false),
  walletAuthNonce: String (select: false),
  walletAuthNonceExpires: Date (select: false),
  
  // Preferences
  preferences: {
    emailNotifications: Boolean
  },
  
  isActive: Boolean (default: true),
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

**Indexes:** email, walletAddress, createdAt

### 4.2 Campaign Model

```javascript
{
  _id: ObjectId,
  title: String (required, >10 chars),
  description: String (required, >50 chars, medical context),
  patientId: ObjectId (ref: User, required),
  hospitalId: ObjectId (ref: User, sparse),
  
  // Financial tracking
  targetAmount: Number (required, > 0),
  raisedAmount: Number (default: 0),
  
  // Status lifecycle
  status: Enum [
    'draft' → unpublished
    'pending_verification' → awaiting AI review
    'active' → approved, accepting donations
    'completed' → all milestones released
    'rejected' → AI/admin rejected
    'paused' → temporarily halted
  ],
  
  // Document management
  documents: [{
    type: Enum ['identity', 'diagnosis', 'admission_letter', 'cost_estimate'],
    url: String (/uploads/{filename}),
    hash: String (SHA256 for integrity),
    uploadedAt: Date
  }],
  
  // Blockchain integration
  smartContractAddress: String (deployed escrow address),
  smartContractDeploymentTx: String (deployment transaction hash),
  
  // Medical details
  medicalDetails: {
    condition: String,
    severityLevel: Enum ['critical', 'severe', 'moderate', 'mild'],
    estimatedTreatmentDuration: String
  },
  
  // Risk assessment link
  riskAssessmentId: ObjectId (ref: RiskAssessment),
  
  // Milestone breakdown
  milestones: [{
    description: String,
    targetAmount: Number,
    status: Enum ['pending', 'confirmed', 'released'],
    confirmedAt: Date,
    releasedAt: Date
  }],
  
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** patientId, status, createdAt, expiresAt

### 4.3 Donation Model

```javascript
{
  _id: ObjectId,
  campaignId: ObjectId (ref: Campaign, required),
  donorId: ObjectId (ref: User, required),
  
  // Amount & currency
  amount: Number (required, in ETH),
  currency: String (default: 'ETH'),
  
  // Status lifecycle
  status: Enum [
    'pending' → initial state
    'locked_in_escrow' → funds in smart contract
    'released' → funds transferred to patient
    'refunded' → funds returned to donor
  ],
  
  // Blockchain transaction details
  transactionHash: String (on-chain tx hash),
  gasUsed: Number (gas spent),
  blockNumber: Number (block where tx was mined),
  
  // Escrow tracking
  escrowDetails: {
    contractAddress: String,
    escrowLockedAt: Date,
    releaseTimestamp: Date
  },
  
  // Donor metadata
  donorMessage: String,
  anonymous: Boolean (default: false),
  
  // Refund tracking
  refundTxHash: String,
  refundReason: String,
  refundedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** campaignId, donorId, status, transactionHash

### 4.4 RiskAssessment Model

```javascript
{
  _id: ObjectId,
  campaignId: ObjectId (ref: Campaign, sparse),
  
  // Overall risk score (0-100)
  riskScore: Number (0-100, required),
  riskCategory: Enum ['low' (0-33), 'medium' (34-66), 'high' (67-100)],
  
  // SRS v2.0 component scores
  tamperingScore: Number (0-100, image forgery indicators),
  aiGeneratedScore: Number (0-100, AI-generated content likelihood),
  metadataMismatchScore: Number (0-100, cross-document inconsistencies),
  
  // AI verification breakdown
  aiVerificationDetails: {
    ocrConfidence: Number (0-100, OCR text accuracy),
    metadataConsistency: Number (0-100, consistency across documents),
    keywordMatch: Number (0-100, medical keyword relevance),
    fileIntegrityScore: Number (0-100, file tampering likelihood)
  },
  
  // Per-document analysis
  documentAnalysis: [{
    documentType: String,
    fileHash: String,
    fileSize: Number,
    resolution: Enum ['low', 'medium', 'high'],
    processingTime: Number (seconds),
    ocrAccuracy: Number,
    anomalyFlags: [String] // fraud indicators detected
  }],
  
  // Fraud indicators flagged
  fraudIndicators: [{
    indicator: String,
    severity: Enum ['low', 'medium', 'high'],
    details: String
  }],
  
  // Manual review requirement
  manualReviewRequired: Boolean,
  manualReviewStatus: {
    status: Enum ['pending', 'approved', 'rejected'],
    reviewedBy: ObjectId (ref: User, admin),
    reviewedAt: Date,
    comments: String
  },
  
  // Final recommendation
  recommendation: Enum ['approve', 'escalate', 'reject'],
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** campaignId, riskScore, createdAt

### 4.5 AuditLog Model (5-Year TTL)

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, sparse),
  action: String (user_login, campaign_created, donation_received, etc),
  entityType: String (user, campaign, donation, smart_contract),
  entityId: ObjectId (ref to affected entity),
  
  # Changes recorded
  changes: {
    before: Object,    // Previous state
    after: Object      // New state
  },
  
  # IP & session tracking
  ipAddress: String,
  userAgent: String,
  
  # HTTP context
  method: String (GET, POST, PUT, DELETE),
  path: String,
  statusCode: Number,
  
  # Metadata
  metadata: Object,
  
  timestamp: Date,
  expiresAt: Date, // TTL index: deletes after 5 years (required for compliance)
  
  # Encryption at rest (optional)
  encrypted: Boolean
}
```

**Indexes:** userId, timestamp, expiresAt (TTL), entityId

### 4.6 SmartContract Model

```javascript
{
  _id: ObjectId,
  campaignId: ObjectId (ref: Campaign, required),
  contractAddress: String (deployed contract address, unique),
  contractType: Enum ['escrow', 'factory'],
  
  // Deployment info
  deployedBy: ObjectId (ref: User, admin),
  deployedAt: Date,
  deploymentTxHash: String,
  blockNumber: Number,
  
  // Participants
  patientWallet: String (funds recipient),
  hospitalWallet: String (milestone confirmer),
  factoryAddress: String (if deployed via Factory),
  
  // Milestone configuration
  milestones: [{
    index: Number,
    description: String,
    amount: Number (wei),
    confirmed: Boolean,
    released: Boolean,
    releasedAt: Date
  }],
  
  // Contract state
  totalFundsReceived: Number (wei),
  totalFundsReleased: Number (wei),
  isActive: Boolean,
  
  // Network info
  networkName: String ('amoy', 'sepolia'),
  networkChainId: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** campaignId, contractAddress, deployedAt

---

## 5. Middleware & Security Layer

### 5.1 Authentication Middleware (authMiddleware)

**Location:** `middleware/auth.js`

**Purpose:** Verify JWT token on every protected request

**Flow:**
```
Request comes in
    ↓
Extract token from Authorization header
    ↓
Verify token signature & expiry
    ↓
If valid: Attach decoded user data to req.user
    ↓
If invalid: Return 401 Unauthorized
    ↓
Proceed to route handler
```

**Code Snippet:**
```javascript
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

    req.user = decoded; // Now available in route handler as req.user
    next();
  } catch (error) {
    res.status(500).json({ error: `Auth error: ${error.message}` });
  }
};
```

### 5.2 Role-Based Access Control (roleMiddleware)

**Purpose:** Enforce role-based authorization on endpoints

**Roles:**
- `patient` - Can create campaigns, receive donations
- `donor` - Can donate to campaigns
- `hospital` - Can confirm milestones, verify patients
- `admin` - Can manage entire platform (users, contracts, disputes)

**Example Usage:**
```javascript
// Only patients can create campaigns
router.post('/', 
  authMiddleware,
  roleMiddleware(['patient']),
  createCampaignHandler
);

// Only admins can access admin endpoints
router.get('/admin/audit-logs',
  authMiddleware,
  roleMiddleware(['admin']),
  getAuditLogsHandler
);

// Multiple roles allowed
router.get('/campaigns/:id',
  authMiddleware,
  roleMiddleware(['patient', 'donor', 'hospital', 'admin']),
  getCampaignHandler
);
```

### 5.3 Audit Logging Middleware

**Purpose:** Log all API requests and state changes

**Logged Information:**
- Timestamp & user ID
- HTTP method & path
- Request/response status
- Entity changes (before/after)
- IP address & user agent
- Action classification (user_login, campaign_created, etc)

**Retention:** 5-year TTL index on MongoDB (Auto-deletes after 5 years for compliance)

**Code Section:**
```javascript
const auditLogMiddleware = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // Log successful responses
    if (res.statusCode >= 200 && res.statusCode < 400) {
      AuditLog.create({
        userId: req.user?._id,
        action: inferAudit(req).action,
        entityType: inferAudit(req).entityType,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }
    return originalJson.call(this, data);
  };

  next();
};
```

### 5.4 Security Headers (Helmet)

**Applied Headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

### 5.5 Input Sanitization

- **NoSQL Injection Prevention** (express-mongo-sanitize)
  - Strips `$` and `.` from user input
  - Prevents queries like `{$gt: ""}`

- **XSS Prevention** (xss-clean)
  - Sanitizes HTML/JS in text fields
  - Removes dangerous tags and attributes

- **Rate Limiting** (express-rate-limit)
  - 500 requests per 15 minutes per IP
  - Configurable via `API_RATE_LIMIT_MAX` env var
  - Bypassed in test mode

---

## 6. API Routes & Endpoints

### 6.1 Authentication Routes (`/api/auth`)

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| POST | `/signup` | Register new user | None | Any |
| POST | `/login` | Get JWT token | None | Any |
| POST | `/forgot-password` | Request password reset email | None | Any |
| POST | `/reset-password` | Set new password via reset token | None | Any |
| POST | `/verify-wallet` | Verify wallet signature (Web3 auth) | None | Any |
| GET | `/me` | Get current user profile | JWT | Any |
| PUT | `/profile` | Update user profile | JWT | Any |

**Example - Sign Up Flow:**
```javascript
POST /api/auth/signup
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "patient"
}

Response (201):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "60d5ec49f1b2c72e44e8c1a2",
    "email": "patient@example.com",
    "role": "patient",
    "kyc": { "status": "pending" }
  }
}
```

### 6.2 Campaign Routes (`/api/campaigns`)

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| POST | `/` | Create campaign (with documents) | JWT | patient |
| GET | `/` | List all campaigns (paginated) | None | Any |
| GET | `/:id` | Get campaign details | None | Any |
| PUT | `/:id` | Update campaign (if draft) | JWT | patient |
| DELETE | `/:id` | Delete campaign | JWT | patient |
| POST | `/:id/deploy-contract` | Deploy escrow contract | JWT | patient/admin |
| GET | `/:id/analytics` | Get campaign analytics | JWT | patient/admin |

**Example - Create Campaign with Documents:**
```javascript
POST /api/campaigns
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

Fields:
- title: "Emergency Heart Transplant Surgery"
- description: "Urgent need for heart transplant treatment..."
- targetAmount: 5.0
- hospitalId: "60d5ec49f1b2c72e44e8c1a2"
- medicalDetails: { "condition": "Heart failure", "severityLevel": "critical" }
- documents: [file1, file2, ...]
- documentTypes: ["diagnosis", "admission_letter", "cost_estimate"]

Response (201):
{
  "campaign": {
    "_id": "60d5ec49f1b2c72e44e8c1a3",
    "title": "Emergency Heart Transplant Surgery",
    "status": "pending_verification",
    "raisedAmount": 0,
    "targetAmount": 5.0,
    "documents": [...]
  },
  "riskAssessment": {
    "riskScore": 25,
    "riskCategory": "low",
    "recommendation": "approve"
  }
}
```

**Document Upload Flow:**
1. Multer middleware receives file
2. File saved to `/uploads/{filename}`
3. SHA256 hash calculated for integrity
4. FormData created with files + hospital_verified flag
5. Sent to AI Service (`http://localhost:8001/verify`)
6. AI returns risk assessment
7. Campaign status set to `pending_verification` or `active` based on risk score

### 6.3 Donation Routes (`/api/donations`)

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| POST | `/` | Create donation (trigger contract interaction) | JWT | donor |
| GET | `/` | List donor's donations | JWT | donor |
| GET | `/:id` | Get donation details | JWT | donor/admin |
| PUT | `/:id/refund` | Request refund | JWT | admin |
| GET | `/campaign/:campaignId` | Get all donations for campaign | None | Any |

**Example - Make Donation:**
```javascript
POST /api/donations
Authorization: Bearer <DONOR_JWT>
Content-Type: application/json

{
  "campaignId": "60d5ec49f1b2c72e44e8c1a3",
  "amount": 0.5,  // ETH
  "donorMessage": "Hope this helps you get better!",
  "anonymous": false
}

Response (201):
{
  "donation": {
    "_id": "60d5ec49f1b2c72e44e8c1a4",
    "amount": 0.5,
    "status": "locked_in_escrow",
    "transactionHash": "0x1234567890abcdef...",
    "escrowDetails": {
      "contractAddress": "0xabcd...",
      "escrowLockedAt": "2024-04-17T10:30:00Z"
    }
  },
  "blockchain_confirmed": {
    "blockNumber": 12345,
    "gasUsed": 45000
  }
}
```

**Donation Flow (Internal):**
1. Verify campaign exists and is active
2. Get smart contract instance for campaign
3. Call contract.donate() with amount
4. Wait for transaction confirmation (exponential backoff)
5. Update donation status to `locked_in_escrow`
6. Record transaction hash & block number
7. Emit Socket.IO event to all connected clients
8. Update campaign `raisedAmount`

### 6.4 Milestone Routes (`/api/milestones`)

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| GET | `/:campaignId` | Get milestones for campaign | None | Any |
| POST | `/:campaignId/:milestoneIndex/confirm` | Confirm milestone completion | JWT | hospital |
| POST | `/:campaignId/:milestoneIndex/release` | Release milestone funds | JWT | patient/admin |
| GET | `/:campaignId/:milestoneIndex/status` | Check milestone status | None | Any |

**Example - Hospital Confirms Milestone:**
```javascript
POST /api/milestones/{campaignId}/0/confirm
Authorization: Bearer <HOSPITAL_JWT>
Content-Type: application/json

{
  "proof": "Patient completed first treatment phase with discharge letter attached"
}

Response (200):
{
  "milestone": {
    "index": 0,
    "description": "Initial treatment and diagnosis",
    "amount": 1.5,
    "status": "confirmed",
    "confirmedAt": "2024-04-17T11:00:00Z"
  },
  "blockchainTx": {
    "hash": "0x5678...",
    "status": "confirmed"
  }
}
```

**Confirmation Flow:**
1. Verify requester is hospital associated with campaign
2. Call contract.confirmMilestone(index) from hospital wallet
3. Wait for blockchain confirmation
4. Update milestone status to `confirmed` in Database
5. Emit notification to patient & admin

### 6.5 Admin Routes (`/api/admin`)

| Method | Endpoint | Purpose | Auth | Role |
|--------|----------|---------|------|------|
| GET | `/users` | List all users with filters | JWT | admin |
| PUT | `/users/:id` | Update user (activate/deactivate) | JWT | admin |
| DELETE | `/users/:id` | Delete user | JWT | admin |
| GET | `/campaigns` | List campaigns with admin filters | JWT | admin |
| POST | `/campaigns/:id/approve` | Approve pending campaign | JWT | admin |
| POST | `/campaigns/:id/reject` | Reject campaign with reason | JWT | admin |
| GET | `/audit-logs` | View audit trail | JWT | admin |
| POST | `/refunds/:donationId` | Process refund | JWT | admin |
| GET | `/analytics` | Platform-wide analytics | JWT | admin |

**Example - Admin Approves Campaign:**
```javascript
POST /api/admin/campaigns/{campaignId}/approve
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "approvalNotes": "Documents verified, patient identity confirmed"
}

Response (200):
{
  "campaign": {
    "_id": "60d5ec49f1b2c72e44e8c1a3",
    "status": "active",
    "approvedAt": "2024-04-17T12:00:00Z",
    "approvedBy": "admin@medtrustfund.com"
  },
  "smartContractDeployed": true,
  "contractAddress": "0xabcd1234..."
}
```

### 6.6 Analytics Routes (`/api/analytics`)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/donor/summary` | Donor contribution stats | JWT (donor) |
| GET | `/campaign/summary` | Campaign performance metrics | JWT (patient) |
| GET | `/platform/metrics` | Platform-wide statistics | JWT (admin) |
| GET | `/risk-trends` | Risk assessment trends | JWT (admin) |

---

## 7. Business Logic Services

### 7.1 Campaign Service Logic

**Create Campaign:**
```javascript
async function createCampaign(patientId, campaignData, files) {
  // 1. Validate input
  validateCampaignInput(campaignData);
  
  // 2. Store files to /uploads/{timestamp-hash}
  const documents = await storeDocuments(files);
  
  // 3. Send to AI service for verification
  const aiResponse = await axios.post(
    `${AI_SERVICE_URL}/verify`,
    { files: documents, hospital_verified: ... }
  );
  
  // 4. Create risk assessment record
  const riskAssessment = await RiskAssessment.create({
    riskScore: aiResponse.riskScore,
    riskCategory: aiResponse.riskCategory,
    recommendation: aiResponse.recommendation,
    ...aiResponse.details
  });
  
  // 5. Determine campaign status based on risk
  let status = 'draft';
  if (aiResponse.riskScore <= 33) {
    status = 'active'; // Auto-approve low-risk
  } else if (aiResponse.riskScore <= 66) {
    status = 'pending_verification'; // Manual review needed
  } else {
    status = 'rejected'; // High-risk rejected
  }
  
  // 6. Create campaign
  const campaign = await Campaign.create({
    title: campaignData.title,
    description: campaignData.description,
    patientId,
    hospitalId: campaignData.hospitalId,
    targetAmount: campaignData.targetAmount,
    documents,
    riskAssessmentId: riskAssessment._id,
    status,
    medicalDetails: campaignData.medicalDetails,
    milestones: campaignData.milestones
  });
  
  // 7. Log audit event
  await AuditLog.create({
    userId: patientId,
    action: 'campaign_created',
    entityType: 'campaign',
    entityId: campaign._id
  });
  
  return campaign;
}
```

### 7.2 Smart Contract Deployment Service

**Deploy Escrow Contract:**
```javascript
async function deployEscrowContract(patientAddress, hospitalAddress, milestones) {
  // 1. Load contract artifact from hardhat build
  const artifact = loadContractArtifact('MedTrustFundEscrow');
  
  // 2. Get provider & signer
  const { provider, signer } = getProviderAndSigner();
  
  // 3. Prepare milestone descriptions & amounts
  const descriptions = milestones.map(m => m.description);
  const amounts = milestones.map(m => ethers.parseEther(m.targetAmount.toString()));
  
  // 4. Deploy via Factory contract (gas efficient)
  const factory = new ethers.Contract(
    FACTORY_ADDRESS,
    FACTORY_ABI,
    signer
  );
  
  // 5. Call factory.deployCampaign() with retry logic
  const tx = await executeWithRetry(async () => {
    return factory.deployCampaign(
      patientAddress,
      hospitalAddress,
      descriptions,
      amounts,
      { gasLimit: 5000000 } // Estimate gas
    );
  }, 'deployCampaign', maxRetries=5);
  
  // 6. Wait for receipt
  const receipt = await tx.wait(2); // 2 confirmations
  
  // 7. Extract escrow address from event logs
  const deployEvent = receipt.logs.find(log => 
    log.topics[0] === factory.interface.getEventTopic('CampaignDeployed')
  );
  const escrowAddress = factory.interface.parseLog(deployEvent).args.escrowAddress;
  
  // 8. Store contract metadata
  const smartContract = await SmartContract.create({
    campaignId,
    contractAddress: escrowAddress,
    contractType: 'escrow',
    deployedBy: adminId,
    deployedAt: new Date(),
    deploymentTxHash: tx.hash,
    blockNumber: receipt.blockNumber,
    patientWallet: patientAddress,
    hospitalWallet: hospitalAddress,
    milestones: milestones.map((m, i) => ({
      index: i,
      description: m.description,
      amount: ethers.parseEther(m.targetAmount.toString())
    })),
    networkName: 'amoy',
    networkChainId: 80002
  });
  
  return { escrowAddress, tx: tx.hash, smartContract };
}
```

### 7.3 Donation Processing Service

**Process Donation:**
```javascript
async function processDonation(donorId, campaignId, amount) {
  // 1. Check campaign is active
  const campaign = await Campaign.findById(campaignId);
  if (campaign.status !== 'active') throw new Error('Campaign not active');
  
  // 2. Create donation record
  const donation = await Donation.create({
    campaignId,
    donorId,
    amount,
    status: 'pending'
  });
  
  // 3. Get escrow contract instance
  const escrow = getContractInstance(campaign.smartContractAddress);
  
  // 4. Send funds to contract
  const tx = await executeWithRetry(async () => {
    return escrow.donate({
      value: ethers.parseEther(amount.toString()),
      gasLimit: 500000
    });
  }, 'sendDonation', maxRetries=5);
  
  // 5. Wait for confirmation
  const receipt = await tx.wait(3); // 3 confirmations
  
  // 6. Update donation status
  donation.status = 'locked_in_escrow';
  donation.transactionHash = tx.hash;
  donation.gasUsed = receipt.gasUsed;
  donation.blockNumber = receipt.blockNumber;
  donation.escrowDetails.escrowLockedAt = new Date();
  await donation.save();
  
  // 7. Update campaign raised amount
  campaign.raisedAmount += amount;
  await campaign.save();
  
  // 8. Emit real-time update
  emitToAll('donation_received', {
    campaignId,
    amount,
    donorName: donor.profile.verified ? donor.name : 'Anonymous',
    totalRaised: campaign.raisedAmount,
    targetAmount: campaign.targetAmount,
    percentComplete: (campaign.raisedAmount / campaign.targetAmount) * 100
  });
  
  return donation;
}
```

### 7.4 Milestone Confirmation Service

**Hospital Confirms Milestone:**
```javascript
async function confirmMilestone(hospitalId, campaignId, milestoneIndex) {
  // 1. Verify hospital is associated with campaign
  const campaign = await Campaign.findById(campaignId);
  if (!campaign.hospitalId.equals(hospitalId)) {
    throw new Error('Only hospital can confirm milestones');
  }
  
  // 2. Call contract.confirmMilestone()
  const escrow = getContractInstance(campaign.smartContractAddress);
  const tx = await executeWithRetry(async () => {
    return escrow.confirmMilestone(milestoneIndex);
  }, 'confirmMilestone', maxRetries=3);
  
  // 3. Wait for confirmation
  const receipt = await tx.wait(2);
  
  // 4. Update milestone in Campaign
  campaign.milestones[milestoneIndex].status = 'confirmed';
  campaign.milestones[milestoneIndex].confirmedAt = new Date();
  await campaign.save();
  
  // 5. Audit log
  await AuditLog.create({
    userId: hospitalId,
    action: 'milestone_confirmed',
    entityType: 'milestone',
    entityId: campaignId,
    metadata: { milestoneIndex }
  });
  
  // 6. Emit notification
  emitToRoom(`campaign_${campaignId}`, 'milestone_confirmed', {
    campaignId,
    milestoneIndex,
    confirmedAt: new Date()
  });
  
  return { status: 'confirmed', tx: tx.hash };
}
```

---

## 8. Smart Contract Interaction Layer

### 8.1 contractUtils.js Overview

**Location:** `backend/utils/contractUtils.js`

**Key Functions:**

1. **`loadContractArtifact(contractName)`**
   - Loads compiled contract JSON from hardhat/artifacts
   - Returns ABI & bytecode

2. **`getProviderAndSigner()`**
   - Initializes ethers.js provider (RPC URL)
   - Gets signer from private key
   - Targets configured network (amoy/sepolia)

3. **`deployEscrowContract(patient, hospital, milestones)`**
   - Direct deployment (uses more gas)
   - Returns deployed contract address

4. **`deployEscrowViaFactory(patient, hospital, milestones)`**
   - Deployment through factory pattern (optimized gas)
   - Factory tracks all campaigns
   - Used in production

5. **`getContractInstance(address, customSigner)`**
   - Creates contract instance for interaction
   - Used to call donate(), confirmMilestone(), etc

6. **`confirmMilestoneOnChain(address, index, hospitalWallet)`**
   - Hospital confirms milestone on-chain
   - Calls contract.confirmMilestone(index)

7. **`releaseMilestoneOnChain(address, index)`**
   - Patient/Admin releases funds
   - Calls contract.releaseMilestone(index)
   - Transfers funds to patient

8. **`executeWithRetry(fn, operationName, maxRetries)`**
   - Wraps blockchain calls with exponential backoff
   - Max 5 retries with delay: 1s, 2s, 4s, 8s, 16s
   - Logs attempts & errors

### 8.2 Error Handling & Retry Strategy

**Retry Logic Flow:**
```javascript
async function executeWithRetry(fn, operationName, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      logger.info(`Attempt ${attempt + 1}/${maxRetries}: ${operationName}`);
      return await fn(); // Try operation
    } catch (error) {
      logger.warn(`Attempt ${attempt + 1} failed: ${error.message}`);
      
      if (attempt < maxRetries - 1) {
        const delay = calculateBackoffDelay(attempt); // 2^attempt * 1000ms
        logger.info(`Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        logger.error(`All ${maxRetries} attempts failed for ${operationName}`);
        throw new Error(`${operationName} failed after ${maxRetries} retries`);
      }
    }
  }
}
```

**Handled Errors:**
- Network timeouts
- Transaction nonce conflicts
- Gas estimation failures
- Insufficient gas
- Contract call reverts
- RPC node unavailability

---

## 9. AI Verification Pipeline

### 9.1 Integration Point

**File:** `backend/routes/campaigns.js` (POST `/`)

**Flow:**
```
1. Receive files from patient (multer)
   ↓
2. Store files to /uploads/{filename}
   ↓
3. Create FormData with files + hospital_verified flag
   ↓
4. POST to AI Service: http://localhost:8001/verify
   ↓
5. AI Service returns:
   - riskScore (0-100)
   - riskCategory (low/medium/high)
   - recommendation (approve/escalate/reject)
   - documentAnalysis
   - fraudIndicators
   ↓
6. Create RiskAssessment record
   ↓
7. Determine campaign status:
   - riskScore ≤ 33: status = 'active' (auto-approve)
   - 33 < riskScore ≤ 66: status = 'pending_verification' (manual review)
   - riskScore > 66: status = 'rejected'
   ↓
8. Return campaign + risk assessment to frontend
```

### 9.2 What AI Service Validates

**Risk Scoring Model (SRS v2.0):**

RiskScore = w₁×Tampering + w₂×AIContent + w₃×Metadata + w₄×Relevance

Where:
- w₁ = 0.15 (Image tampering indicators)
- w₂ = 0.20 (AI-generated content probability)
- w₃ = 0.15 (Cross-document metadata inconsistencies)
- w₄ = 0.50 (Medical document relevance) ← **Dominant factor**

**Validation Checks:**
1. **OCR & Text Extraction** - Extract text from PDF/image
2. **Medical Keyword Matching** - ≥4 medical keywords required
3. **Non-Medical Red Flags** - Academic/programming/legal keywords indicate fraud
4. **Document Structure Analysis** - Check for medical document markers (MRN, Dr., Ward, etc)
5. **Metadata Consistency** - Cross-document consistency checks
6. **Image Tampering Detection** - File size, resolution anomalies
7. **AI Content Detection** - Heuristic signals of AI-generated documents

---

## 10. Complete Data Flow Diagrams

### 10.1 Campaign Creation Flow

```
┌──────────────┐
│ Patient UI   │
└──────┬───────┘
       │ POST /campaigns
       │ + 5 files + metadata
       ↓
┌──────────────────────────┐
│ Backend (campaigns.js)    │
│                          │
│ 1. Validate input        │
│ 2. Store files           │
│ 3. Create FormData       │
└──────┬───────────────────┘
       │
       ↓
┌─────────────────────────┐
│ AI Service (8001)       │
│                         │
│ /verify endpoint        │
│                         │
│ - Extract text (OCR)    │
│ - Validate medical      │
│ - Risk scoring          │
│ - Report fraud signals  │
└──────┬──────────────────┘
       │ riskScore, recommendation
       ↓
┌────────────────────────────────┐
│ Backend Decision               │
│                                │
│ IF riskScore < 33:             │
│   status = 'active'            │
│ ELSE IF riskScore < 66:        │
│   status = 'pending_verification'│
│ ELSE:                          │
│   status = 'rejected'          │
└──────┬─────────────────────────┘
       │
       ↓
┌───────────────────────────┐
│ MongoDB                   │
│                           │
│ Save:                     │
│ - Campaign record         │
│ - RiskAssessment record   │
│ - AuditLog entry          │
└───────┬───────────────────┘
       │
       ↓
┌─────────────────────┐
│ Frontend Response   │
│                     │
│ - Campaign ID       │
│ - Risk assessment   │
│ - Status code       │
└─────────────────────┘
```

### 10.2 Donation & Smart Contract Flow

```
┌──────────────┐
│ Donor UI     │
└──────┬───────┘
       │ POST /donations
       │ + amount + campaignId
       ↓
┌─────────────────────────────┐
│ Backend                     │
│ donation processing logic   │
│                             │
│ 1. Fetch campaign           │
│ 2. Create donation record   │
└──────┬──────────────────────┘
       │
       ↓
┌────────────────────────┐
│ Blockchain Network     │
│ (Polygon Amoy)         │
│                        │
│ Private Key Signer     │
└──────┬─────────────────┘
       │ send tx
       ↓
┌────────────────────────────────┐
│ Smart Contract                 │
│ donate() function              │
│                                │
│ - Accept ETH value             │
│ - Emit Donated event           │
│ - Update totalDonated          │
└──────┬─────────────────────────┘
       │ tx hash + block number
       ↓
┌──────────────────────────────┐
│ Backend                      │
│                              │
│ 1. Update donation record    │
│    status = 'locked_in_escrow'│
│    transactionHash = ...     │
│ 2. Update campaign           │
│    raisedAmount += amount    │
│ 3. Log to AuditLog           │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Socket.IO Emit           │
│ 'donation_received'      │
│ (to all connected)       │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│ Frontend Update          │
│ Real-time UI refresh     │
└──────────────────────────┘
```

### 10.3 Milestone Confirmation & Release Flow

```
┌──────────────┐
│ Hospital UI  │
└──────┬───────┘
       │ POST /milestones/{campaignId}/0/confirm
       │ + proof documents
       ↓
┌──────────────────────────┐
│ Backend                  │
│                          │
│ 1. Verify hospital auth  │
│ 2. Auth middleware pass  │
└──────┬───────────────────┘
       │
       ↓
┌────────────────────────────────┐
│ Smart Contract Call            │
│ contract.confirmMilestone(0)   │
└──────┬─────────────────────────┘
       │ tx sent
       ↓
┌────────────────────────┐
│ Blockchain            │
│                       │
│ Set milestone[0]      │
│   confirmed = true    │
│ Emit event            │
└──────┬─────────────────┘
       │
       ↓
┌────────────────────┐
│ Backend            │
│                    │
│ Update Campaign:   │
│ milestones[0]      │
│  .status = 'confirmed'│
└──────┬─────────────┘
       │
       ↓
       ┌─────────────────────────────┐
       │ Patient/Admin UI            │
       │ Can now release milestone   │
       └──────┬──────────────────────┘
              │ POST /milestones/{id}/0/release
              ↓
       ┌──────────────────────────────┐
       │ Smart Contract Call          │
       │ contract.releaseMilestone(0) │
       └──────┬───────────────────────┘
              │
              ↓
       ┌─────────────────────────┐
       │ Blockchain              │
       │                         │
       │ Transfer ETH to patient │
       │ Set milestone.released  │
       │ Emit FundsReleased      │
       └──────┬──────────────────┘
              │
              ↓
       ┌──────────────────────────────┐
       │ Backend Update Database      │
       │                              │
       │ Update donations:            │
       │  status = 'released'         │
       │ Update campaign:             │
       │  milestons[0].released = true│
       └────────────────────────────────┘
```

--- 

## 11. Authentication & Authorization (RBAC)

### 11.1 JWT Token Structure

**Token Payload:**
```
{
  _id: "60d5ec49f1b2c72e44e8c1a2",
  email: "user@medtrustfund.com",
  name: "John Doe",
  role: "patient",
  walletAddress: "0x1234567890abcdef...",
  kyc: { status: "approved" },
  profile: { verified: true },
  iat: 1713350400,  // issued at
  exp: 1713436800   // expires in 24 hours
}
```

**Token Generation (jwtUtils.js):**
```javascript
const generateToken = (user) => {
  const payload = {
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    walletAddress: user.walletAddress,
    kyc: user.kyc,
    profile: user.profile
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '24h' } // Token valid for 24 hours
  );
};
```

### 11.2 Role-Based Access Control (RBAC) Matrix

| Endpoint | Patient | Donor | Hospital | Admin |
|----------|---------|-------|----------|-------|
| POST /campaigns | ✅ | ❌ | ❌ | ❌ |
| GET /campaigns | ✅ | ✅ | ✅ | ✅ |
| PUT /campaigns/{id} | ✅* | ❌ | ❌ | ✅ |
| POST /donations | ❌ | ✅ | ❌ | ❌ |
| POST /milestones/{}/confirm | ❌ | ❌ | ✅ | ❌ |
| POST /milestones/{}/release | ✅ | ❌ | ❌ | ✅ |
| GET /admin/* | ❌ | ❌ | ❌ | ✅ |
| POST /admin/refunds | ❌ | ❌ | ❌ | ✅ |
| PUT /users/{id} (edit own) | ✅ | ✅ | ✅ | ✅ |

\* Can only edit own campaign if status is 'draft'

### 11.3 Web3 Wallet Authentication

**Alternative Login with MetaMask:**
```javascript
// 1. Frontend requests nonce
GET /api/auth/wallet-nonce?address=0x1234...
→ Response: { nonce: "random-string-12345" }

// 2. Frontend signs nonce with wallet
signature = await signer.signMessage(nonce)

// 3. Backend verifies signature
POST /api/auth/verify-wallet
{
  "address": "0x1234...",
  "nonce": "random-string-12345",
  "signature": "0x7890..."
}

// 4. Backend verifies:
recoveredAddress = ethers.recoverAddress(nonce, signature)
if (recoveredAddress === address) → JWT issued
```

---

## 12. Testing Strategy & Test Suites

### 12.1 Test Structure

**Location:** `backend/tests/`

**Test Files:**
- `jest-env.js` - Jest environment configuration
- `setup.js` - Common fixtures & database setup/teardown
- `auth.test.js` - Authentication endpoint tests
- `campaigns.test.js` - Campaign CRUD tests
- `donations.test.js` - Donation processing tests
- `contracts.test.js` - Smart contract integration tests

### 12.2 Running Tests

```bash
# Run all tests with 30-second timeout per test
npm test

# With coverage report
npm test -- --coverage

# Watch mode (re-run on file changes)
npm test -- --watch

# Only run specific file
npm test campaigns.test.js
```

**Test Configuration (package.json):**
```json
{
  "test": "jest --runInBand --testTimeout=30000 --setupFiles=./tests/jest-env.js --setupFilesAfterEnv=./tests/setup.js"
}
```

### 12.3 Example Test Suite

**campaigns.test.js:**
```javascript
describe('Campaign Creation', () => {
  let patientToken, patientId;

  beforeEach(async () => {
    // Setup: Create test patient user
    const patient = await User.create({
      email: `patient-${Date.now()}@test.com`,
      password: 'hashed-password',
      name: 'Test Patient',
      role: 'patient'
    });
    patientId = patient._id;
    patientToken = generateToken(patient);
  });

  test('POST /campaigns - Create campaign with valid data', async () => {
    const response = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${patientToken}`)
      .field('title', 'Heart Surgery Treatment')
      .field('description', 'Need funding for urgent heart transplant surgery...')
      .field('targetAmount', '5.0')
      .field('medicalDetails', JSON.stringify({
        condition: 'Heart failure',
        severityLevel: 'critical'
      }))
      .attach('documents', path.join(__dirname, 'fixtures/diagnosis.pdf'));

    expect(response.status).toBe(201);
    expect(response.body.campaign).toBeDefined();
    expect(response.body.campaign.status).toMatch(/draft|pending_verification|active/);
    expect(response.body.riskAssessment).toBeDefined();
  });

  test('POST /campaigns - Reject invalid title (<10 chars)', async () => {
    const response = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        title: 'Short',
        description: 'Description must be at least 50 characters...',
        targetAmount: 5.0
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Title must be at least 10 characters');
  });

  test('POST /campaigns - Donor cannot create campaign', async () => {
    const donor = await User.create({
      email: `donor-${Date.now()}@test.com`,
      password: 'hashed-pass',
      name: 'Test Donor',
      role: 'donor'
    });
    const donorToken = generateToken(donor);

    const response = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ title: 'Test Campaign' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Insufficient permissions');
  });
});

describe('Campaign Retrieval', () => {
  test('GET /campaigns - List all campaigns (no auth required)', async () => {
    const response = await request(app).get('/api/campaigns');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.campaigns)).toBe(true);
    expect(response.body.pagination).toBeDefined();
  });

  test('GET /campaigns/:id - Get specific campaign', async () => {
    const campaign = await Campaign.create({
      title: 'Test Campaign',
      description: 'Description for testing purposes...',
      patientId: new mongoose.Types.ObjectId(),
      targetAmount: 5.0
    });

    const response = await request(app).get(`/api/campaigns/${campaign._id}`);

    expect(response.status).toBe(200);
    expect(response.body.campaign._id).toBe(campaign._id.toString());
  });
});
```

### 12.4 Test Coverage Goals

| Component | Coverage Target |
|-----------|-----------------|
| Models (schemas) | 100% |
| Middleware | 95%+ |
| Routes (happy path) | 90%+ |
| Error handling | 85%+ |
| Edge cases | 75%+ |

---

## 13. Error Handling & Logging

### 13.1 Logging System (Winston)

**File:** `backend/utils/logger.js`

**Log Levels:**
```javascript
logger.error(message)    // Critical errors
logger.warn(message)     // Warnings
logger.info(message)     // General info
logger.debug(message)    // Debug details
```

**Log Output:**
```
[2024-04-17T10:30:45.123Z] [INFO] Campaign created: 60d5ec49f1b2c72e44e8c1a3
[2024-04-17T10:31:00.456Z] [WARN] Retry attempt 1/5 for deployContract
[2024-04-17T10:31:15.789Z] [ERROR] Smart contract call failed: Insufficient gas
[2024-04-17T10:31:20.012Z] [DEBUG] User authenticated: patient@example.com
```

**Log Files:**
- `backend/logs/combined.log` - All logs
- `backend/logs/error.log` - Errors only
- Daily rotation enabled (dated filenames)

### 13.2 Error Response Format

**Standardized Error Response:**
```javascript
{
  error: "Campaign not found",
  code: "CAMPAIGN_NOT_FOUND",
  status: 404,
  timestamp: "2024-04-17T10:32:00Z",
  path: "/api/campaigns/invalid-id"
}
```

**Error Codes:**
- `400` BAD_REQUEST - Invalid input
- `401` UNAUTHORIZED - Missing/invalid JWT
- `403` FORBIDDEN - Insufficient role
- `404` NOT_FOUND - Resource doesn't exist
- `409` CONFLICT - State conflict (e.g., campaign already active)
- `500` INTERNAL_ERROR - Server error

---

## 14. Socket.IO Real-Time Communication

### 14.1 Socket Events

**Emitted Events (Server → Client):**
```javascript
// Donation received
io.emit('donation_received', {
  campaignId: '...',
  amount: 0.5,
  donorName: 'Anonymous',
  totalRaised: 2.5,
  percentComplete: 50
});

// Milestone confirmed
io.emit('milestone_confirmed', {
  campaignId: '...',
  milestoneIndex: 0,
  confirmedAt: '2024-04-17T10:30:00Z'
});

// Milestone released
io.emit('milestone_released', {
  campaignId: '...',
  milestoneIndex: 0,
  amountReleased: 1.5
});

// Campaign status changed
io.emit('campaign_status_changed', {
  campaignId: '...',
  newStatus: 'active'
});
```

**Listening Events (Client → Server):**
```javascript
// Client joins campaign room
socket.on('join_campaign', { campaignId })

// Client leaves campaign room
socket.on('leave_campaign', { campaignId })
```

### 14.2 Socket Integration in Routes

```javascript
// In donations route
const io = getIO(); // Get Socket.IO instance

io.emit('campaign_updated', {
  campaignId,
  raisedAmount: campaign.raisedAmount,
  percentComplete: (campaign.raisedAmount / campaign.targetAmount) * 100
});

// Emit to specific room
emitToRoom(`campaign_${campaignId}`, 'donation_received', {
  ...donationDetails
});
```

---

## 15. Deployment & Configuration

### 15.1 Environment Variables (.env)

```bash
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/medtrustfund

# JWT & Security
JWT_SECRET=your-secret-key-here-min-32-chars
PASSWORD_RESET_TOKEN_EXPIRY=3600000

# Blockchain
BLOCKCHAIN_NETWORK=amoy
PRIVATE_KEY=0x1234567890abcdef...
RPC_URL=https://rpc-amoy.polygon.technology
FACTORY_ADDRESS=0xabcd1234...

# AI Service
AI_SERVICE_URL=http://localhost:8001

# Email
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-specific-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# CORS & Frontend
FRONTEND_URL=http://localhost:5173

# Rate Limiting
API_RATE_LIMIT_MAX=500

# Log Level
LOG_LEVEL=info
```

### 15.2 Deployment Steps

**1. Backend:**
```bash
# Install dependencies
cd backend
npm install

# Compile Hardhat contracts (generates artifacts)
cd ../hardhat
npx hardhat compile

# Deploy backend
cd ../backend
npm start
```

**2. AI Service:**
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

**3. Frontend:**
```bash
cd frontend
npm install
npm run build
npm run preview
```

### 15.3 Production Deployment (Railway/Vercel)

**Backend Deployment (Railway):**
```yaml
# railway.toml
[build]
builder = "dockerfile"

[start]
cmd = "npm start"

[env]
MONGODB_URI = "${{ secrets.MONGODB_URI }}"
JWT_SECRET = "${{ secrets.JWT_SECRET }}"
# ... other env vars
```

---

## Summary

The **MedTrustFund Backend** is a **production-ready, secure, and scalable** Node.js/Express application that orchestrates:

1. **User Authentication & Authorization** via JWT + RBAC
2. **Campaign Management** with AI-powered fraud detection
3. **Smart Contract Interaction** with retry logic & error handling
4. **Real-Time Updates** via Socket.IO
5. **Comprehensive Audit Trails** with 5-year retention
6. **Blockchain Integration** for transparent fund management

**Key Statistics:**
- **Routes:** 9 API modules (auth, campaigns, donations, milestones, admin, analytics, hospitals, kyc, transactions)
- **Models:** 7 MongoDB collections
- **Middleware:** 4 core layers (auth, rbac, audit, error handling)
- **Tests:** Jest suite with >90% coverage target
- **Security:** Helmet, bcryptjs, rate limiting, input sanitization, XSS protection

All components are **containerized**, **monitored**, and **production-ready** for deployment on Railway or similar platforms.
