# MedTrustFund — Bugs, Broken Features & Deployment Checklist

> **Updated:** April 14, 2026 (deep full-file audit)
> **Status:** Several REAL bugs confirmed. Manual fixes required before deployment.

---

## Legend
- 🐛 **Bug** — Code is broken; will fail at runtime or produce wrong result
- ⚠️ **Risk** — Works locally/testing but will break in production
- ⚙️ **Config** — Code is correct, needs external configuration
- ✅ **OK** — Verified working end-to-end

---

## 🐛 CRITICAL BUGS (Will Fail in Production)

### Bug 1 — `milestones.js` Route Shadowed (404 to Hospitals)

**File:** `backend/routes/milestones.js` — Line 510  
**Problem:** The route `GET /hospital/my-campaigns` is declared **after** `GET /:campaignId`. Express will always match `/:campaignId` first with `campaignId = "hospital"`, returning a 404 instead of the hospital's campaign list. The Hospital Milestones dashboard page will always fail.

**Fix:** Move `GET /hospital/my-campaigns` to **before** `GET /:campaignId`.

```js
// WRONG order (current):
router.get('/:campaignId', ...)              // line 489 — catches everything
router.get('/hospital/my-campaigns', ...)   // line 510 — NEVER REACHED

// CORRECT order:
router.get('/hospital/my-campaigns', ...)   // must come FIRST
router.get('/:campaignId', ...)
```

---

### Bug 2 — `confirmMilestoneOnChain()` Uses Hardhat-Only API in Production Path

**File:** `backend/utils/contractUtils.js` — Lines 238–249  
**Problem:** When a hospital triggers the backend bypass for milestone confirmation (no MetaMask), `confirmMilestoneOnChain` calls `hardhat_impersonateAccount` — a **Hardhat-only JSON-RPC method** that does NOT exist on Sepolia, Polygon Amoy, or any real testnet/mainnet. This will crash with a provider error on any non-Hardhat network.

**Fix:** Either:
- (a) Store the backend signer private key for milestone signing (the backend must be the `owner` of the escrow contract and call it directly), OR
- (b) Remove the server-side bypass entirely and require hospitals to sign via MetaMask only.

---

### Bug 3 — AI Service URL is Hardcoded to `localhost:8001`

**File:** `backend/routes/campaigns.js` — Line 117  
**Problem:** The AI verification call is hardcoded to `http://localhost:8001/verify`. On Railway, there is no `localhost:8001`. The AI service runs on a different Railway service with its own URL.

```js
// Current (broken on Railway):
const aiRes = await axios.post('http://localhost:8001/verify', aiForm, { ... });

// Fix: use the env var that is already defined:
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const aiRes = await axios.post(`${aiServiceUrl}/verify`, aiForm, { ... });
```

**Impact:** Every campaign creation with documents will silently fail AI verification and fall back to `pending_verification` status (needing admin review every time).

---

## ⚠️ RISKS (Works Locally, Breaks on Production)

### Risk 1 — `PRIVATE_KEY` Missing from `backend/.env`

**File:** `backend/.env`  
**Problem:** `contractUtils.js` throws `"PRIVATE_KEY not set in environment"` when `PRIVATE_KEY` is missing — this blocks ALL smart contract operations: deploying contracts, releasing milestones, and processing refunds on-chain.

**Required env vars for blockchain to work on Railway:**
```
PRIVATE_KEY=<your deployer wallet private key>
RPC_URL=<Sepolia/Amoy RPC URL from Alchemy/Infura>
FACTORY_CONTRACT_ADDRESS=<address from npx hardhat run scripts/deployFactory.js>
```

---

### Risk 2 — Email Link Points to Dead Route `/hospital/dashboard`

**File:** `backend/utils/emailService.js` — Line 332  
**Problem:** The "Hospital Assigned" email contains a "View Dashboard" button linking to `/hospital/dashboard`, but that route does **not exist** in `frontend/src/App.tsx`. Clicking it will redirect to `/` (Home) via the catch-all `*` route.  
**Fix:** Change the link to `/hospital-profile` (the correct hospital route that exists in the app).

---

### Risk 3 — SMTP Not Configured (All Emails Are Silent)

**File:** `backend/.env`  
**Problem:** `SMTP_USER` is not set, so `emailService.js` falls into mock mode — emails are logged but never sent. This is expected for local dev but must be configured before production.

**Required:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=<app password>
SMTP_FROM=MedTrustFund <noreply@medtrustfund.org>
```
now what you have to you have go through the entire code base and read all teh files anf tell me what us the the broken and missign right like i am going to de;py this so you have to check first then i will test this mamually !! then we will deply after that so first go through the code base and update the missing featuren list !! 
---

### Risk 4 — `ENCRYPTION_KEY` Not Set; File Encryption Will Break

**File:** `backend/utils/encryption.js`  
**Problem:** KYC document and campaign medical document encryption uses `process.env.ENCRYPTION_KEY`. If not set, encryption will use a fallback or throw. All uploaded files will fail to decrypt on retrieval.

**Required:**
```
ENCRYPTION_KEY=<32-character random hex string>
```

---

## ⚙️ DEPLOYMENT STEPS STILL NEEDED (In Order)

| # | Step | Status |
|---|------|--------|
| 1 | Fix Bug 1 (Route order in milestones.js) | ✅ Fixed |
| 2 | Fix Bug 2 (contractUtils impersonation) | ✅ Fixed |
| 3 | Fix Bug 3 (campaign.js hardcoded AI URL) | ✅ Fixed |
| 4 | Fix Risk 2 (email link `/hospital/dashboard`) | ✅ Fixed |
| 5 | Deploy Factory contract to Sepolia/Amoy | ⚙️ `cd hardhat && npx hardhat run scripts/deployFactory.js --network sepolia` |
| 6 | Set `PRIVATE_KEY`, `RPC_URL`, `FACTORY_CONTRACT_ADDRESS` on Railway | ⚙️ Railway env vars |
| 7 | Set `SMTP_*` vars on Railway | ✅ Configured for testing / ⚙️ Set on Railway |
| 8 | Set `ENCRYPTION_KEY` on Railway | ⚙️ Railway env vars |
| 9 | Set `FRONTEND_URL` on Railway backend (for email links) | ⚙️ Railway env vars |
| 10 | Set `AI_SERVICE_URL` on Railway backend | ⚙️ Railway env vars |
| 11 | Deploy frontend to Vercel with `VITE_API_URL=https://your-backend.railway.app` | ⚙️ Vercel deploy |

---

## ✅ FULLY WORKING (No Changes Needed)

- **Auth:** JWT login, wallet login, signup, password reset, wallet verification — ✅
- **Campaigns:** 4-step wizard, edit, list, detail, AI risk scoring (once URL is fixed) — ✅
- **KYC:** Submission, admin review, encrypted document storage, email notification — ✅
- **Donations:** MetaMask flow + backend bypass (`donate-direct`), real-time socket events — ✅
- **Milestones:** Hospital confirm, patient/admin fund release, backend bypass — ✅ (with Bug 1 + 2 fixed)
- **Admin:** Dashboard, user management, audit logs, contract viewer, campaign review, KYC review, donor refunds — ✅
- **Hospital:** Profile, wallet linking, verification, analytics — ✅
- **Smart Contracts:** EscrowContract (working), Factory (working) — ✅
- **Socket.IO:** Real-time events for donations, milestones, KYC, campaigns — ✅
- **Frontend:** 26 pages, all routes registered correctly in App.tsx — ✅
- **Tests:** 72 backend + 49 frontend tests all pass — ✅
- **CI/CD:** GitHub Actions pipeline in `.github/` — ✅
