"""Authentication helpers – Google OAuth token verification, JWT, Flask decorator."""

import os
import functools
from datetime import datetime, timedelta, timezone

import jwt
from flask import request, g, jsonify
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")


# ── Google token verification ─────────────────────────────────────────────────

def verify_google_token(token):
    """
    Verify a Google OAuth2 ID token (the `credential` string from the frontend).
    Returns a dict with: sub, email, name, picture  (or raises).
    """
    idinfo = google_id_token.verify_oauth2_token(
        token,
        google_requests.Request(),
        GOOGLE_CLIENT_ID,
    )
    # Verify issuer
    if idinfo["iss"] not in ("accounts.google.com", "https://accounts.google.com"):
        raise ValueError("Invalid issuer")

    return {
        "sub": idinfo["sub"],           # Google user ID
        "email": idinfo.get("email", ""),
        "name": idinfo.get("name", ""),
        "picture": idinfo.get("picture", ""),
    }


# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_jwt(user_id, email):
    """Create a signed JWT for an authenticated user."""
    payload = {
        "user_id": user_id,
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token):
    """Decode and verify a JWT. Returns payload dict or raises."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


# ── Flask decorator ───────────────────────────────────────────────────────────

def require_auth(f):
    """
    Decorator that extracts Authorization: Bearer <token>,
    verifies the JWT, and sets g.user_id and g.user_email.
    Returns 401 if missing / invalid.
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication required"}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_jwt(token)
            g.user_id = payload["user_id"]
            g.user_email = payload["email"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except (jwt.InvalidTokenError, KeyError):
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)

    return decorated
