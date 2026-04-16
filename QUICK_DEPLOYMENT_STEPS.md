# ⚡ QUICK ACTION ITEMS - Before Deployment

**Status:** April 16, 2026 - Most code is working, but deployment config is missing

---

## 🔴 CRITICAL: Do These First (Blocks Deployment)

### 1. Deploy Smart Contract Factory
```bash
cd hardhat
npx hardhat compile
npx hardhat run scripts/deployFactory.js --network sepolia
# Save the factory address (looks like: 0x123abc...)
```

**Why:** Backend cannot deploy escrow contracts without this  
**Time:** 5 minutes

---

### 2. Generate Encryption Key
```bash
openssl rand -hex 32
# Example output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
```

**Why:** File encryption will fail without this  
**Time:** 1 minute

---

### 3. Configure Railway Environment Variables
Set these on Railway backend service:

```
MONGODB_URI=<provided by Railway MongoDB add-on>
PRIVATE_KEY=<from hardhat/accounts or MetaMask>
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<your-key>
FACTORY_CONTRACT_ADDRESS=<from step 1>
ENCRYPTION_KEY=<from step 2>
AI_SERVICE_URL=http://localhost:8001  (or your AI service URL)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<google app password>
SMTP_FROM=MedTrustFund <noreply@medtrustfund.org>
FRONTEND_URL=https://your-vercel-frontend.com
```

**Why:** Production backend needs these to function  
**Time:** 10 minutes

---

### 4. Verify All Tests Pass
```bash
# Backend tests
cd backend
npm test

# Smart contract tests  
cd ../hardhat
npx hardhat test

# Expected: All tests PASS ✅
```

**Why:** Confirms code is not broken  
**Time:** 5 minutes

---

## 🟡 IMPORTANT: Test These (Found Issues)

### 1. Email Notifications
- [ ] Test password reset email arrives
- [ ] Check email uses correct SMTP credentials
- [ ] Verify email links point to production frontend

**How to test:**
1. Go to forgot-password page
2. Submit email
3. Check inbox (and spam folder)

---

### 2. MetaMask Connection
- [ ] Connect wallet to frontend
- [ ] Show connected account
- [ ] Try switching networks (Sepolia → Amoy)
- [ ] Submit a test donation

**How to test:**
1. Click "Connect Wallet"
2. Approve in MetaMask
3. Should show your address

---

### 3. Campaign Creation → Risk Score
- [ ] Upload medical documents (all 4 types)
- [ ] AI service processes them
- [ ] Risk score displays (0-100)
- [ ] Campaign appears in admin dashboard

**How to test:**
1. Create campaign with PDFs/images
2. Risk score should appear in 10-30 seconds
3. Admin should see it in review panel

---

### 4. Smart Contract Deployment
- [ ] Create campaign
- [ ] Click "Deploy Contract"  
- [ ] Contract should deploy to blockchain
- [ ] Contract address stored in database

**How to test:**
1. Create campaign (low-risk)
2. Click "Deploy Contract" button
3. Approve MetaMask transaction
4. Wait 10-20 seconds
5. Should show "Contract deployed at: 0x..."

---

### 5. Donation & Fund Release Flow
- [ ] Donor submits ETH via MetaMask
- [ ] Funds locked in contract
- [ ] Hospital confirms milestone on-chain
- [ ] Patient/admin releases funds
- [ ] Funds appear in patient wallet

**How to test:**
1. Find a campaign with deployed contract
2. Donate 0.01 ETH
3. Approve MetaMask transaction
4. Go to milestones → hospital confirms
5. Milestones → admin releases funds
6. Check patient wallet for ETH

---

## 💡 OPTIONAL: Nice-to-Have (Can Do Later)

- [ ] Frontend unit tests (26 pages)
- [ ] Load testing (stress test with 100+ users)
- [ ] HIPAA compliance (field encryption for PHI)
- [ ] Per-user rate limiting
- [ ] Document fingerprinting for tampering detection

---

## 📋 FINAL DEPLOYMENT CHECKLIST

Before clicking "Deploy" on production:

```
SECURITY
☐ PRIVATE_KEY is in Railway Secrets (not .env)
☐ JWT_SECRET is not default
☐ ENCRYPTION_KEY is 64 characters
☐ CORS_ORIGIN set to production frontend

CONFIGURATION  
☐ Factory contract deployed ✓
☐ All env vars set on Railway ✓
☐ SMTP email configured ✓
☐ AI_SERVICE_URL points to running service ✓
☐ FRONTEND_URL set correctly ✓

TESTING
☐ Backend tests pass ✓
☐ Smart contract tests pass ✓
☐ Manual flow test completed ✓
☐ Email notifications working ✓
☐ MetaMask connection working ✓

DEPLOYMENT
☐ Backend deployed to Railway ✓
☐ Frontend deployed to Vercel ✓
☐ Health checks respond ✓
☐ Error logging configured ✓
☐ Monitoring alerts set up ✓

MONITORING (First 24h)
☐ Check logs for errors
☐ Monitor CPU/memory usage
☐ Test user signup via production site
☐ Test campaign creation flow
☐ Verify audit logs are recording
```

---

## 🆘 Most Common Issues & Fixes

### Issue: "AI_SERVICE_URL connection refused"
**Fix:** Set `AI_SERVICE_URL` in Railway env vars OR deploy AI service

### Issue: "Contract deployment fails with RPC error"
**Fix:** Check RPC_URL is correct and network is Sepolia/Amoy

### Issue: "Files not encrypting"
**Fix:** Check ENCRYPTION_KEY is set and is 64 characters

### Issue: "Password reset emails not sending"
**Fix:** Check SMTP credentials, Gmail needs App Password not regular password

### Issue: "MetaMask says wrong network"
**Fix:** MetaMask auto-detects from contract. Add chain to MetaMask if missing

### Issue: "Tests fail with MongoDB error"
**Fix:** Run `mongod` in separate terminal OR use MongoDB Atlas for tests

---

## 📞 Quick Reference

- **Backend:** http://localhost:5000 (local) or Railway URL
- **Frontend:** http://localhost:5173 (local) or Vercel URL
- **AI Service:** http://localhost:8001 (local) or Railway URL
- **MongoDB:** mongodb://localhost:27017 (local) or Atlas connection string
- **Sepolia RPC:** https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
- **Polygon Amoy RPC:** https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY

---

**Bottom Line:** All code is written and working locally. Just need to configure environment variables, deploy contracts, and do final testing. ~2 hours to go live.
