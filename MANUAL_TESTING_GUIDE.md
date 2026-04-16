# MedTrustFund — Comprehensive Manual Testing Guide

This guide provides an exhaustive, step-by-step walkthrough to manually test the entire MedTrustFund platform end-to-end, locally, exactly as a user would experience it.

---

## Part 1: Starting the Local Environment

You will need **three terminal windows** running simultaneously.

### Terminal 1: Hardhat Local Network (Blockchain)
1. Open a terminal and navigate to the hardhat folder:
   ```bash
   cd hardhat
   ```
2. Start the local Ethereum blockchain:
   ```bash
   npx hardhat node
   ```
   *Leave this running. It will output 20 test accounts with private keys. Import Account #0 into your MetaMask (this will be your Admin/Deployer wallet).*

### Terminal 2: Backend & AI Service
1. Open a new terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Ensure MongoDB is running locally (or your `.env` points to your Atlas connection).
3. Start the backend server:
   ```bash
   npm run dev
   ```
   *You should see "Server running on port 5000" and "MongoDB Connected".*

### Terminal 3: Frontend Web App
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:5173`.

---

## Part 2: Step-by-Step UI Testing Flows

We will simulate three different users to test the platform.

### User A: The Admin (MetaMask Account #0)
1. **Signup:** Click **Sign Up**, choose **Admin** role (if available, otherwise sign up as a regular user and change your role to `admin` directly in MongoDB database `users` collection for testing).
2. Connect your MetaMask wallet (using Account #0 from the Hardhat node).

### User B: The Patient
1. Open an Incognito/Private window (or use a different browser) and go to `http://localhost:5173`.
2. Click **Sign Up**, fill in the details, and select **Patient** role.
3. Log in.

#### Flow 1: KYC Verification (Patient)
1. Go to **Profile** -> click **Complete Identity Verification**.
2. Upload test ID images (any dummy image) and fill in the details.
3. Submit. Status will show as **Pending**.

#### Flow 2: Admin KYC Approval (Admin)
1. Switch back to your Admin browser window.
2. Navigate to **Admin Dashboard** -> **KYC Review**.
3. You will see the Patient's KYC submission. Click **Approve**.

#### Flow 3: Creating a Campaign (Patient)
1. Switch back to the Patient browser window (now the KYC is approved).
2. Click **Start a Campaign**.
3. Fill out Step 1 (Title, description, target amount: e.g., `2 ETH`).
4. Step 2 (Milestones): Add two milestones (e.g., Surgery: 1 ETH, Recovery: 1 ETH).
5. Step 3 (Medical Docs): Upload dummy documents.
6. Submit the campaign. It will be sent to the AI Service for verification, then moved to **Pending Admin Review**.

#### Flow 4: Admin Campaign Approval (Admin)
1. Go to the Admin window -> **Admin Dashboard** -> **Campaign Review**.
2. Click on the new campaign.
3. Review the AI Risk Score. Click **Approve**.
4. The campaign status changes to **Active**. The Smart Contract is automatically deployed to your local Hardhat node in the background!

### User C: The Donor
1. Open a third browser profile (or use an identity switching extension).
2. Create an account as **Donor**, and connect a different MetaMask account (e.g., Account #1 from Hardhat).
3. Switch your MetaMask network to `Localhost 8545`.

#### Flow 5: Making a Donation
1. Browse to the active campaign.
2. Click **Donate**.
3. Enter `2 ETH`. MetaMask will pop up.
4. Confirm the transaction.
5. The campaign will now show `Funded: 2 ETH / Target: 2 ETH`. Its status changes to **Funded**.

### User D: The Hospital
1. Sign up as a **Hospital**.
2. Connect MetaMask (e.g., Account #2 from Hardhat).
3. The Admin must assign this hospital to the campaign (via Admin Dashboard -> Campaign Detail -> Assign Hospital).

#### Flow 6: Milestones and Payouts
1. **Confirm Milestone (Hospital):** The Hospital logs in -> goes to **My Campaigns** -> clicks the campaign.
2. The Hospital clicks **Confirm Milestone** for Milestone #1. They will sign a MetaMask transaction.
3. **Release Funds (Patient/Admin):** The Patient logs in, goes to the Campaign page, and sees Milestone #1 is confirmed.
4. The Patient clicks **Release Funds**. MetaMask pops up. They confirm.
5. 1 ETH is transferred directly from the Smart Contract into the Patient's wallet.

---

## Part 3: What to Verify

By completing the steps above, you will have successfully tested:
✅ **Database Integrity:** Users, campaigns, and donations act perfectly.
✅ **AI Service:** The Python AI service effectively scores the risk level of the uploaded documents.
✅ **Blockchain / Smart Contracts:** Escrow contracts are deployed, hold ETH securely, and release funds based on specific roles.
✅ **Role-Based Access Control:** Only Hospitals can confirm milestones; only Patients/Admins can release them.
✅ **WebSockets:** Real-time progress bars update when a donation is made without refreshing the page.
✅ **Email Service:** Check your terminal running the backend; you should see SMTP success logs for all these events!

> **Ready for Production!**
> If you make it through this checklist locally, the app is 100% verified and ready to be deployed to Railway (Backend/AI) and Vercel (Frontend).
