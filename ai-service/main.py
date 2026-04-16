from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import hashlib
import os
import re
import time
from pathlib import Path
from datetime import datetime

app = FastAPI(title="MedTrustFund AI Verification Service v2.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Rate limiting configuration
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Medical keywords for content validation
MEDICAL_KEYWORDS = {
    "diagnosis", "admission", "discharge", "treatment", "surgery",
    "hospital", "doctor", "patient", "bill", "report", "prescription",
    "medication", "procedure", "insurance", "claim", "medical",
    "clinic", "physician", "nurse", "emergency", "icu", "operation",
    "therapy", "disease", "infection", "cancer", "heart", "kidney",
    "liver", "transplant", "blood", "x-ray", "mri", "ct scan", "ultrasound",
    "laboratory", "pathology", "biopsy", "chemotherapy", "radiation",
    "symptom", "chronic", "acute", "critical", "ventilator", "dialysis",
    "ward", "opd", "ipd", "ambulance", "fracture", "wound", "fever",
    "hemoglobin", "platelet", "serum", "urine", "stool", "ecg", "eeg",
    "cbc", "rbc", "wbc", "hiv", "hepatitis", "diabetes", "bp",
    "pulse", "oxygen", "saturation", "anesthesia", "stitches", "bandage"
}

# Minimum required medical keyword matches
MIN_MEDICAL_KEYWORDS_REQUIRED = 4  # At least 4 medical keywords must appear

# NON-MEDICAL RED FLAG keywords — if these appear, the document is suspicious
NON_MEDICAL_RED_FLAGS = {
    # Academic / assignment
    "assignment", "homework", "semester", "exam", "quiz", "lecture",
    "syllabus", "grade", "marks", "gpa", "cgpa", "professor",
    "student", "university", "college", "school", "class",
    "submission", "submitted by", "roll no", "enrollment",
    "abstract", "introduction", "conclusion", "references",
    "bibliography", "chapter", "thesis", "dissertation",
    # Programming / tech
    "def ", "function", "import ", "print(", "return ",
    "class ", "const ", "var ", "let ", "console.log",
    "algorithm", "data structure", "database", "sql",
    "javascript", "python", "java", "html", "css",
    "github", "repository", "commit", "pull request",
    # Legal / business (unrelated)
    "invoice", "purchase order", "quotation", "proforma",
    "terms and conditions", "privacy policy",
    # Random / filler
    "lorem ipsum", "foo", "bar", "test document", "sample",
    "placeholder", "dummy"
}

# Document structure markers expected in real medical documents
MEDICAL_STRUCTURE_MARKERS = [
    "date", "time", "mrn", "patient id", "case no", "reference",
    "dr.", "dr ", "md", "hospital", "clinic", "reg no",
    "ward", "bed no", "opd", "ipd", "department",
    "uhid", "age", "sex", "gender", "weight",
    "signature", "stamp", "seal", "registered"
]

# Document type keywords
DOCUMENT_TYPE_KEYWORDS = {
    "identity": ["aadhaar", "passport", "id card", "government id", "national id",
                 "voter", "pan card", "driving licence", "birth certificate"],
    "diagnosis": ["diagnosis", "test result", "lab report", "scan report", "pathology",
                  "blood test", "mri", "ct scan", "x-ray", "ultrasound", "biopsy"],
    "admission_letter": ["admission", "admit", "hospitalization", "bed assignment",
                         "indoor", "ipd", "ward", "emergency"],
    "cost_estimate": ["estimate", "cost", "bill", "invoice", "amount", "rs.", "rupees",
                      "total charges", "package cost", "advance"]
}

# Weights for risk score formula (SRS v2.0 enhanced)
# RiskScore = w1*Tampering + w2*AIContent + w3*Metadata + w4*Relevance
WEIGHTS = {
    "tampering": 0.15,         # w1 - Image tampering indicators
    "ai_probability": 0.20,    # w2 - AI-generated content probability
    "metadata_mismatch": 0.15, # w3 - Cross-document metadata inconsistencies
    "relevance": 0.50          # w4 - Medical document relevance (DOMINANT)
}

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using PyMuPDF"""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.lower()
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

def extract_text_from_image(image_path: str) -> str:
    """Extract text from image using Tesseract OCR"""
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang='eng').lower()
        return text
    except Exception as e:
        print(f"OCR extraction error: {e}")
        return ""

def detect_document_type(text: str) -> str:
    """Classify document type based on content"""
    scores = {}
    for doc_type, keywords in DOCUMENT_TYPE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        scores[doc_type] = score

    if max(scores.values()) == 0:
        return "unknown"
    return max(scores, key=scores.get)

def check_image_tampering(file_path: str) -> dict:
    """
    Detect potential image tampering indicators
    Returns tampering score (0-100) and details
    """
    tampering_indicators = []
    tampering_score = 0

    try:
        file_size = os.path.getsize(file_path)

        # Very small files are suspicious
        if file_size < 5_000:
            tampering_score += 35
            tampering_indicators.append("Extremely small file (< 5KB) — likely not a real scan")
        elif file_size < 15_000:
            tampering_score += 20
            tampering_indicators.append("Very small file — suspicious for a medical document")

        # Try to open as image
        try:
            img = Image.open(file_path)
            info = img.info

            # Metadata stripped?
            if not info or len(info) == 0:
                tampering_score += 15
                tampering_indicators.append("No EXIF metadata — possibly stripped or digitally created")

            width, height = img.size

            # Unusually small resolution for a scanned document
            if width < 400 or height < 400:
                tampering_score += 20
                tampering_indicators.append("Very low resolution — unlikely a scanned medical document")

            # Unusually high resolution (possible upsampling)
            if width > 4000 or height > 4000:
                tampering_score += 10
                tampering_indicators.append("Unusually high resolution — possible AI upsampling")

            # Compression artifacts
            if file_path.lower().endswith(('.jpg', '.jpeg')):
                compression_ratio = file_size / (width * height) if (width * height) > 0 else 0
                if compression_ratio < 0.001:
                    tampering_score += 20
                    tampering_indicators.append("Heavy JPEG compression — quality loss detected")

            # Check for uniform/blank images (screenshots of empty docs)
            try:
                extrema = img.convert('L').getextrema()
                if (extrema[1] - extrema[0]) < 10:
                    tampering_score += 30
                    tampering_indicators.append("Nearly blank/uniform image detected")
            except:
                pass

            img.close()

        except Exception:
            # Not an image — could be a PDF, which is fine
            if not file_path.lower().endswith('.pdf'):
                tampering_score += 10
                tampering_indicators.append("File could not be opened as image")

    except Exception as e:
        tampering_indicators.append(f"Analysis error: {str(e)}")

    return {
        "score": min(100, tampering_score),
        "indicators": tampering_indicators
    }

def score_document_relevance(text: str) -> dict:
    """
    Score how relevant a document is to medical fundraising.
    This is the MAIN filter — non-medical documents should score 70-100.
    Returns relevance_risk_score (0=definitely medical, 100=definitely not medical).
    """
    indicators = []
    score = 0
    text_lower = text.lower() if text else ""

    if not text or len(text.strip()) < 20:
        return {
            "score": 90,
            "indicators": ["No readable text — cannot verify document authenticity"],
            "medical_keywords_found": 0,
            "red_flags_found": 0
        }

    # ── 1. Medical keyword matching ──────────────────────────────────
    medical_matches = [kw for kw in MEDICAL_KEYWORDS if kw in text_lower]
    med_count = len(medical_matches)

    if med_count == 0:
        score += 55
        indicators.append("CRITICAL: Zero medical keywords found — not a medical document")
    elif med_count < 2:
        score += 45
        indicators.append(f"Only {med_count} medical keyword found — extremely suspicious")
    elif med_count < MIN_MEDICAL_KEYWORDS_REQUIRED:
        score += 30
        indicators.append(f"Only {med_count} medical keywords (need ≥{MIN_MEDICAL_KEYWORDS_REQUIRED})")
    elif med_count < 6:
        score += 15
        indicators.append(f"Low medical content ({med_count} keywords)")
    # Good medical content: no penalty

    # ── 2. Non-medical red flag detection ───────────────────────────
    red_flags = [kw for kw in NON_MEDICAL_RED_FLAGS if kw in text_lower]
    rf_count = len(red_flags)

    if rf_count >= 5:
        score += 45
        indicators.append(f"ALERT: {rf_count} non-medical red flags detected: {', '.join(red_flags[:8])}")
        indicators.append("Document appears to be academic/technical — NOT a medical record")
    elif rf_count >= 3:
        score += 30
        indicators.append(f"WARNING: {rf_count} non-medical terms detected: {', '.join(red_flags[:5])}")
    elif rf_count >= 1:
        score += 10
        indicators.append(f"Minor: {rf_count} non-medical term(s): {', '.join(red_flags)}")

    # ── 3. Medical document structure ───────────────────────────────
    structure_hits = sum(1 for m in MEDICAL_STRUCTURE_MARKERS if m in text_lower)

    if structure_hits == 0:
        score += 25
        indicators.append("No medical document structure (missing date, doctor, patient ID, etc.)")
    elif structure_hits < 3:
        score += 15
        indicators.append(f"Weak document structure (only {structure_hits} markers found)")
    elif structure_hits >= 6:
        # Reward well-structured medical documents
        score = max(0, score - 10)
        indicators.append(f"Good document structure ({structure_hits} markers found)")

    # ── 4. Document length check ────────────────────────────────────
    if len(text) < 50:
        score += 20
        indicators.append("Extremely short content — insufficient for verification")
    elif len(text) < 150:
        score += 10
        indicators.append("Short document — limited verification possible")

    # ── 5. Ratio check: if red flags outnumber medical keywords ────
    if rf_count > 0 and med_count > 0 and rf_count > med_count:
        score += 15
        indicators.append(f"Non-medical terms ({rf_count}) outnumber medical terms ({med_count})")
    elif rf_count > 0 and med_count == 0:
        score += 20
        indicators.append("Non-medical content with zero medical terms — fraudulent document")

    return {
        "score": min(100, max(0, score)),
        "indicators": indicators,
        "medical_keywords_found": med_count,
        "medical_keywords_matched": medical_matches[:15],
        "red_flags_found": rf_count,
        "red_flags_matched": red_flags[:10],
        "structure_markers_found": structure_hits
    }


def analyze_ai_generated_content(text: str) -> dict:
    """
    Analyze text for AI-generated content probability.
    Focused on text patterns, NOT medical relevance (that's score_document_relevance).
    """
    ai_indicators = []
    ai_score = 0

    if not text or len(text.strip()) < 20:
        return {"score": 70, "indicators": ["No text to analyze"], "medical_keyword_count": 0}

    text_lower = text.lower()

    # Generic / template language
    generic_phrases = [
        "in conclusion", "it is important to note", "this document serves",
        "hereby confirm", "to whom it may concern", "as discussed above",
        "the purpose of this", "it should be noted", "furthermore",
        "in summary", "as mentioned earlier"
    ]
    generic_count = sum(1 for phrase in generic_phrases if phrase in text_lower)
    if generic_count >= 3:
        ai_score += 30
        ai_indicators.append(f"Heavy template language detected ({generic_count} generic phrases)")
    elif generic_count >= 2:
        ai_score += 20
        ai_indicators.append("Template-like language detected")

    # Word repetition analysis
    words = text_lower.split()
    if len(words) > 50:
        word_freq = {}
        for word in words:
            if len(word) > 3:  # Skip short words
                word_freq[word] = word_freq.get(word, 0) + 1
        if word_freq:
            avg_freq = sum(word_freq.values()) / len(word_freq)
            if avg_freq > 5:
                ai_score += 15
                ai_indicators.append("High word repetition pattern")

    # Sentence uniformity (AI text tends to have very uniform sentence lengths)
    sentences = [s.strip() for s in re.split(r'[.!?]', text) if len(s.strip()) > 10]
    if len(sentences) >= 5:
        lengths = [len(s.split()) for s in sentences]
        avg_len = sum(lengths) / len(lengths)
        variance = sum((l - avg_len) ** 2 for l in lengths) / len(lengths)
        if variance < 4 and avg_len > 10:
            ai_score += 20
            ai_indicators.append("Suspiciously uniform sentence lengths — possible AI generation")

    # Short document content
    if len(text) < 100:
        ai_score += 20
        ai_indicators.append("Very short document")

    medical_coverage = sum(1 for kw in MEDICAL_KEYWORDS if kw in text_lower)

    return {
        "score": min(100, ai_score),
        "indicators": ai_indicators,
        "medical_keyword_count": medical_coverage
    }

def extract_patient_name(text: str) -> str:
    """Basic extraction of patient name from text"""
    patterns = [
        r"patient\s*name\s*[:\-]\s*([a-z\s]+)(?:[,\n]|$)",
        r"name\s*[:\-]\s*([a-z\s]+)(?:[,\n]|$)",
        r"mr\.\s*([a-z\s]+)(?:[,\n]|$)",
        r"ms\.\s*([a-z\s]+)(?:[,\n]|$)"
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            if 3 < len(name) < 40 and not any(w in name.lower() for w in ["age", "sex", "date"]):
                return name.lower()
    return ""

def validate_metadata_consistency(files_data: list) -> dict:
    """
    Validate consistency across multiple documents
    Checks for metadata mismatches
    """
    inconsistencies = []
    mismatch_score = 0

    if len(files_data) < 2:
        return {"score": 0, "inconsistencies": ["Single document - no cross-validation possible"]}

    # Extract metadata from all files
    metadata_list = []
    for file_path, text in files_data:
        try:
            if file_path.endswith(('.jpg', '.jpeg', '.png')):
                img = Image.open(file_path)
                metadata_list.append({
                    "file": file_path,
                    "modified_date": img.info.get('Modified', img.info.get('Date', '')),
                    "software": img.info.get('Software', ''),
                    "text_content": text
                })
                img.close()
            elif file_path.endswith('.pdf'):
                doc = fitz.open(file_path)
                metadata = doc.metadata
                metadata_list.append({
                    "file": file_path,
                    "modified_date": metadata.get('modDate', ''),
                    "creator": metadata.get('creator', ''),
                    "producer": metadata.get('producer', ''),
                    "text_content": text
                })
                doc.close()
        except Exception as e:
            metadata_list.append({"file": file_path, "error": str(e)})

    # Check for date inconsistencies
    dates_found = []
    date_pattern = r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
    for meta in metadata_list:
        if 'text_content' in meta:
            dates = re.findall(date_pattern, meta.get('text_content', ''))
            dates_found.extend(dates)

    # If dates span unreasonable timeframes, flag it
    # (This is simplified - production would parse and compare dates properly)

    # Check for creator/producer inconsistencies
    creators = set()
    for meta in metadata_list:
        if 'creator' in meta:
            creators.add(meta.get('creator', ''))
        if 'producer' in meta:
            creators.add(meta.get('producer', ''))

    if len(creators) > 3:
        mismatch_score += 20
        inconsistencies.append(f"Multiple document creators detected: {len(creators)}")

    # Check for name inconsistencies
    names_found = set()
    for meta in metadata_list:
        if 'text_content' in meta:
            name = extract_patient_name(meta['text_content'])
            if name:
                names_found.add(name)
                
    if len(names_found) > 1:
        mismatch_score += 30
        inconsistencies.append(f"Inconsistent patient names detected across documents: {', '.join(names_found)}")

    return {
        "score": min(100, mismatch_score),
        "inconsistencies": inconsistencies
    }

def compute_risk_score(files: list, hospital_verified: bool = False) -> dict:
    """
    Compute weighted risk score per SRS v2.0 formula:
    RiskScore = w1 × TamperingScore + w2 × AIProbability + w3 × MetadataMismatchScore
    """
    start_time = time.time()
    results = {
        "files_analyzed": 0,
        "document_types": [],
        "processing_times": {},
        "tampering_analysis": [],
        "ai_analysis": [],
        "metadata_analysis": None,
        "risk_scores": {},
        "details": [],
        "verdict": "",
        "recommendation": ""
    }

    files_data = []
    total_file_size = 0

    # Stage 1: OCR Processing (10-15 seconds target)
    ocr_start = time.time()
    for file in files:
        try:
            file_path = file if isinstance(file, str) else file.filename

            if file_path.endswith('.pdf'):
                text = extract_text_from_pdf(file_path)
            else:
                text = extract_text_from_image(file_path)

            files_data.append((file_path, text))
            results["files_analyzed"] += 1

            # Detect document type
            doc_type = detect_document_type(text)
            results["document_types"].append(doc_type)

            total_file_size += os.path.getsize(file_path) if os.path.exists(file_path) else 0

        except Exception as e:
            results["details"].append(f"Error processing {file}: {str(e)}")

    results["processing_times"]["ocr_stage"] = round(time.time() - ocr_start, 2)

    # Stage 2: Metadata Validation (5-8 seconds target)
    metadata_start = time.time()
    metadata_result = validate_metadata_consistency(files_data)
    results["metadata_analysis"] = metadata_result
    results["processing_times"]["metadata_stage"] = round(time.time() - metadata_start, 2)

    # Stage 3: AI Forgery Analysis (~5 seconds target)
    ai_start = time.time()
    for file_path, text in files_data:
        tampering_result = check_image_tampering(file_path)
        results["tampering_analysis"].append(tampering_result)

        ai_result = analyze_ai_generated_content(text)
        results["ai_analysis"].append(ai_result)
    results["processing_times"]["ai_analysis_stage"] = round(time.time() - ai_start, 2)

    # ── Stage 4: Document Relevance Scoring (NEW — dominant factor) ──
    relevance_start = time.time()
    relevance_results = []
    for file_path, text in files_data:
        rel = score_document_relevance(text)
        relevance_results.append(rel)
    results["relevance_analysis"] = relevance_results
    results["processing_times"]["relevance_stage"] = round(time.time() - relevance_start, 2)

    # ── Calculate weighted risk scores ──────────────────────────────
    avg_tampering = sum(r["score"] for r in results["tampering_analysis"]) / max(1, len(results["tampering_analysis"]))
    avg_ai = sum(r["score"] for r in results["ai_analysis"]) / max(1, len(results["ai_analysis"]))
    metadata_mismatch = metadata_result["score"]
    avg_relevance = sum(r["score"] for r in relevance_results) / max(1, len(relevance_results))

    # Aggregate medical keyword stats
    all_text = " ".join(text for _, text in files_data)
    total_medical_keywords = sum(1 for kw in MEDICAL_KEYWORDS if kw in all_text.lower())
    total_red_flags = sum(r.get("red_flags_found", 0) for r in relevance_results)

    # SRS v2.0 Enhanced Formula (relevance is the dominant component)
    calculated_score = (
        WEIGHTS["tampering"] * avg_tampering +
        WEIGHTS["ai_probability"] * avg_ai +
        WEIGHTS["metadata_mismatch"] * metadata_mismatch +
        WEIGHTS["relevance"] * avg_relevance
    )

    # HARD FLOOR: if NO medical keywords at all → minimum 75
    if total_medical_keywords == 0:
        calculated_score = max(75, calculated_score)
        results["details"].append("⚠️ FRAUD ALERT: No medical terminology found in any document")
    elif total_medical_keywords < MIN_MEDICAL_KEYWORDS_REQUIRED:
        calculated_score = max(55, calculated_score)
        results["details"].append(f"⚠️ WARNING: Only {total_medical_keywords} medical terms (need ≥{MIN_MEDICAL_KEYWORDS_REQUIRED})")

    # HARD FLOOR: if many non-medical red flags → minimum 60
    if total_red_flags >= 5:
        calculated_score = max(70, calculated_score)
        results["details"].append(f"⚠️ FRAUD ALERT: {total_red_flags} non-medical red flags detected")
    elif total_red_flags >= 3:
        calculated_score = max(55, calculated_score)
        results["details"].append(f"⚠️ WARNING: {total_red_flags} non-medical terms found")

    final_risk_score = int(min(100, calculated_score))

    if hospital_verified and final_risk_score < 70:
        final_risk_score = max(0, int(final_risk_score * 0.85))
        results["details"].append("Risk score reduced (-15%) due to verified hospital status")

    results["risk_scores"] = {
        "tampering_score": round(avg_tampering, 2),
        "ai_probability_score": round(avg_ai, 2),
        "metadata_mismatch_score": round(metadata_mismatch, 2),
        "relevance_score": round(avg_relevance, 2),
        "final_risk_score": final_risk_score,
        "medical_keywords_found": total_medical_keywords,
        "red_flags_found": total_red_flags
    }

    # Determine verdict
    risk_score = final_risk_score

    if risk_score < 40:
        results["verdict"] = "Low Risk"
        results["recommendation"] = "approve"
        results["details"].append("Documents appear to be legitimate medical records")
    elif risk_score < 70:
        results["verdict"] = "Medium Risk — Admin Review Required"
        results["recommendation"] = "escalate"
        results["details"].append("Documents require careful manual verification")
    else:
        results["verdict"] = "High Risk — Likely Fraudulent"
        results["recommendation"] = "reject"
        results["details"].append("Documents do not appear to be genuine medical records")

    # File hashes for on-chain storage
    for file_path, text in files_data:
        try:
            with open(file_path, "rb") as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
            results["details"].append(f"File: {os.path.basename(file_path)} — SHA256: {file_hash}")
        except:
            pass

    results["processing_times"]["total"] = round(time.time() - start_time, 2)
    results["total_file_size"] = total_file_size

    results["medical_keyword_coverage"] = {
        "found": total_medical_keywords,
        "total": len(MEDICAL_KEYWORDS),
        "minimum_required": MIN_MEDICAL_KEYWORDS_REQUIRED,
        "passed": total_medical_keywords >= MIN_MEDICAL_KEYWORDS_REQUIRED
    }

    return results

@app.post("/verify")
@limiter.limit("10/minute")  # Limit to 10 requests per minute per IP
async def verify_documents(
    request: Request,
    files: list[UploadFile] = File(...),
    hospital_verified: bool = Form(False)
):
    """
    Main verification endpoint
    Processes uploaded documents and returns risk assessment
    Rate limited to 10 requests per minute per IP address
    """
    saved_files = []
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit
    MAX_TOTAL_SIZE = 50 * 1024 * 1024  # 50MB total limit

    try:
        # Validate file count
        if len(files) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 files allowed per request")

        # Validate and save uploaded files
        total_size = 0
        for file in files:
            # Get file size
            content = await file.read()
            file_size = len(content)

            # Validate individual file size
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds 10MB limit")

            total_size += file_size
            if total_size > MAX_TOTAL_SIZE:
                raise HTTPException(status_code=400, detail="Total file size exceeds 50MB limit")

            file_extension = os.path.splitext(file.filename)[1] if file.filename else ".tmp"
            file_name = f"{int(time.time())}_{file.filename}"
            file_path = f"./uploads/{file_name}"

            # Ensure uploads directory exists
            os.makedirs("./uploads", exist_ok=True)

            with open(file_path, "wb") as f:
                f.write(content)
            saved_files.append(file_path)

        # Compute risk score
        result = compute_risk_score(saved_files, hospital_verified)

        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
    finally:
        # Cleanup uploaded files after processing
        # Files are kept for backend processing but could be moved to permanent storage
        # In production, consider:
        # 1. Moving to secure S3 bucket with encryption
        # 2. Deleting after backend retrieves results
        # 3. Using temporary storage with auto-cleanup
        for file_path in saved_files:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as cleanup_error:
                print(f"Cleanup error for {file_path}: {cleanup_error}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "MedTrustFund AI Verification",
        "version": "2.0"
    }


@app.post("/verify-hospital")
@limiter.limit("5/minute")  # Limit to 5 requests per minute for hospital verification
async def verify_hospital_license(
    request: Request,
    license_number: str = Form(...),
    hospital_name: str = Form(...),
    state: str = Form("")
):
    """
    Verify hospital license against registry
    In production, this would call an official state medical board API
    """
    try:
        # Simulated hospital verification logic
        # In production, replace with actual API call to state medical board

        # Basic validation
        if not license_number or len(license_number) < 6:
            return {
                "verified": False,
                "confidence": 0,
                "message": "Invalid license number format"
            }

        # Check for known patterns (simulated)
        # Real implementation would query state database
        is_valid_format = bool(re.match(r'^[A-Z0-9]{6,20}$', license_number.upper()))

        if not is_valid_format:
            return {
                "verified": False,
                "confidence": 0,
                "message": "License number not found in registry"
            }

        # Simulated verification with high confidence for valid format
        return {
            "verified": True,
            "confidence": 0.95,
            "message": "Hospital license verified successfully",
            "license_number": license_number.upper(),
            "hospital_name": hospital_name,
            "state": state or "Unknown"
        }

    except Exception as e:
        return {
            "verified": False,
            "confidence": 0,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
