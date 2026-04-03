# MedTrustFund - Decentralized Medical Crowdfunding Platform

MedTrustFund is a blockchain-based medical crowdfunding platform that combines AI-powered document verification with smart contract escrow to enable transparent, trust-minimized fundraising for medical expenses.

## Features

- **AI-Powered Document Verification** - Automated fraud detection using OCR, metadata analysis, and weighted risk scoring
- **Blockchain Escrow** - Donations locked in smart contracts, released only upon hospital milestone confirmation
- **Role-Based Access Control** - Separate dashboards for Patients, Donors, Hospitals, and Admins
- **5-Year Audit Logging** - Comprehensive immutable audit trail for compliance
- **Risk Score Badges** - Transparent risk assessment visible to donors (Low/Medium/High)

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Chakra UI |
| Backend | Node.js, Express, MongoDB, JWT |
| Blockchain | Solidity 0.8.24, Hardhat, ethers.js v6 |
| AI Service | Python, FastAPI, PyTesseract OCR, PyMuPDF |

## Project Structure

```
decentralizedCrowdFund/
├── frontend/           # React + TypeScript UI
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route pages
│   │   ├── contexts/   # React contexts
│   │   └── services/   # API client
│   └── package.json
├── backend/            # Node.js + Express API
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API route handlers
│   ├── middleware/     # Auth, RBAC, audit logging
│   └── server.js       # Main entry point
├── hardhat/            # Ethereum smart contracts
│   ├── contracts/      # Solidity contracts
│   └── scripts/        # Deployment scripts
├── ai-service/         # Python FastAPI service
│   └── main.py         # Document verification API
└── .env.example        # Environment template
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- MongoDB (local or Atlas)
- MetaMask browser extension

### 1. Clone and Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# AI service dependencies
cd ../ai-service
pip install -r requirements.txt

# Hardhat contracts
cd ../hardhat
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# - Set MONGODB_URI
# - Set JWT_SECRET (use a strong random string)
# - Set PRIVATE_KEY for contract deployment
```

### 3. Start Services

```bash
# Terminal 1: Start MongoDB (if running locally)
mongod

# Terminal 2: Start AI Service
cd ai-service
uvicorn main:app --reload --port 8001

# Terminal 3: Start Backend
cd backend
npm run dev

# Terminal 4: Start Frontend
cd frontend
npm run dev
```

### 4. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **AI Service:** http://localhost:8001
- **API Health:** http://localhost:5000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/verify-wallet` - Link wallet

### Campaigns
- `POST /api/campaigns` - Create campaign (Patient)
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/deploy-contract` - Deploy smart contract (Admin)
- `POST /api/campaigns/:id/admin-review` - Admin review (Admin)

### Donations
- `POST /api/donations` - Create donation (Donor)
- `GET /api/donations` - List donations
- `GET /api/donations/:id` - Get donation details
- `POST /api/donations/:id/refund` - Request refund

### Milestones
- `POST /api/milestones/:campaignId/confirm` - Confirm milestone (Hospital)
- `POST /api/milestones/:campaignId/release` - Release funds (Patient/Admin)
- `GET /api/milestones/:campaignId` - Get milestones

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/campaigns/pending-review` - Pending campaigns
- `POST /api/admin/campaigns/:id/decision` - Approve/reject campaign
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/audit-logs/export` - Export logs (5-year retention)

## User Roles

| Role | Permissions |
|------|-------------|
| **Patient** | Create campaigns, upload documents, track funds |
| **Donor** | Browse campaigns, view risk scores, donate via Web3 |
| **Hospital** | Confirm treatment milestones, view assigned campaigns |
| **Admin** | Review escalated campaigns, override AI, manage users, view audit logs |

## Risk Score System

The AI verification service computes a weighted risk score (0-100):

```
RiskScore = 0.35 × TamperingScore + 0.35 × AIProbability + 0.30 × MetadataMismatch
```

| Score Range | Category | Action |
|-------------|----------|--------|
| 0-39 | Low Risk | Auto-approved |
| 40-69 | Medium Risk | Advisory note to donors |
| 70-100 | High Risk | Admin review required |

## Smart Contract

The `MedTrustFundEscrow` contract implements milestone-based fund release:

- `donate()` - Accept ETH contributions
- `confirmMilestone(index)` - Hospital confirms milestone
- `releaseMilestone(index)` - Release funds after confirmation
- `getMilestones()` - View milestone status

## Security Features

- JWT-based authentication with role verification
- Password hashing with bcrypt
- Wallet signature verification
- Document hash storage for integrity
- 5-year audit log retention (TTL index)
- RBAC on all sensitive endpoints

## Performance Targets (per SRS v2.0)

| Operation | Target |
|-----------|--------|
| OCR Processing | 10-15 seconds |
| Metadata Validation | 5-8 seconds |
| AI Fraud Analysis | ~5 seconds |
| Total Verification | ≤ 40 seconds |
| Blockchain Confirmation | 85-110 seconds |

## Team

- **Dungar Soni** (B23CS1105) - Architecture & Blockchain Lead
- **Prakhar Goyal** (B23CS1106) - AI Verification & Backend Lead
- **Raditya Saraf** (B23CS1107) - Frontend & UX Lead

## License

MIT License - IIT Jodhpur, Team DCF-Alpha-01
