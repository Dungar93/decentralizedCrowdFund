
# MedTrustFund: AI-Verified Blockchain Medical Crowdfunding Platform

> **Version 2.0** | IIT Jodhpur | Team DCF–Alpha–01  
> Dungar Soni (B23CS1105) · Prakhar Goyal (B23CS1106) · Raditya Saraf (B23CS1107)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [User Roles & User Flows](#7-user-roles--user-flows)
8. [Fraud Detection & Document Verification](#8-fraud-detection--document-verification)
9. [Blockchain Escrow & Smart Contracts](#9-blockchain-escrow--smart-contracts)
10. [Audit Logging & Retention Policy](#10-audit-logging--retention-policy)
11. [Data Model (Entity Relationship)](#11-data-model-entity-relationship)
12. [UML Diagrams Explained](#12-uml-diagrams-explained)
13. [Sprint Planning & Development Strategy](#13-sprint-planning--development-strategy)
14. [Experimental Results & Evaluation](#14-experimental-results--evaluation)
15. [Security & Governance](#15-security--governance)
16. [System Limitations & Ethical Considerations](#16-system-limitations--ethical-considerations)
17. [Design Evolution: SRS v1.0 → v2.0](#17-design-evolution-srs-v10--v20)
18. [ESSENCE Kernel Stakeholder Analysis](#18-essence-kernel-stakeholder-analysis)
19. [Requirements Traceability Matrix](#19-requirements-traceability-matrix)
20. [Future Enhancements](#20-future-enhancements)
21. [Team Contributions](#21-team-contributions)
22. [References](#22-references)

---

## 1. Project Overview

**MedTrustFund** is a secure, transparent, and scalable medical crowdfunding platform that combines:

- **AI-based document verification** — Automated detection of forged or fraudulent medical documents using OCR, metadata analysis, and probabilistic fraud scoring.
- **Blockchain-enforced escrow** — Donations are locked in smart contracts and released only upon verified hospital milestone confirmation.
- **Structured audit logging** — Every critical event is immutably recorded and retained for a minimum of 5 years.

### Core Value Proposition

| Problem in Existing Platforms | MedTrustFund Solution |
|---|---|
| No standardized fraud scoring | Quantitative risk score (0–100 scale) |
| Manual, inconsistent verification | AI-automated OCR + metadata pipeline |
| No enforcement of fund usage | Smart contract escrow with milestone-gated release |
| Minimal audit trails | 5-year append-only encrypted audit logs |
| Donor skepticism and lack of trust | Transparent risk badges visible to donors |

---

## 2. Problem Statement

### 2.1 Core Problem

Medical crowdfunding platforms face three fundamental weaknesses:

1. **Fraudulent campaigns** — Forged documentation is submitted with little or no automated screening.
2. **No structured risk assessment** — Platforms rely on manual, subjective review which does not scale.
3. **No fund utilization enforcement** — Once donated, funds can be misused with no accountability mechanism.

### 2.2 Impact

- Genuine patients lose access to funds diverted by fraudulent campaigns.
- Donor confidence erodes, reducing platform sustainability.
- Platform administrators face rising operational burden without automation.
- The problem transcends technical inefficiency — it enters the domain of **ethical accountability and digital governance**.

### 2.3 Research Gap

> No existing unified architecture integrates **probabilistic fraud scoring** with **milestone-driven smart contract enforcement** specifically for medical crowdfunding.

Existing platforms are either:
- AI-aware but financially uncontrolled (verification only), or
- Blockchain-based but document-agnostic (no authenticity checks).

MedTrustFund bridges this gap with a tightly coupled AI + blockchain governance architecture.

---

## 3. System Architecture

### 3.1 High-Level Overview

MedTrustFund is a distributed web-based system with the following major components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER DEVICES                             │
│         Browser (Patient / Donor / Hospital / Admin)           │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────────┐
│                     BACKEND SERVER                              │
│         API Entry Port → RBAC Authorization Layer              │
│         Campaign Service | Auth Service | Audit Logger         │
└───────┬────────────────────────────────────────┬───────────────┘
        │                                        │
┌───────▼──────────────────┐     ┌───────────────▼──────────────┐
│   AI VERIFICATION SERVER │     │    BLOCKCHAIN NETWORK        │
│                          │     │                              │
│  Document Classifier     │     │  Smart Contract (Escrow)     │
│  OCR Engine              │     │  Wallet Interface            │
│  Forgery Analyzer        │     │  Milestone Verification      │
│  Metadata Consistency    │     │  Transaction Logger          │
│  Risk Intelligence Layer │     │                              │
│  AI Probability Model    │     │                              │
│  Weighted Risk Aggregator│     │                              │
│  Threshold Decision Gate │     │                              │
└──────────────────────────┘     └──────────────────────────────┘
        │                                        │
┌───────▼────────────────────────────────────────▼──────────────┐
│                    AUDIT & COMPLIANCE LAYER                    │
│         Immutable Event Logger | Retention Policy Enforcer    │
│                   (5-Year Minimum Retention)                   │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Layered Architecture Breakdown

#### Layer 1: Frontend Layer
- Web UI built with **React.js**
- Role-specific dashboards for Patient, Donor, Hospital, Admin
- Risk badge display for donor transparency
- Pending transaction indicators with blockchain polling

#### Layer 2: Backend Services Layer
- **Node.js + Express** REST API
- Campaign Service — handles campaign lifecycle
- Auth Service — JWT-based authentication, role assignment
- Audit Logger — appends events to the immutable log

#### Layer 3: AI Verification Engine
- **Python-based** microservice
- Sub-modules: Document Classifier → OCR Engine → Forgery Analyzer → Metadata Consistency Engine → Risk Intelligence Layer
- Outputs a weighted risk score (0–100)

#### Layer 4: Blockchain Escrow Layer
- **Ethereum/Polygon** smart contracts
- Escrow State Controller manages fund locking and release
- Milestone Verification Adapter interfaces with hospital confirmation
- Smart Contract Interface for donation transactions

#### Layer 5: Audit & Compliance Layer
- Append-only encrypted event storage
- Minimum 5-year retention policy enforced at system level
- Financial logs are never deleted

### 3.3 Campaign Orchestration Core (Internal Flow)

```
API Entry Port
      ↓
RBAC Authorization Layer
      ↓
Document Processing Pipeline
  ├── Document Classifier
  ├── OCR Engine
  ├── Forgery Analyzer
  └── Metadata Consistency Engine
      ↓
Risk Intelligence Layer
  ├── AI Probability Model
  ├── Weighted Risk Aggregator
  └── Threshold Decision Gate (Score ≥ 70 → Escalate / Score < 70 → Approve)
      ↓
Governance & Escalation (if risk ≥ 70)
  ├── Admin Escalation Handler
  └── Manual Override Logic
      ↓
Escrow Control Layer
  ├── Smart Contract Interface
  ├── Escrow State Controller
  └── Milestone Verification Adapter
      ↓
Audit & Compliance Layer
  ├── Immutable Event Logger
  └── Retention Policy Enforcer (5 Years)
```

---

## 4. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Frontend | React.js | Modular UI components, easy REST API integration |
| Backend | Node.js + Express | Lightweight async handling for verification and blockchain monitoring |
| AI Verification | Python | Rich OCR/ML ecosystem; supports rapid experimentation |
| Blockchain | Ethereum / Polygon | Smart contract support; Polygon evaluated for lower gas fees |
| Database | MongoDB | Flexible schema suits evolving document metadata structures |
| Task Management | Trello (Kanban) | Visual sprint tracking; maps to UML modules |
| Diagrams | PlantUML / Graphviz | Programmatic, version-controlled UML generation |

---

## 5. Functional Requirements

### FR-1: Campaign Creation
- Patients can register, login, and create fundraising campaigns.
- Required fields: personal details, target amount, treatment description.
- Campaign cannot be published until document verification is complete.

### FR-2: Document Upload & Verification
The system shall verify the following document types:
- Government-issued ID (Aadhaar / Passport)
- Medical diagnosis reports
- Hospital admission letters
- Treatment cost estimates and bills

Verification pipeline:
1. OCR extraction of text fields
2. Metadata consistency validation
3. AI forgery probability estimation
4. Weighted risk score computation

### FR-3: Fraud Risk Score Generation
- Each campaign receives a risk score from 0 (low risk) to 100 (high risk).
- Formula:

```
RiskScore = w1(Tampering) + w2(AIProbability) + w3(MetadataMismatch)
```

- Risk categories:
  - **Low (0–40):** Campaign auto-approved for publication
  - **Medium (41–69):** Flagged with advisory note visible to donors
  - **High (≥ 70):** Escalated to Admin for manual review

### FR-4: Donation & Escrow Fund Locking
- Donors view risk scores before donating.
- Donation is initiated via Web3 wallet.
- Funds are locked in a smart contract escrow immediately upon donation.
- Confirmation awaited: 85–110 seconds (blockchain network validation).

### FR-5: Hospital Milestone Confirmation & Fund Release
- Verified hospitals log in with institution-verified credentials and mapped wallet addresses.
- Hospital confirms a treatment milestone.
- Smart contract validates confirmation and releases proportional funds to the hospital's wallet.
- If milestone is not verified, funds remain locked in escrow.

### FR-6: Admin Oversight
- Admins can review campaigns escalated by the risk engine.
- Admins may approve or reject campaigns with documented justification.
- Admin decisions override AI risk scores.
- Admins can monitor audit logs.

### FR-7: Audit Log Access
- All critical events are logged immutably.
- Accessible to authorized admins and regulatory bodies.
- Logs retained for a minimum of 5 years.

---

## 6. Non-Functional Requirements

### NFR-1: Performance
| Operation | Target Latency |
|---|---|
| OCR Processing | 10–15 seconds |
| Metadata Validation | 5–8 seconds |
| AI Fraud Probability Estimation | ~5 seconds |
| Total AI Verification Pipeline | ≤ 40 seconds (timeout threshold) |
| Blockchain Donation Lock | 85–110 seconds |
| Milestone Fund Release | ~95 seconds |
| Smart Contract Deployment | ~110 seconds |

### NFR-2: Scalability
- AI verification module: ~120 campaigns/hour under current configuration
- Blockchain layer is the primary scalability bottleneck
- Layer-2 migration (Polygon) recommended for production-scale deployment

### NFR-3: Security
- Role-Based Access Control (RBAC) enforced at every API endpoint
- Hash-based document integrity validation
- Smart contract function-level permission enforcement
- Secure API token-based backend authentication
- Private wallet keys are never stored on the platform server

### NFR-4: Reliability
- Asynchronous processing with timeout thresholds (40 seconds for AI)
- Pending transaction indicators and polling for blockchain confirmations
- Smart contract logic tested before deployment to prevent unintended fund release

### NFR-5: Privacy & Compliance
- Medical documents encrypted at rest and in transit
- Access to sensitive documents is strictly role-based
- Only metadata and cryptographic hashes stored on the blockchain
- Refund and dispute policies handled off-chain through governance rules

---

## 7. User Roles & User Flows

### 7.1 User Roles

| Role | Description | Key Permissions |
|---|---|---|
| Patient | Campaign creator seeking financial assistance | Create campaign, upload documents, track fund status |
| Donor | Contributor seeking transparency before donating | View campaigns, view risk scores, donate via Web3 wallet |
| Hospital | Verified medical institution | Login with institution credentials, confirm treatment milestones |
| Admin | Platform governance authority | Review escalated campaigns, override AI decisions, monitor audit logs |

### 7.2 Patient User Flow

```
1. Register / Login
       ↓
2. Enter Personal Details
       ↓
3. Upload Medical Documents
   (Government ID + Diagnosis Report + Admission Letter + Cost Estimate)
       ↓
4. System Runs AI Verification Pipeline (~28 seconds avg)
       ↓
5a. Risk Score < 70 → Campaign Auto-Approved → Published
       ↓
5b. Risk Score ≥ 70 → Escalated to Admin Review
         ↓
      Admin Approves → Campaign Published
      Admin Rejects → Campaign Rejected
       ↓
6. Immutable Audit Log Entry Generated
       ↓
7. Patient monitors campaign and donation status
```

### 7.3 Donor User Flow

```
1. Browse Published Campaigns
       ↓
2. View Campaign Details + Risk Score Badge
       ↓
3. Decide to Donate
       ↓
4. Connect Web3 Wallet (MetaMask)
       ↓
5. Initiate Donation Transaction
       ↓
6. Smart Contract Lock Invoked
       ↓
7. Await Blockchain Confirmation (85–110 seconds)
       ↓
8. Funds Locked in Escrow ✓  |  Transaction Failed (retry)
       ↓
9. Donation logged to Audit Log
```

### 7.4 Hospital User Flow

```
1. Login with Institution-Verified Credentials + Wallet Address
       ↓
2. Validate Hospital License (system-verified)
       ↓
3. View Campaigns associated with this hospital
       ↓
4. Select Treatment Milestone to Confirm
       ↓
5. Submit Milestone Confirmation
       ↓
6. Milestone Verified?
   YES → Smart Contract Release Triggered
           → Funds Released to Hospital Wallet
   NO  → Await Correct Verification
       ↓
7. Audit Log Entry Appended
       ↓
8. 5-Year Retention Policy Applied
```

### 7.5 Admin User Flow

```
1. Login with Admin Credentials
       ↓
2. View Dashboard (escalated campaigns, audit logs)
       ↓
3. Review Escalated Campaign (Risk Score ≥ 70)
   → View AI risk breakdown
   → Inspect uploaded documents
       ↓
4. Decision:
   APPROVE → Campaign Published
   REJECT  → Campaign Rejected (with documented reason)
       ↓
5. Override logged to Audit System
       ↓
6. Monitor ongoing donations, milestones, and fund releases
```

---

## 8. Fraud Detection & Document Verification

### 8.1 Verification Pipeline

The AI Verification Engine processes uploaded documents through a three-stage pipeline:

**Stage 1 — Optical Character Recognition (OCR)**
- Extracts text from uploaded documents
- Performance: 10–15 seconds
- Higher resolution documents produce more accurate outputs (see performance data)

**Stage 2 — Metadata Consistency Validation**
- Validates patient identity consistency across all uploaded documents
- Cross-checks hospital registry details
- Timeline validation (admission date vs. diagnosis date, etc.)
- Performance: 5–8 seconds

**Stage 3 — AI Fraud Probability Estimation**
- GAN and diffusion artifact detection for image-based forgery
- Language model probability analysis for textual reports
- Copy-paste, blur, and compression artifact detection
- Cryptographic hash verification for document integrity
- Performance: ~5 seconds

### 8.2 Risk Score Formula

```
RiskScore = w1 × TamperingScore + w2 × AIProbability + w3 × MetadataMismatchScore
```

Where:
- `w1` — weight for detected image/document tampering indicators
- `w2` — weight for AI-generated content probability
- `w3` — weight for cross-document metadata inconsistencies
- Hospital trust weighting: campaigns from verified hospitals receive a reduced base score

Score range: **0 (low risk) → 100 (high risk)**

### 8.3 Fraud Detection Criteria

#### Document Authenticity Checks
- Cryptographic hash verification
- Image tampering detection (copy-paste, blur, compression artifacts)
- Metadata consistency checks (creation dates, device fingerprints)

#### AI-Generated Content Detection
- GAN and diffusion model artifact detection
- Language model probability analysis for textual medical reports

#### Cross-Document Consistency
- Patient identity matches across all submitted documents
- Hospital registration number verified against registry
- Timeline consistency (diagnosis → admission → cost estimate sequence)

#### Hospital Trust Weighting
- Documents from registered and verified hospitals reduce the overall campaign risk score
- Unverified hospital references increase risk weighting

### 8.4 Performance Comparison (v1.0 vs v2.0)

| Metric | Version 1.0 | Version 2.0 |
|---|---|---|
| False Positive Rate | 12% | 6% |
| False Negative Rate | 9% | 5% |
| Risk Score Variance | High | Stable |

**Improvements achieved in v2.0 by:**
- Rebalancing metadata mismatch weight
- Introducing threshold-based manual override at score = 70
- Incorporating cross-document consistency validation

### 8.5 OCR Processing Time vs Document Resolution

| Document Resolution | Avg Processing Time |
|---|---|
| Low (300 dpi) | 35.2 seconds |
| Medium (600 dpi) | 27.8 seconds |
| High (900 dpi) | 24.3 seconds |

Higher resolution reduces parsing overhead but slightly increases network latency due to larger file sizes.

---

## 9. Blockchain Escrow & Smart Contracts

### 9.1 Overview

All donations are locked in Ethereum/Polygon smart contracts and are only released upon verified hospital milestone confirmation. This ensures that donated funds cannot be misused by campaign creators.

### 9.2 Smart Contract Lifecycle

```
[Donor Donates via Web3 Wallet]
          ↓
[Smart Contract Invoked — lockFunds()]
          ↓
[Funds Locked in Escrow State: LOCKED]
          ↓
[Hospital Confirms Milestone — confirmMilestone()]
          ↓
[Smart Contract Validates → releaseFunds()]
          ↓
[Funds Transferred to Hospital Wallet]
          ↓
[Transaction Hash Logged to Audit System]
```

### 9.3 Blockchain Operation Latency

| Operation | Avg Confirmation Time |
|---|---|
| Smart Contract Deployment | 110 seconds |
| Donation Locking | 85 seconds |
| Milestone Fund Release | 95 seconds |

### 9.4 Escrow State Machine

| State | Description |
|---|---|
| `INITIALIZED` | Smart contract deployed for campaign |
| `LOCKED` | Donation received and funds locked |
| `MILESTONE_PENDING` | Awaiting hospital milestone confirmation |
| `RELEASED` | Funds transferred to hospital wallet |
| `FAILED` | Transaction failed; funds returned |

### 9.5 Security Properties

- Funds are never accessible to the patient or platform outside of the smart contract logic
- Private wallet keys are never stored on the platform server (decentralized custody)
- Smart contract function-level permission enforcement prevents unauthorized calls
- Contract versioning required due to blockchain immutability — once deployed, logic cannot change

### 9.6 Scalability Consideration

Blockchain transactions are the **primary scalability bottleneck**. Migration to Layer-2 networks (Polygon) is recommended for production-scale deployment to reduce gas fees and confirmation times.

---

## 10. Audit Logging & Retention Policy

### 10.1 Events Logged

Every critical system action generates an immutable audit log entry:

| Event Type | Description |
|---|---|
| Document Upload | Patient uploads a medical document |
| AI Verification Output | Risk score computation completed |
| Risk Score Generation | Final risk score assigned to campaign |
| Campaign Approved/Rejected | Admin or auto-approval decision |
| Donation | Donor initiates and completes a donation |
| Fund Lock | Smart contract escrow activated |
| Hospital Confirmation | Milestone confirmed by verified hospital |
| Fund Release | Escrow releases funds to hospital wallet |
| Admin Override | Admin overrides AI decision |

### 10.2 Retention Policy

- **Minimum retention:** 5 years
- **Storage:** Append-only encrypted storage
- **Financial logs:** Never deleted, ever
- **Access:** Role-based (Admin, Regulatory Bodies)
- **Blockchain layer:** Only hashes and metadata are stored on-chain for privacy

### 10.3 Audit Log Schema

```
AuditLog {
  id          : string (PK)
  userId      : string
  action      : string
  entityType  : string
  entityId    : string
  timestamp   : DateTime
}
```

---

## 11. Data Model (Entity Relationship)

### 11.1 Core Entities

#### Users
```
users {
  id             : string (PK)
  email          : string (unique)
  passwordHash   : string
  role           : string  [Patient | Donor | Hospital | Admin]
  createdAt      : timestamp
}
```

#### Patients (extends Users)
```
patients {
  fullName       : string
  governmentId   : string
  userId         : string (FK → users)
}
```

#### Donors (extends Users)
```
donors {
  walletAddress  : string
  userId         : string (FK → users)
}
```

#### Hospitals (extends Users)
```
hospitals {
  userId               : string (PK, FK → users)
  hospitalName         : string
  registrationNumber   : string
  verified             : boolean
  walletAddress        : string
}
```

#### Campaigns (central aggregation entity)
```
campaigns {
  id               : string (PK)
  title            : string
  description      : string
  targetAmount     : number
  collectedAmount  : number
  riskScore        : number
  status           : string
  createdAt        : timestamp
  patientId        : string (FK → patients)
}
```

#### Documents
```
documents {
  id                : string (PK)
  documentType      : string  [ID | Diagnosis | Admission | CostEstimate]
  fileHash          : string
  aiProbability     : number
  authenticityScore : number
  uploadedAt        : timestamp
  campaignId        : string (FK → campaigns)
}
```

#### Risk Assessments
```
risk_assessments {
  id                     : string (PK)
  tamperingScore         : number
  aiGeneratedScore       : number
  metadataMismatchScore  : number
  finalRiskScore         : number
  campaignId             : string (FK → campaigns)
}
```

#### Smart Contracts
```
smart_contracts {
  id               : string (PK)
  campaignId       : string (FK → campaigns)
  contractAddress  : string
  totalFunds       : number
  releasedFunds    : number
}
```

#### Donations
```
donations {
  id                : string (PK)
  campaignId        : string (FK → campaigns)
  amount            : number
  transactionHash   : string
  donatedAt         : timestamp
  donorId           : string (FK → donors)
}
```

#### Milestones
```
milestones {
  id                    : string (PK)
  campaignId            : string (FK → campaigns)
  hospitalId            : string (FK → hospitals)
  milestoneType         : string
  confirmed             : boolean
  confirmedAt           : timestamp
}
```

#### Audit Logs
```
audit_logs {
  id          : string (PK)
  userId      : string
  action      : string
  entityType  : string
  entityId    : string
  timestamp   : timestamp
}
```

### 11.2 Entity Relationships

```
users ─────┬──── patients ──── campaigns ──── documents
           ├──── donors ───── donations          └── risk_assessments
           └──── hospitals ── milestones
                                  │
                              campaigns ──── smart_contracts
                                  │
                              audit_logs
```

Campaigns are the **central aggregation entity** that connects users, documents, risk assessments, donations, smart contracts, milestones, and audit logs.

---

## 12. UML Diagrams Explained

### 12.1 Use Case Diagram

Identifies four primary actors and their system interactions:

| Actor | Use Cases |
|---|---|
| Patient | Register/Login, Enter Personal Details, Upload Medical Documents, Create Fundraising Campaign |
| Donor | View Campaigns, View Risk Score, Donate Funds |
| Hospital | Login as Verified Hospital, Confirm Treatment Milestone |
| Admin | Review Campaigns, Override AI Decisions, Monitor Audit Logs |

Key design constraint: Sensitive operations like fund release are restricted to authorized actors only (RBAC-enforced).

### 12.2 Class Diagram

Models the static structure with these primary entities:
- `User` (base class) → specialized by `Patient`, `Donor`, `Hospital`, `Admin`
- `Campaign` — central business entity
- `Document` — stores document metadata and fraud indicators
- `RiskAssessment` — captures scoring breakdown
- `SmartContract` — represents blockchain escrow state
- `AuditLog` — immutable event record

### 12.3 Component Diagram

Shows the decomposition into major architectural modules:
- **Frontend Layer:** Web UI
- **Backend Services:** Campaign Service, Auth Service
- **AI Verification Engine:** AI Content Detector, Forgery Detection Module, OCR Module
- **Blockchain Layer:** Wallet Interface, Smart Contract
- **Audit Logger:** Separate, isolated append-only service

### 12.4 Composite Structure Diagram

Zooms into the internal orchestration of the Campaign Processing Core, showing:
- `Risk Scoring Engine` → `Campaign Controller` → `Document Manager`
- Connected to `Verification Engine` sub-components: `Forgery Analyzer`, `OCR Processor`, `AI Probability Analyzer`

### 12.5 Activity Diagram (Two Diagrams)

**Campaign Verification & Risk Evaluation Flow:**

```
Patient Login → Enter Details → Create Campaign → Upload Documents
→ Classify Document Type → OCR Processing (10–15s)
→ Metadata Consistency Check (5–8s) → AI Forgery Analysis (~5s)
→ Compute Risk Score (0–100)
→ Risk Score < 70? YES → Publish | NO → Admin Review → Approve/Reject
→ Generate Audit Log Entry
```

**Donation, Escrow & Milestone Release Flow:**

```
Donor Views Campaign → View Risk Badge → Initiate Donation via Web3 Wallet
→ Invoke Smart Contract Lock → Await Blockchain Confirmation (85–110s)
→ Transaction Confirmed? YES → Funds Locked | FAIL → Failed
→ Hospital Authenticated Login → Validate Hospital License
→ Confirm Treatment Milestone → Milestone Verified?
YES → Trigger Smart Contract Release → Release Funds to Hospital Wallet
NO → Await Correct Verification
→ Append Audit Log → Apply 5-Year Retention Policy
```

### 12.6 Sequence Diagram

Time-ordered interactions between: `Patient → Frontend → Backend → RiskEngine → SmartContract → Audit`

Key sequences:
1. `Patient` submits campaign → `Backend` calls `analyzeDocuments()` → `RiskEngine` returns `riskScore=62` → `Backend` calls `logVerification()`
2. `Donor` donates → `Backend` calls `initiateTransaction()` → `SmartContract` calls `lockFunds()` + `txHash` → `logDonation()`
3. `Hospital` confirms → `Backend` calls `confirmMilestone()` → `SmartContract` calls `releaseFunds()` + `confirmation` → `logRelease()`

### 12.7 Timing Diagram

Depicts explicit latency across three stages:

| Stage | Sub-operation | Duration |
|---|---|---|
| AI Verification | OCR Processing | 10–15 sec |
| AI Verification | Metadata Validation | 5–8 sec |
| AI Verification | AI Fraud Probability | ~5 sec |
| Donation Escrow | Smart Contract Deployment | ~110 sec |
| Donation Escrow | Donation Lock Pending | 85–110 sec |
| Milestone Release | Release Funds | ~95 sec |

### 12.8 Deployment Diagram

Maps software components to physical infrastructure:

```
User Device [Browser]
       ↓
Backend Server [API]
       ├── AI Server [AIEngine]
       ├── Blockchain Network [SmartContract]
       └── AuditLogger [Audit logs retained 5+ years]
```

---

## 13. Sprint Planning & Development Strategy

### 13.1 Methodology

**Agile-Inspired Incremental Development** was selected over Waterfall or Spiral models because:
- AI fraud detection parameters required continuous experimental refinement
- Blockchain latency observations necessitated iterative modeling
- Independent testability of verification engine, escrow layer, and audit module benefited from modular sprint delivery

### 13.2 Sprint Roadmap

#### Sprint 1 — Core Platform Foundation
- User authentication and role definition (Patient, Donor, Hospital, Admin)
- Campaign entity modeling and database schema design
- REST API scaffolding

#### Sprint 2 — AI Verification Engine
- OCR integration and document parsing
- Metadata consistency validation
- Risk score computation model (weighted formula implementation)
- Document type classifier

#### Sprint 3 — Blockchain Escrow Layer
- Smart contract development and Ethereum testnet deployment
- Donation locking mechanism
- Transaction monitoring and status polling service
- Web3 wallet integration

#### Sprint 4 — Hospital Milestone Module
- Verified hospital login (institution credentials + wallet address mapping)
- Milestone confirmation interface
- Conditional escrow release function triggered by hospital confirmation

#### Sprint 5 — Performance, Testing & Audit Optimization
- Audit log retention policy implementation
- Latency modeling and timing diagram creation
- UI response feedback for pending blockchain transactions
- Security, performance, and integration testing

### 13.3 Task Management

Tool: **Trello (Kanban)**

Columns: `Backlog → In Progress → Review → Completed`

Each Trello card mapped directly to a UML module, ensuring traceability from task to design artifact.

### 13.4 ESSENCE Alpha Card Progression

| Alpha | From | To |
|---|---|---|
| Stakeholders | Recognized | Involved |
| Requirements | Conceived | Coherent |
| Software System | Architecture Selected | Usable Prototype |

---

## 14. Experimental Results & Evaluation

### 14.1 Evaluation Metrics

Four primary metrics were defined before experimentation:

1. **Verification Latency** — Average time for OCR + metadata + fraud probability pipeline
2. **Fraud Detection Accuracy** — False positive and false negative rates across simulated datasets
3. **Blockchain Confirmation Time** — Latency for deployment, donation locking, and milestone release
4. **Throughput** — Number of campaigns processed per hour by the AI module

### 14.2 Test Setup

- 20 simulated medical campaign datasets
- Documents included: identity documents, admission letters, cost estimates
- Blockchain tests conducted on **Ethereum testnet**

### 14.3 AI Verification Results

| Document Resolution | Avg Processing Time |
|---|---|
| Low (300 dpi) | 35.2 seconds |
| Medium (600 dpi) | 27.8 seconds |
| High (900 dpi) | 24.3 seconds |

**Insight:** Higher resolution reduces parsing error but increases file size and network latency marginally.

### 14.4 Fraud Detection Accuracy

| Metric | Version 1.0 | Version 2.0 |
|---|---|---|
| False Positive Rate | 12% | **6%** |
| False Negative Rate | 9% | **5%** |
| Risk Score Variance | High | **Stable** |

### 14.5 Blockchain Latency

| Operation | Avg Confirmation Time |
|---|---|
| Smart Contract Deployment | 110 seconds |
| Donation Locking | 85 seconds |
| Milestone Fund Release | 95 seconds |

**UI mitigation:** Pending transaction indicators and polling were added to reduce user uncertainty during blockchain confirmation windows.

### 14.6 Theoretical vs Practical Discrepancies

| Assumption | Expected | Observed | Correction |
|---|---|---|---|
| AI verification time | 15 seconds | 28 seconds | Timeout increased to 40s; async notifications added |
| Primary overhead sources | OCR only | OCR + file hashing + cross-document checks + score normalization | Pipeline refactored for async stages |

### 14.7 Negative Findings & Trade-offs

| Trade-off | Implication |
|---|---|
| Higher fraud detection sensitivity | More false positives (genuine patients flagged) |
| Faster blockchain confirmation | Reduced security assurance (fewer validations) |
| Stricter document size limits | Faster processing but less format flexibility |

These trade-offs require **balancing security with usability** — the core design tension in the system.

### 14.8 System Throughput

- AI verification module: **~120 campaigns per hour** under current configuration
- Blockchain transactions remain the bottleneck for end-to-end throughput

---

## 15. Security & Governance

### 15.1 Access Control

- **Role-Based Access Control (RBAC)** enforced at every API endpoint
- Hospital milestone confirmation restricted to hospital-role accounts with verified wallet addresses
- Admin override actions logged with audit trail

### 15.2 Document Security

- Hash-based document integrity validation prevents post-upload tampering
- Medical documents encrypted at rest and in transit
- Only cryptographic hashes (not raw documents) are stored on the blockchain

### 15.3 Blockchain Security

- Private wallet keys never stored on the platform server (decentralized custody)
- Smart contract function-level permission enforcement
- Contract versioning enforced due to blockchain immutability

### 15.4 API Security

- Secure API token-based backend authentication (JWT)
- RBAC middleware on all sensitive endpoints

### 15.5 Risk & Threat Analysis

| Threat | Description | Mitigation |
|---|---|---|
| Adversarial Document Forgery | High-quality forged documents may bypass OCR | Anomaly-based consistency checks + admin escalation |
| Smart Contract Vulnerabilities | Bugs in escrow logic could allow unauthorized fund release | Thorough contract auditing before deployment |
| Hospital Identity Spoofing | Malicious entities impersonating verified hospitals | Multi-factor hospital verification |
| Oracle Dependency Risk | External data sources may introduce trust issues | Fallback manual escalation mechanisms |

---

## 16. System Limitations & Ethical Considerations

### 16.1 Technical Limitations

- **OCR accuracy dependency** — Low-quality scanned documents may not be reliably processed
- **Blockchain gas fee volatility** — Unpredictable operational costs for deployment on Ethereum mainnet
- **Hospital documentation variability** — Different hospitals use different formats, creating preprocessing inconsistencies
- **Regulatory compliance** — Real-world deployment would require compliance with healthcare data protection laws (e.g., DPDP Act in India, HIPAA internationally)

### 16.2 AI Decision Limitations

- AI verification is **probabilistic, not deterministic** — absolute accuracy is not achievable
- False positives may harm genuine patients with poor-quality documents
- False negatives may allow sophisticated forgeries to pass
- AI scores are **decision-support inputs, not final verdicts**

### 16.3 Human Oversight

- Campaigns with high risk scores (≥ 70) are always escalated to Admin review
- Admins may override AI decisions with documented justification
- Hospitals provide independent milestone confirmation as a second layer of governance

### 16.4 Privacy & Ethics

- Medical documents are sensitive personal health data — encrypted at all stages
- Only metadata and cryptographic hashes stored on-chain (privacy-preserving)
- Blockchain immutability means transactions cannot be reversed — smart contract logic is tested rigorously before deployment
- Refund and dispute resolution policies handled off-chain through governance rules

---

## 17. Design Evolution: SRS v1.0 → v2.0

| Aspect | Version 1.0 | Version 2.0 |
|---|---|---|
| Document Upload | Generic file upload | Defined categories: ID, Diagnosis, Admission Letter, Cost Estimate |
| Fraud Assessment | None | Risk scoring formula (0–100 scale) |
| Fund Transfer | Manual | Blockchain smart contract escrow |
| Performance Modeling | None | Timing diagram with explicit latency values |
| Audit Logging | Basic | 5-year structured append-only retention |
| UML Coverage | Basic Use Case | Full suite: Use Case, Class, Component, Composite, Activity, Sequence, Timing, Deployment |
| Fraud Detection | No metrics | FP rate 6%, FN rate 5% (v2.0 measured) |
| Stakeholder Analysis | Informal | Formal ESSENCE Kernel Stakeholders Alpha assessment |

**Summary:** Version 2.0 reflects a shift from **conceptual modeling** to **implementation-oriented system specification**, driven by experimental feedback and faculty review.

---

## 18. ESSENCE Kernel Stakeholder Analysis

### 18.1 Identified Stakeholders

| Stakeholder | Role in System |
|---|---|
| Patients (Campaign Creators) | Primary users; seeking financial assistance |
| Donors | Contributors; requiring trust and transparency |
| Hospitals and Medical Institutions | Verified entities; confirming treatment milestones |
| Platform Administrators | Governance oversight; reviewing escalated campaigns |
| Development Team (DCF–Alpha–01) | System builders and technical decision-makers |
| Regulatory and Compliance Authorities | Indirect stakeholders; concerned with legal compliance |

### 18.2 Alpha State Progression

| Alpha State | Status | Evidence |
|---|---|---|
| Recognized | ✅ Achieved | All stakeholder groups formally identified in SRS and UML |
| Represented | ✅ Achieved | Alpha Team authorized for technical decisions; hospital/donor concerns reflected in workflows |
| Involved | ✅ Achieved | Hospitals actively confirm milestones; admins respond to fraud alerts |
| In Agreement | ✅ Achieved | Consensus on core objectives: transparency, fraud reduction, secure fund handling |
| Satisfied for Deployment | ✅ Achieved | All functional and non-functional requirements documented; security and audit workflows defined |
| Satisfied in Use | 🔄 Pending | Awaiting real-world deployment feedback |

---

## 19. Requirements Traceability Matrix

| Requirement ID | Description | UML Mapping | Module | Version |
|---|---|---|---|---|
| FR-1 | Campaign Creation | Use Case Diagram | Campaign Service | V1 → V2 |
| FR-2 | Document Verification | Class Diagram | AI Verification Engine | V2 |
| FR-3 | Fraud Risk Score | Component Diagram | Risk Intelligence Layer | V2 |
| FR-4 | Escrow Fund Locking | Sequence Diagram | Smart Contract Layer | V1 → V2 |
| FR-5 | Milestone-Based Fund Release | Activity Diagram | Hospital Verification Module | V2 |
| NFR-1 | Performance Constraints | Timing Diagram | Latency Monitoring Module | V2 |

---

## 20. Future Enhancements

| Enhancement | Description |
|---|---|
| Zero-Knowledge Proofs | Privacy-preserving verification — prove authenticity without revealing document contents |
| Layer-2 Blockchain Migration | Polygon or Optimism for lower gas fees and faster confirmation times |
| Deep Learning Forgery Detection | CNN/transformer-based models for more sophisticated forgery detection beyond OCR heuristics |
| Federated Hospital Verification | Decentralized hospital credentialing network to reduce oracle dependency |
| Multi-language OCR | Support for non-English medical documents (Hindi, regional languages for India deployment) |
| Mobile Application | Native iOS/Android app for patients and donors |
| Regulatory API Integration | Direct integration with healthcare regulatory APIs for automated hospital verification |

---

## 21. Team Contributions

### Dungar Soni — B23CS1105 (Architecture & Blockchain Lead)
- Led overall system architecture and design decisions
- Designed and refined UML diagrams: Class, Component, Deployment, Composite Structure
- Defined blockchain escrow logic and milestone-based fund release mechanism
- Integrated audit logging, retention policies, and ethical considerations into the SRS
- Consolidated SRS Version 2.0 document with IEEE SRS template compliance

### Prakhar Goyal — B23CS1106 (AI Verification & Backend Lead)
- Designed AI-based fraud detection and document verification workflow
- Defined document types, fraud detection criteria, and risk scoring methodology
- Contributed to Activity, Sequence, and Timing UML diagrams with realistic execution flows
- Assisted in refining NFRs related to performance and security

### Raditya Saraf — B23CS1107 (Frontend & UX Lead)
- Designed user interaction flows and frontend-related system requirements
- Contributed to Use Case Diagram and user role definitions
- Led stakeholder analysis using the ESSENCE Kernel framework
- Supported documentation consistency and diagram-to-requirement alignment

### Team Collaboration
All members participated in requirement discussions, review meetings, and iterative SRS refinement based on faculty feedback. Trello was used for sprint tracking with incremental delivery across 5 sprints.

---

## 22. References

1. S. Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System," 2008.
2. Ethereum Foundation, "Ethereum Whitepaper and Documentation." https://ethereum.org
3. I. Jacobson, P.-W. Ng, P. McMahon, I. Spence, S. Lidman, *The Essence of Software Engineering: Applying the SEMAT Kernel*, Addison-Wesley, 2013.
4. IEEE Computer Society, "IEEE Recommended Practice for Software Requirements Specifications," IEEE Std 830-1998.
5. M. A. Nielsen, *Neural Networks and Deep Learning*, Determination Press, 2015.
6. K. Schwaber and J. Sutherland, "The Scrum Guide," Scrum.org, 2020.
7. G. Wood, "Ethereum: A Secure Decentralised Generalised Transaction Ledger," Ethereum Yellow Paper, 2014.
8. K. E. Wiegers, "Software Requirements Specification Template," IEEE, 1999.
9. PlantUML Documentation — https://plantuml.com/
10. Graphviz Documentation — https://graphviz.org/
11. MetaMask Documentation — https://docs.metamask.io/

---

*Document generated from SRS Version 2.0 — MedTrustFund, IIT Jodhpur, February 2026*
