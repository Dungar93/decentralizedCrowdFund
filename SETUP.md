# MedTrustFund - Setup & Run Guide

## Prerequisites

Before running MedTrustFund, ensure you have the following installed:

- **Node.js** v18+ and npm
- **MongoDB** (local or Atlas)
- **Python** 3.9+ (for AI service)
- **MetaMask** browser extension (for Web3 donations)

---

## Quick Start

### 1. Install Dependencies

```bash
# Root dependencies (if any)
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# AI service dependencies
cd ../ai-service
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Backend Configuration
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/medtrust
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRY=7d

# Blockchain Configuration (Hardhat local network)
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# AI Service
AI_SERVICE_URL=http://localhost:8001

# Frontend
VITE_API_URL=http://localhost:5000
```

---

## Running the Application

### Step 1: Start MongoDB

```bash
# If using local MongoDB
mongod --dbpath /data/db

# Or use MongoDB Atlas connection string in .env
```

### Step 2: Start Hardhat Local Blockchain

```bash
cd hardhat
npx hardhat node
```

This starts a local Ethereum blockchain at `http://127.0.0.1:8545` with pre-funded test accounts.

**Important:** The default `PRIVATE_KEY` in `.env` matches the first Hardhat account. For production, use a testnet!

### Step 3: Compile Smart Contracts

In a new terminal:

```bash
cd hardhat
npx hardhat compile
```

This generates the ABI artifacts needed for contract deployment.

### Step 4: Start the AI Verification Service

```bash
cd ai-service

# Install Python dependencies if needed
pip install fastapi uvicorn pytesseract pillow fitz-python pandas numpy

# Start the AI service
python main.py
```

The AI service runs at `http://localhost:8001`.

**Python Dependencies:**
```bash
pip install fastapi uvicorn[standard] pytesseract pillow pymupdf python-multipart
```

### Step 5: Start the Backend Server

```bash
cd backend
npm start
```

The backend API runs at `http://localhost:5000`.

### Step 6: Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend runs at `http://localhost:5173` (or your configured port).

---

## Testing the Application

### 1. Create Users

Register users with different roles:

- **Patient**: Can create campaigns
- **Donor**: Can donate to campaigns
- **Hospital**: Can verify milestones
- **Admin**: Can review campaigns and deploy contracts

### 2. Create a Campaign (Patient)

1. Login as a patient
2. Go to "Create Campaign"
3. Fill in campaign details
4. Upload medical documents (PDF, JPG, PNG)
5. Submit for AI verification

### 3. Deploy Smart Contract (Admin)

1. Login as admin
2. Go to Admin Dashboard
3. Review pending campaigns
4. Approve a campaign
5. Deploy smart contract for the campaign

### 4. Donate (Donor)

1. Connect MetaMask wallet
2. Browse campaigns
3. Select a campaign with deployed contract
4. Enter donation amount
5. Confirm transaction in MetaMask

### 5. Verify Milestones (Hospital)

1. Login as hospital
2. Go to "Milestones"
3. Confirm treatment milestones
4. Patient/Admin releases funds

---

## Testing with Polygon Testnet (Optional)

For more realistic testing, use Polygon Amoy testnet:

### 1. Get Test MATIC

Visit: https://faucet.polygon.technology/

### 2. Update Hardhat Config

Edit `hardhat/hardhat.config.js`:

```javascript
networks: {
  amoy: {
    url: "https://rpc-amoy.polygon.technology",
    accounts: [process.env.PRIVATE_KEY],
  },
},
```

### 3. Update .env

```env
RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your-testnet-private-key
```

### 4. Deploy Contract

```bash
cd hardhat
npx hardhat run scripts/deploy.js --network amoy
```

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Campaigns
- `POST /api/campaigns` - Create campaign (Patient)
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns/:id/deploy-contract` - Deploy escrow contract (Admin)

### Donations
- `POST /api/donations` - Record donation
- `POST /api/donations/:campaignId/donate-direct` - Direct donation via contract
- `GET /api/donations` - Get user donations

### Milestones
- `POST /api/milestones/:campaignId/confirm` - Confirm milestone (Hospital)
- `POST /api/milestones/:campaignId/release` - Release funds (Patient/Admin)

### Admin
- `GET /api/admin/dashboard` - Admin statistics
- `GET /api/admin/campaigns/pending-review` - Campaigns needing review
- `POST /api/admin/campaigns/:id/decision` - Approve/reject campaign

---

## Troubleshooting

### MongoDB Connection Error
```
⚠️ MongoDB connection pending
```
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`

### AI Service Not Responding
```
AI verification error: connect ECONNREFUSED
```
- Start the AI service: `cd ai-service && python main.py`
- Check `AI_SERVICE_URL` in `.env`

### Contract Deployment Fails
```
Contract artifact not found
```
- Compile contracts: `cd hardhat && npx hardhat compile`

### Transaction Fails
```
insufficient funds
```
- Ensure wallet has test ETH/MATIC
- Check gas settings

---

## Project Structure

```
decentralizedCrowdFund/
├── backend/              # Node.js Express API
│   ├── routes/          # API route handlers
│   ├── models/          # MongoDB schemas
│   ├── middleware/      # Auth & RBAC
│   ├── services/        # Business logic
│   ├── utils/           # Contract utilities
│   └── server.js        # Entry point
├── frontend/            # React + TypeScript UI
│   ├── src/pages/      # Page components
│   ├── src/components/ # Reusable components
│   ├── src/utils/      # Web3 utilities
│   └── src/services/   # API client
├── ai-service/         # Python FastAPI verification
│   └── main.py        # AI verification endpoints
├── hardhat/           # Smart contracts
│   ├── contracts/     # Solidity contracts
│   ├── scripts/       # Deployment scripts
│   └── artifacts/     # Compiled contracts (generated)
└── SETUP.md          # This file
```

---

## Security Notes

⚠️ **For Development Only**:
- Never use mainnet private keys in `.env`
- The default Hardhat key is public - change for production
- Store JWT secrets securely
- Enable CORS properly for production

🔒 **Production Checklist**:
- [ ] Use environment-specific secrets
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up monitoring/logging
- [ ] Audit smart contracts
- [ ] Use hardware wallets for contract deployment

---

## Team

- Dungar Soni (B23CS1105) - Architecture & Blockchain Lead
- Prakhar Goyal (B23CS1106) - AI Verification & Backend Lead
- Raditya Saraf (B23CS1107) - Frontend & UX Lead

---

**MedTrustFund** - AI-Verified Blockchain Medical Crowdfunding Platform
claude --resume b7e7497b-9b1a-4f09-9917-ff628ce50267 