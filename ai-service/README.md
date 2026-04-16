# MedTrustFund AI Verification Service (v2.0)

> **The intelligent fraud-prevention backbone of the MedTrustFund decentralized crowdfunding platform.**

The MedTrustFund AI Verification Service is a production-grade, asynchronous Python microservice built with **FastAPI**. It serves as the primary automated defense layer against medical crowdfunding fraud by dynamically evaluating uploaded campaign documents — including hospital bills, identity cards, and medical diagnosis reports — **before** any campaign is published to the blockchain.

By combining OCR-based text extraction, AI-pattern detection, image tampering analysis, and cross-document consistency validation, the service produces a single, actionable **Risk Score** for every campaign submission, automating the majority of the moderation workload.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Features](#core-features)
3. [How the AI Verification Pipeline Works](#how-the-ai-verification-pipeline-works)
   - [Stage 1: Data Extraction & Categorization](#stage-1-data-extraction--categorization)
   - [Stage 2: Independent Analysis Modules](#stage-2-independent-analysis-modules)
   - [Stage 3: Cross-Validation Analysis](#stage-3-cross-validation-analysis)
4. [The SRS v2.0 Risk Score Formula](#the-srs-v20-risk-score-formula)
5. [Service Endpoints](#service-endpoints)
6. [Prerequisites & Setup](#prerequisites--setup)
7. [Running Locally](#running-locally)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Environment Variables](#environment-variables)
11. [Project Structure](#project-structure)
12. [Error Handling & Logging](#error-handling--logging)
13. [Security Considerations](#security-considerations)
14. [Known Limitations & Future Roadmap](#known-limitations--future-roadmap)
15. [Contributing](#contributing)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│                  Campaign Creation Form                      │
└───────────────────────────┬─────────────────────────────────┘
                            │  Multipart Document Upload
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Backend (Node.js / Express)                    │
│         Campaign Controller → AI_SERVICE_URL proxy           │
└───────────────────────────┬─────────────────────────────────┘
                            │  POST /verify
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          MedTrustFund AI Verification Service (v2.0)         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Stage 1:    │  │  Stage 2:    │  │  Stage 3:          │ │
│  │  Extraction  │→ │  Analysis    │→ │  Cross-Validation  │ │
│  │  & Classify  │  │  Modules     │  │  & Risk Scoring    │ │
│  └──────────────┘  └──────────────┘  └────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │  JSON Risk Report
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Campaign Status Decision Engine                  │
│     Auto-Approve  │  Warn Donors  │  Pending Admin Review   │
└─────────────────────────────────────────────────────────────┘
```

The AI service is entirely **stateless** — it receives documents, runs analysis, and returns a JSON verdict. It does not store any user data. All persistent state is managed by the main backend.

---

## Core Features

| Feature | Description |
|---|---|
| **FastAPI Framework** | High-performance async REST API with auto-generated Swagger docs |
| **Tesseract OCR** | Extracts text from image-based documents (`.jpg`, `.png`) |
| **PyMuPDF (fitz)** | Direct text extraction from `.pdf` files without rasterization |
| **Image Tampering Detection** | Identifies stripped EXIF data, irregular compression artifacts, and photoshopped content |
| **AI-Generated Text Detection** | Evaluates text for chatbot patterns, generic phrasing, and structural repetition |
| **Medical Vocabulary Validation** | Cross-references extracted text against a curated medical terminology dictionary |
| **Cross-Document Consistency** | Compares names, dates, and metadata across all uploaded files for discrepancies |
| **SRS v2.0 Risk Scoring** | Weighted composite score algorithm with optional hospital-verification deduction |
| **Built-in Rate Limiting** | Per-IP throttling via `slowapi` to prevent API abuse and DDoS attacks |
| **Structured JSON Responses** | Detailed breakdown of every sub-score for frontend rendering and admin audit trails |

---

## How the AI Verification Pipeline Works

When a campaign submission is received at the `/verify` endpoint, the documents are processed through a deterministic three-stage pipeline. Each stage feeds into the next, with all findings aggregated into the final SRS v2.0 Risk Score.

### Stage 1: Data Extraction & Categorization

This stage transforms raw binary file uploads into structured, analyzable data.

**OCR & PDF Parsing:**
- Image files (`.jpg`, `.png`) are passed through the **Tesseract OCR engine** to produce raw text output.
- PDF files are processed with **PyMuPDF (fitz)**, which reads the embedded text layer directly — significantly faster and more accurate than rasterization-based approaches for digital PDFs.
- The raw text output from both methods is normalized (lowercased, stripped of excessive whitespace) before further processing.

**Document Classification:**
The service attempts to classify each uploaded document into one of three categories based on contextual keyword matching:
- `identity` — National ID cards, Aadhar cards, passports
- `cost_estimate` — Hospital bills, invoices, financial summaries
- `diagnosis` — Medical reports, doctor's notes, lab results

Document type is used downstream in **Stage 2** to apply the correct validation rules (e.g., a `cost_estimate` document is not expected to contain patient diagnosis terminology).

---

### Stage 2: Independent Analysis Modules

Three independent analysis modules run in parallel, each producing a raw sub-score between 0 and 100.

#### Module 1 — Tampering Check (`TamperingScore`)

Inspects the binary structure and metadata of every uploaded file for signs of manipulation:

| Signal | Description | Score Impact |
|---|---|---|
| **Missing/Stripped EXIF** | Legitimate scanned documents from hospitals retain EXIF metadata. A 0 KB EXIF block is a strong manipulation signal. | High |
| **Extreme Resolution** | Resolutions like `6000x8000px` on a standard document scan are anomalous and suggest image stitching or replacement. | Medium-High |
| **Compression Anomalies** | Irregular JPEG compression ratios that deviate from scanner norms may indicate re-compression after editing. | Medium |
| **Metadata Timestamp Mismatch** | File creation timestamps embedded in metadata that post-date the campaign creation event. | High |

#### Module 2 — AI Probability Check (`AIProbabilityScore`)

Reads the extracted text and evaluates it for patterns characteristic of AI-generated content:

| Signal | Description | Score Impact |
|---|---|---|
| **Generic Phrasing** | Phrases like "To Whom It May Concern," "I hope this letter finds you well," or "Please find enclosed" are uncommon in genuine medical records. | Medium |
| **High Sentence Repetition** | Calculated using a rolling similarity window. AI models often repeat sentence structures. | High |
| **Suspicious Document Length** | Documents that are either unusually short (< 50 words) or padded to an unnatural length. | Low-Medium |
| **Lack of Specificity** | Absence of specific dates, monetary amounts, procedure codes, or ward/room numbers in records that would normally contain them. | Medium |

#### Module 3 — Medical Vocabulary Check

The extracted text from documents classified as `diagnosis` or `cost_estimate` is cross-referenced against an internal curated dictionary of medical terminology. This dictionary includes ICD-10 codes, pharmacological terms, procedure names, and anatomy references.

**Threshold Rule:** If fewer than **3 standard medical terms** are found in a document that has been classified as a hospital record or diagnosis report, the document is flagged with a penalty added to the `AIProbabilityScore`.

This is particularly effective at catching generic placeholder documents where someone has used a text template without medical knowledge.

---

### Stage 3: Cross-Validation Analysis

After the three independent modules complete, Stage 3 performs holistic consistency checks **across all uploaded documents simultaneously**.

**Data Points Extracted Per File:**
- `Patient Name` — Full name as it appears in the document
- `File Creator` — Metadata field from PDFs indicating the generating software or author
- `Timestamps` — Creation dates embedded in file metadata and/or document text

**Consistency Checks Performed:**

1. **Name Consistency:** All documents in a single submission must reference the same patient. If the ID card reads "John Doe" but the hospital bill is addressed to "Jane Smith," a maximum penalty is applied to the `MetadataMismatchScore`. Fuzzy string matching is applied to account for minor spelling variations (e.g., "Mohammad" vs "Mohammed").

2. **Temporal Consistency:** The date of the hospital bill must logically follow the date of the diagnosis report. Inverted timelines (a bill dated before the diagnosis) are flagged.

3. **Creator Metadata Consistency:** All PDFs generated by a hospital's billing system would typically share the same PDF creator software signature. Wildly inconsistent creator signatures across documents in the same submission are flagged.

---

## The SRS v2.0 Risk Score Formula

Once all three pipeline stages complete, the final **Risk Score** is calculated by the Staged Risk Scoring (SRS v2.0) algorithm.

### Base Formula

```
RiskScore = (w1 × TamperingScore) + (w2 × AIProbabilityScore) + (w3 × MetadataMismatchScore)
```

### Weight Configuration

| Weight | Component | Value | Rationale |
|---|---|---|---|
| `w1` | TamperingScore | `0.35` | Physical document tampering is the strongest fraud indicator |
| `w2` | AIProbabilityScore | `0.35` | AI-generated text is an equally strong fraud indicator |
| `w3` | MetadataMismatchScore | `0.30` | Cross-document inconsistencies are significant but can have benign explanations |

### Hospital Verification Deduction

If the campaign is explicitly linked to a **Platform-Verified Hospital** (verified via the `/verify-hospital` endpoint), a dynamic **-20% deduction** is applied to the raw RiskScore before the final verdict is determined:

```
FinalRiskScore = RawRiskScore × 0.80  (if hospital_verified = true)
```

This incentivizes hospitals to register on the platform and rewards campaigns associated with verified institutions.

### Verdict Thresholds

| Score Range | Risk Level | Automated Action |
|---|---|---|
| **0 – 39** | 🟢 Low Risk | Campaign is **auto-approved** and goes live immediately |
| **40 – 69** | 🟡 Medium Risk | Campaign goes live, but an **advisory warning banner** is displayed to potential donors |
| **70 – 100** | 🔴 High Risk | Campaign is placed into **`pending_verification` locking mode** — no donations accepted until an Admin manually reviews and approves |

---

## Service Endpoints

### `POST /verify`

The primary verification endpoint. Accepts campaign documents for full pipeline analysis.

**Request:**

```
Content-Type: multipart/form-data
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `files` | `File[]` | ✅ Yes | Up to 10 files (`.jpg`, `.png`, `.pdf`). Max 10 MB per file, 50 MB total. |
| `hospital_verified` | `boolean` | ❌ No | If `true`, applies the -20% Hospital Verification Deduction to the final score. |

**Response (200 OK):**

```json
{
  "risk_score": 42.5,
  "verdict": "medium_risk",
  "hospital_deduction_applied": false,
  "breakdown": {
    "tampering_score": 30.0,
    "ai_probability_score": 55.0,
    "metadata_mismatch_score": 45.0
  },
  "flags": [
    "AI_PATTERN_GENERIC_PHRASING",
    "METADATA_NAME_MISMATCH"
  ],
  "documents_analyzed": 3,
  "processing_time_ms": 1243
}
```

**Rate Limit:** `10 requests / minute` per IP.

---

### `POST /verify-hospital`

Validates hospital licensing details against a simulated state medical board registry.

**Request Body (JSON):**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `license_number` | `string` | ✅ Yes | The hospital's official state board license number |
| `hospital_name` | `string` | ✅ Yes | The registered name of the hospital |

**Response (200 OK):**

```json
{
  "is_verified": true,
  "confidence_score": 0.97,
  "hospital_name_matched": "Apollo Hospitals - Jubilee Hills",
  "license_status": "active"
}
```

**Rate Limit:** `5 requests / minute` per IP.

---

### `GET /health`

Lightweight liveness check endpoint for uptime monitoring systems (e.g., Vercel, Railway, UptimeRobot).

**Response (200 OK):**

```json
{
  "status": "ok",
  "version": "2.0.0"
}
```

---

## Prerequisites & Setup

Ensure you have **Python 3.9+** and `pip` installed. The service also requires system-level packages for OCR and image processing.

### Ubuntu / Debian

```bash
sudo apt update && sudo apt upgrade -y

# Tesseract OCR engine + English language pack
sudo apt install tesseract-ocr tesseract-ocr-eng libtesseract-dev

# Poppler utilities (required by PyMuPDF for PDF rendering)
sudo apt install poppler-utils

# ImageMagick (optional, for advanced image pre-processing)
sudo apt install imagemagick
```

### macOS (using Homebrew)

```bash
brew update
brew install tesseract poppler
```

### Python Dependencies

It is strongly recommended to use a virtual environment to avoid dependency conflicts.

```bash
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt
```

**Key Python Packages (`requirements.txt`):**

```
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
pytesseract>=0.3.10
Pillow>=10.0.0
PyMuPDF>=1.23.0
slowapi>=0.1.9
python-multipart>=0.0.6
python-dotenv>=1.0.0
```

---

## Running Locally

### 1. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

See the [Environment Variables](#environment-variables) section for all available options.

### 2. Start the Development Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

The `--reload` flag enables hot-reloading on code changes (development only).

**Service URLs:**
- **API Base:** `http://localhost:8001`
- **Interactive Swagger Docs:** `http://localhost:8001/docs`
- **ReDoc Documentation:** `http://localhost:8001/redoc`

---

## Testing

The project includes a dedicated test suite using `pytest`.

```bash
# Run all tests
pytest test_main.py -v

# Run with coverage report
pytest test_main.py --cov=main --cov-report=html

# Run a specific test
pytest test_main.py::test_verify_with_valid_documents -v
```

**Test Categories:**
- `test_health_check` — Verifies the `/health` endpoint returns 200
- `test_verify_*` — End-to-end verification pipeline tests with mock documents
- `test_rate_limiting` — Validates rate limiting behavior
- `test_tampering_detection` — Unit tests for the tampering analysis module
- `test_ai_probability` — Unit tests for AI text detection logic

---

## Deployment

The AI service requires a build environment that supports both Python runtimes and system-level `apt-get` package installation. **Railway.app** is the recommended and officially supported production hosting platform.

### Railway Deployment

The configuration is fully defined by the committed `railway.toml` and `Procfile`:

**`railway.toml`:**
```toml
[build]
builder = "nixpacks"

[build.nixpacksPlan.phases.setup]
aptPkgs = ["tesseract-ocr", "poppler-utils", "tesseract-ocr-eng"]
```

**`Procfile`:**
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Post-Deployment Configuration

After the service is deployed, copy the generated Railway public URL and set it as an environment variable on the **main backend service**:

```
AI_SERVICE_URL=https://your-service-name.up.railway.app
```

The backend uses this variable to proxy document uploads to the AI service during campaign creation.

---

## Environment Variables

Create a `.env` file in the `ai-service/` root. Reference `.env.example` for a template.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `8001` | Port the service listens on |
| `RATE_LIMIT_VERIFY` | No | `10/minute` | Rate limit for `/verify` endpoint |
| `RATE_LIMIT_HOSPITAL` | No | `5/minute` | Rate limit for `/verify-hospital` |
| `MAX_FILE_SIZE_MB` | No | `10` | Maximum size of a single uploaded file |
| `MAX_TOTAL_SIZE_MB` | No | `50` | Maximum total size of all files in one request |
| `TESSERACT_CMD` | No | `tesseract` | Path to the Tesseract binary (if not in `$PATH`) |
| `LOG_LEVEL` | No | `INFO` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |

---

## Project Structure

```
ai-service/
├── main.py                  # FastAPI application, route definitions, pipeline orchestration
├── requirements.txt         # Python package dependencies
├── Procfile                 # Railway/Heroku process definition
├── railway.toml             # Railway deployment configuration (nixpacks + apt packages)
├── test_main.py             # pytest test suite
├── .env.example             # Environment variable template
├── uploads/                 # Temporary storage for uploaded files during processing
│   └── .gitkeep
└── venv/                    # Virtual environment (not committed to version control)
```

> **Note:** The `uploads/` directory is used for transient file storage during request processing only. Files are deleted after the pipeline completes. This directory should never be committed with real user data.

---

## Error Handling & Logging

All errors are returned as structured JSON with an appropriate HTTP status code.

**Example Error Response:**

```json
{
  "detail": "File size exceeds the 10MB limit. Received: 14.3MB",
  "error_code": "FILE_TOO_LARGE"
}
```

| HTTP Status | Scenario |
|---|---|
| `400 Bad Request` | Invalid file type, file too large, missing required parameters |
| `422 Unprocessable Entity` | Request body failed validation |
| `429 Too Many Requests` | Rate limit exceeded for the calling IP |
| `500 Internal Server Error` | Unexpected pipeline failure (logged server-side) |

Application logs are written to `stdout` in structured format, compatible with Railway's log aggregation. Set `LOG_LEVEL=DEBUG` for verbose pipeline output during development.

---

## Security Considerations

- **No PII Storage:** The service does not persist any uploaded documents or extracted text to disk beyond the duration of a single request.
- **File Type Validation:** All uploads are validated by magic bytes (not just file extension) before processing begins.
- **Rate Limiting:** Per-IP rate limits prevent abuse of the OCR and analysis pipeline.
- **Input Sanitization:** All text extracted via OCR is treated as untrusted input and is never executed or evaluated.
- **Dependency Pinning:** All packages in `requirements.txt` should be pinned to specific versions for reproducible builds.

---

## Known Limitations & Future Roadmap

### Current Limitations

- **Hospital Registry:** The `/verify-hospital` endpoint currently uses a **simulated** state-board lookup. Integration with a real government medical licensing API is pending.
- **Language Support:** Tesseract is currently configured for English (`tesseract-ocr-eng`) only. Documents in Hindi, Telugu, or other regional languages will have degraded OCR quality.
- **PDF Forms:** Scanned PDFs (image-based) are supported via OCR, but interactive PDF forms with embedded text fields may not extract correctly in all cases.

### Roadmap

- [ ] Integrate real hospital licensing database API
- [ ] Add multi-language OCR support (Hindi, Tamil, Telugu)
- [ ] Implement a feedback loop: allow admin verdicts to retrain the AI probability model
- [ ] Add a `/explain` endpoint that returns a human-readable explanation of each flag
- [ ] Implement asynchronous job queue (Celery + Redis) for high-concurrency scenarios
- [ ] Add support for video evidence files

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and add corresponding tests in `test_main.py`
3. Ensure all tests pass: `pytest test_main.py -v`
4. Open a Pull Request against the `main` branch with a clear description of the changes

Please follow the existing code style and keep the PR focused on a single concern.

---

*MedTrustFund AI Verification Service — Part of the `decentralizedCrowdFund` monorepo.*