import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv


load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USERNAME or "no-reply@hermes.local")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def build_verification_url(token: str) -> str:
    return f"{FRONTEND_URL.rstrip('/')}/verify-email?token={token}"


def send_verification_email(to_email: str, organization_name: str, token: str) -> None:
    verification_url = build_verification_url(token)
    subject = "Confirm your HERMES account"
    body = (
        f"Welcome to HERMES.\n\n"
        f"Organization: {organization_name}\n\n"
        f"Confirm your email by opening this link:\n{verification_url}\n\n"
        f"If you did not request this registration, ignore this email."
    )

    if not SMTP_HOST:
        print(f"[HERMES email verification] SMTP is not configured. Link for {to_email}: {verification_url}")
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = SMTP_FROM
    message["To"] = to_email
    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        if SMTP_USE_TLS:
            server.starttls()
        if SMTP_USERNAME and SMTP_PASSWORD:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(message)
