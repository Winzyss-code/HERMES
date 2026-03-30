import io
import re
from typing import Tuple

import pdfplumber
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


MODEL = SentenceTransformer("all-MiniLM-L6-v2")

PHONE_REGEX = re.compile(r"(\+?\d[\d\s().-]{7,}\d)")
EMAIL_REGEX = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
NAME_REGEX = re.compile(r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$")


def extract_text(pdf_bytes: bytes) -> str:
    text_chunks = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_chunks.append(page_text)
    return "\n".join(text_chunks)


def anonymize_text(raw_text: str) -> Tuple[str, str]:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    candidate_name = lines[0] if lines else "Unknown"

    stripped_lines = lines[3:] if len(lines) > 3 else []
    anonymized = []
    for idx, line in enumerate(stripped_lines):
        if PHONE_REGEX.search(line) or EMAIL_REGEX.search(line):
            continue
        if idx < 5 and NAME_REGEX.match(line):
            continue
        anonymized.append(line)
    return candidate_name, "\n".join(anonymized)


def score_resume(pdf_bytes: bytes, job_description: str) -> Tuple[str, float]:
    raw_text = extract_text(pdf_bytes)
    candidate_name, anonymized_text = anonymize_text(raw_text)

    if not anonymized_text.strip():
        return candidate_name, 0.0

    resume_vec = MODEL.encode([anonymized_text], normalize_embeddings=True)
    job_vec = MODEL.encode([job_description], normalize_embeddings=True)
    similarity = float(cosine_similarity(resume_vec, job_vec)[0][0])
    score = round(similarity * 100, 1)
    return candidate_name, score
