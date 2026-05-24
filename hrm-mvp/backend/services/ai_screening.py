import io
import math
import re
from collections import Counter
from dataclasses import dataclass
from typing import Iterable


EMAIL_REGEX = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
PHONE_REGEX = re.compile(r"(\+?\d[\d\s().-]{7,}\d)")
EXPERIENCE_REGEX = re.compile(
    r"(\d+\+?\s*(years?|yrs?|лет|года|год)\s*(of\s*)?(experience|опыта)?)|"
    r"(senior|lead|middle|principal|руководил|команд|production)",
    re.IGNORECASE,
)

_model = None


@dataclass
class ScreeningScore:
    final_score: float
    cosine_sim: float
    explanation: str


@dataclass
class CandidateProfile:
    name: str | None
    email: str | None
    phone: str | None


def extract_text(filename: str, content: bytes) -> str:
    if filename.lower().endswith(".txt"):
        return content.decode("utf-8", errors="ignore")

    if filename.lower().endswith(".pdf"):
        try:
            import pdfplumber
        except ImportError as exc:
            raise ValueError("PDF parsing requires pdfplumber to be installed") from exc

        chunks = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                chunks.append(page.extract_text() or "")
        return "\n".join(chunks)

    raise ValueError("Only PDF and TXT resumes are supported")


def anonymize_text(raw_text: str) -> str:
    text = EMAIL_REGEX.sub("[EMAIL]", raw_text)
    return PHONE_REGEX.sub("[PHONE]", text)


def extract_candidate_profile(raw_text: str, fallback_name: str) -> CandidateProfile:
    email_match = EMAIL_REGEX.search(raw_text)
    phone_match = PHONE_REGEX.search(raw_text)
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    name = lines[0] if lines else fallback_name
    return CandidateProfile(
        name=name[:200] if name else None,
        email=email_match.group(0) if email_match else None,
        phone=phone_match.group(0) if phone_match else None,
    )


def semantic_similarity(job_text: str, resume_text: str) -> float:
    global _model
    try:
        if _model is None:
            from sentence_transformers import SentenceTransformer
            from sklearn.metrics.pairwise import cosine_similarity

            _model = SentenceTransformer("all-MiniLM-L6-v2")
        embeddings = _model.encode([job_text, resume_text], normalize_embeddings=True)
        raw = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
        return max(0.0, min(1.0, (raw + 1.0) / 2.0))
    except Exception:
        return lexical_cosine(job_text, resume_text)


def lexical_cosine(left: str, right: str) -> float:
    left_counts = Counter(re.findall(r"[\w+#.-]+", left.lower()))
    right_counts = Counter(re.findall(r"[\w+#.-]+", right.lower()))
    if not left_counts or not right_counts:
        return 0.0

    shared = set(left_counts) & set(right_counts)
    numerator = sum(left_counts[token] * right_counts[token] for token in shared)
    left_norm = math.sqrt(sum(value * value for value in left_counts.values()))
    right_norm = math.sqrt(sum(value * value for value in right_counts.values()))
    return numerator / (left_norm * right_norm)


def matched_skills(required_skills: Iterable[str], resume_text: str) -> tuple[list[str], list[str], float]:
    skills = [skill.strip() for skill in required_skills if skill.strip()]
    if not skills:
        return [], [], 1.0

    resume_lower = resume_text.lower()
    found = [skill for skill in skills if skill.lower() in resume_lower]
    missing = [skill for skill in skills if skill not in found]
    return found, missing, len(found) / len(skills)


def score_resume(job_description: str, required_skills: list[str], resume_text: str) -> ScreeningScore:
    clean_text = anonymize_text(resume_text)
    cosine = semantic_similarity(job_description, clean_text)
    found, missing, skill_score = matched_skills(required_skills, clean_text)
    experience_score = 1.0 if EXPERIENCE_REGEX.search(clean_text) else 0.0

    weighted_score = (cosine * 0.55) + (skill_score * 0.35) + (experience_score * 0.10)
    final_score = round(1.0 + weighted_score * 9.0, 1)

    if final_score >= 8.0:
        match_label = "Strong Match"
    elif final_score >= 5.0:
        match_label = "Moderate Match"
    else:
        match_label = "Partial Match"

    explanation = (
        f"{match_label}. "
        f"Found required skills: {', '.join(found) if found else 'none'}. "
        f"Missing required skills: {', '.join(missing) if missing else 'none'}. "
        f"Cosine similarity: {cosine:.3f}. "
        f"Experience markers: {'found' if experience_score else 'not found'}."
    )
    return ScreeningScore(final_score=final_score, cosine_sim=round(cosine, 3), explanation=explanation)
