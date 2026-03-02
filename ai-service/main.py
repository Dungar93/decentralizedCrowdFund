from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import hashlib
import os
from pathlib import Path

app = FastAPI(title="MedTrustFund AI Verification")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MEDICAL_KEYWORDS = {"diagnosis", "admission", "discharge", "treatment", "surgery", "hospital", "doctor", "patient", "bill", "report"}

def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text.lower()

def compute_fraud_score(files: list) -> dict:
    total_penalty = 0.0
    details = []

    for file in files:
        text = extract_text_from_pdf(file) if file.endswith(".pdf") else pytesseract.image_to_string(Image.open(file)).lower()
        
        # 1. Metadata & basic forgery check
        if os.path.getsize(file) < 10_000:
            total_penalty += 30
            details.append("Very small file - suspicious")
        
        # 2. Medical keyword coverage (30%)
        found = sum(1 for kw in MEDICAL_KEYWORDS if kw in text)
        coverage = (found / len(MEDICAL_KEYWORDS)) * 100
        keyword_penalty = max(0, 40 - coverage)
        total_penalty += keyword_penalty
        details.append(f"Keyword coverage: {coverage:.1f}%")

        # 3. Hash for later on-chain storage
        with open(file, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
        details.append(f"SHA256: {file_hash}")

    risk_score = min(100, int(total_penalty))
    return {
        "riskScore": risk_score,
        "details": details,
        "verdict": "Low Risk" if risk_score < 30 else "Medium Risk" if risk_score < 60 else "High Risk - Manual Review Required"
    }

@app.post("/verify")
async def verify_documents(files: list[UploadFile] = File(...)):
    saved = []
    for file in files:
        path = f"../uploads/{file.filename}"
        with open(path, "wb") as f:
            f.write(await file.read())
        saved.append(path)
    
    result = compute_fraud_score(saved)
    return result