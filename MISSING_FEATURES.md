# MedTrustFund — Missing Features & Remaining Work

> **Generated:** April 13, 2026 (after full codebase audit)
> **Status:** This replaces earlier gap analysis. Based on reviewing all 26 frontend pages, 9 backend routes, and all utilities.

---

## Legend
- ✅ **Fully Implemented** — Code exists, working end-to-end
- ⚙️ **Implemented, Needs Config** — Code is complete, but requires environment variables / external service credential
- 🔶 **Partial** — Backend or frontend done, but not both wired together
- ❌ **Missing** — Not implemented at all

---

## 1. Email Notifications ⚙️ Needs SMTP Config

**Status:** Code is 100% complete. Not sending in production because `SMTP_USER` / `SMTP_PASS` are not set.

`backend/utils/emailService.js` has **12 email templates** fully implemented:
- Welcome, Password Reset, Campaign Approved/Rejected
- Donation Received/Confirmed/Refunded
- Milestone Confirmed, Funds Released
- KYC Approved/Rejected, Hospital Assigned, Campaign Goal Reached

**All these are wired into the relevant routes.** They currently log to console instead of sending.

**What's needed:** Set these env vars in `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=MedTrustFund <noreply@medtrustfund.org>
```

---

## 2. Real-Time WebSocket Notifications ⚙️ Needs Backend Emission in More Routes

**Status:** Socket.io is initialized in `backend/server.js`. The `Notifications.tsx` frontend page is fully wired to receive live events. `backend/utils/socket.js` has `emitToRoom()` and `emitToAll()` helpers.

**Issue:** Socket events are only emitted in `kyc.js` (KYC approve/reject). The following routes DON'T emit socket events yet:
- `donations.js` — should emit `donation:received` to the patient
- `campaigns.js` (decision) — should emit `campaign:reviewed`
- `milestones.js` — should emit `milestone:confirmed` and `milestone:released`

**What's needed:** Add `emitToRoom()` calls in those 3 routes.

---

## 3. Public Testnet / Mainnet Deployment ❌ Not Configured

**Status:** Hardhat is generating contracts only on `localhost:8545`. MetaMask's Blockaid security actively blocks these local transactions.

**What's needed:**
- Register on **Alchemy** or **Infura** to get a Sepolia RPC URL
- Update `backend/.env`: `RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`
- Update `PRIVATE_KEY` in `.env` to a funded Sepolia wallet
- Re-deploy contracts using `npx hardhat run scripts/deploy.js --network sepolia`
- Update the frontend `VITE_CHAIN_ID=11155111` (Sepolia)

---

## 4. Fund Release Flow (Patient / Admin) 🔶 Partial

**Status:** The `POST /api/milestones/:campaignId/release` endpoint exists in `milestones.js` and is wired to the blockchain. The "Release Funds" button exists in `Milestones.tsx`.

**Issue:** The "Test Bypass (Backend)" button was added for milestone **confirmation** (hospital), but NOT for milestone **release** (patient/admin). If MetaMask blocks the release transaction, there is no fallback.

**What's needed:** Add a backend bypass for release like: `POST /api/milestones/:campaignId/release` without requiring a `transactionHash`, using `hardhat_impersonateAccount` on the patient/admin wallet (same pattern as the confirm bypass).

---

## 5. Frontend Unit & E2E Tests ❌ Missing

**Status:** Backend tests in `backend/tests/` (50+ tests) and smart contract tests in `hardhat/test/` exist. The frontend `vitest.config.ts` exists but the `src/__tests__/` directory has no test files.

**What's needed:**
- React Testing Library tests for critical components (Login, CreateCampaign, CampaignDetail)
- At minimum, test form validation and authentication flows

---

## 6. Hospital Wallet Assignment UI 🔶 Partial

**Status:** Admin can currently deploy a contract to a hospital's wallet address. But the hospital must first set their wallet address manually in their Profile page.

**Issue:** There is no validation in the Admin contract deployment UI to warn the admin when the assigned hospital has **no wallet linked**. The deployment silently fails or deploys with `address(0)`.

**What's needed:** In the Admin Campaign Review UI, before allowing deployment, verify `hospitalId.walletAddress` is set and display a clear blocker if not.

---

## 7. Campaign Expiry / Closure Logic ❌ Missing

**Status:** The Campaign model has no `expiresAt` or auto-close logic. Campaigns that fail to reach their target remain `active` forever.

**What's needed:**
- Add `expiresAt` field to Campaign model (e.g. 90 days from creation)
- A scheduled job (cron) in the backend to close expired campaigns
- UI indicator showing days remaining on the Campaign Detail page

---

## 8. Donor Refund via UI ❌ Missing

**Status:** The backend has `POST /api/donations/:campaignId/refund` fully implemented. Admin can trigger it programmatically. But there is **no UI button** for refunds.

**What's needed:**
- In the Admin Campaign Review page, add a "Refund Donor" action
- Optionally, allow patients to request refunds from their campaign page if the campaign fails

---

## 9. Smart Contract Upgrade / Multi-Campaign Factory ❌ Missing

**Status:** Currently each campaign deploys a **fresh** `MedTrustFundEscrow.sol` contract. There is no factory contract.

**What's needed (for production):**
- Write a `MedTrustFundFactory.sol` contract that creates child campaign contracts
- This reduces gas costs and makes admin contract management easier

---

## 10. CI/CD Pipeline ❌ Missing

**Status:** No `.github/workflows/` directory.

**What's needed:**
- GitHub Actions workflow to run `npm test` on every push/PR
- Deploy backend to a cloud provider (Railway, Render, Fly.io) on merge to `main`

---

## Summary Table

| Feature | Status | Priority |
|---------|--------|----------|
| Email Notifications | ⚙️ Needs SMTP config | HIGH |
| Socket Events in Milestones/Donations | ⚙️ 2 routes missing | HIGH |
| Public Testnet Deployment | ❌ Not configured | HIGH |
| Release Funds Backend Bypass | 🔶 No fallback | MEDIUM |
| Frontend Tests | ❌ Missing | MEDIUM |
| Hospital Wallet Validation in Admin UI | 🔶 No blocker shown | MEDIUM |
| Campaign Expiry Logic | ❌ Missing | LOW |
| Donor Refund UI | ❌ Missing | LOW |
| Smart Contract Factory | ❌ Missing | LOW |
| CI/CD Pipeline | ❌ Missing | LOW |

---

## What IS Fully Working ✅

For reference, these are fully implemented end-to-end:
- User Auth (JWT, wallet verification, password reset)
- Campaign creation with AI document verification  
- KYC submission, admin review, encrypt/decrypt
- Donation flow (MetaMask + backend bypass)
- Milestone confirmation (hospital, with Hardhat impersonation bypass)
- Admin dashboard (users, audit logs, contracts, KYC review)
- Socket.io infrastructure (backend + frontend Notifications page)
- Blockchain indexer (polling every 30 sec)
- File encryption (AES-256-CBC for all uploads)
- Smart contract tests (30 tests in `hardhat/test/`)
- Backend API tests (50+ tests in `backend/tests/`)
