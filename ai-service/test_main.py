"""
Unit tests for the MedTrustFund AI Verification Service
Run with: pytest test_main.py -v
"""
import requests
import os, tempfile
import time

AI_URL = "http://localhost:8001"


def test_health_endpoint():
    """Test the /health endpoint"""
    r = requests.get(f"{AI_URL}/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"


def test_verify_with_valid_pdf():
    """Test /verify with a dummy text file pretending to be a PDF"""
    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False, mode="w")
    tmp.write("Patient Name: Alice Smith\nDiagnosis: Appendicitis\nDoctor: Dr. Brown\n")
    tmp.close()

    with open(tmp.name, "rb") as f:
        r = requests.post(
            f"{AI_URL}/verify",
            files=[("files", ("doc1.pdf", f, "application/pdf"))],
            data={"hospital_verified": "false"},
        )

    os.unlink(tmp.name)
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert "risk_score" in data
    assert "verdict" in data


def test_verify_with_hospital_trust_weighting():
    """Risk should be lower when hospital is verified"""
    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False, mode="w")
    tmp.write("Patient Name: Bob Jones\nDiagnosis: Fracture\n")
    tmp.close()

    scores = {}
    for verified in ["false", "true"]:
        with open(tmp.name, "rb") as f:
            r = requests.post(
                f"{AI_URL}/verify",
                files=[("files", ("doc.pdf", f, "application/pdf"))],
                data={"hospital_verified": verified},
            )
        scores[verified] = r.json()["risk_score"]

    os.unlink(tmp.name)
    # verified hospital should have equal or lower risk
    assert scores["true"] <= scores["false"]


def test_verify_name_mismatch():
    """Two docs with different patient names should raise risk"""
    tmp1 = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False, mode="w")
    tmp1.write("Patient Name: Alice Smith\nDiagnosis: Test\n")
    tmp1.close()

    tmp2 = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False, mode="w")
    tmp2.write("Patient Name: Bob Jones\nDiagnosis: Test\n")
    tmp2.close()

    with open(tmp1.name, "rb") as f1, open(tmp2.name, "rb") as f2:
        r = requests.post(
            f"{AI_URL}/verify",
            files=[
                ("files", ("doc1.pdf", f1, "application/pdf")),
                ("files", ("doc2.pdf", f2, "application/pdf")),
            ],
            data={"hospital_verified": "false"},
        )

    os.unlink(tmp1.name)
    os.unlink(tmp2.name)
    assert r.status_code == 200
    data = r.json()
    # Name mismatch should push risk higher
    assert data["risk_score"] >= 20


def test_verify_no_files_returns_error():
    """Submitting without files should return an error"""
    r = requests.post(f"{AI_URL}/verify")
    assert r.status_code == 422 or r.status_code == 400


def test_rate_limiting():
    """Test that rate limiting is enforced (10 requests/minute)"""
    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False, mode="w")
    tmp.write("Patient Name: Test\nDiagnosis: Test\n")
    tmp.close()

    success_count = 0
    rate_limited_count = 0

    # Send 15 requests rapidly (more than the 10/minute limit)
    for i in range(15):
        with open(tmp.name, "rb") as f:
            r = requests.post(
                f"{AI_URL}/verify",
                files=[("files", ("doc.pdf", f, "application/pdf"))],
                data={"hospital_verified": "false"},
            )

        if r.status_code == 200:
            success_count += 1
        elif r.status_code == 429:  # Rate limit exceeded
            rate_limited_count += 1

    os.unlink(tmp.name)

    # Should have some successful requests and some rate limited
    # Exact numbers depend on other tests running
    print(f"Successful: {success_count}, Rate limited: {rate_limited_count}")
    assert rate_limited_count > 0 or success_count <= 10, "Rate limiting should be enforced"


def test_file_size_validation():
    """Test that large files are rejected"""
    # Create a file larger than 10MB
    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False, mode="wb")
    # Write 11MB of data
    tmp.write(b"x" * (11 * 1024 * 1024))
    tmp.close()

    with open(tmp.name, "rb") as f:
        r = requests.post(
            f"{AI_URL}/verify",
            files=[("files", ("large.pdf", f, "application/pdf"))],
            data={"hospital_verified": "false"},
        )

    os.unlink(tmp.name)

    # Should be rejected due to file size
    assert r.status_code == 400
    assert "exceeds" in r.json().get("detail", "").lower() or r.json().get("success") is False
