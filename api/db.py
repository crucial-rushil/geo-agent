"""SQLite database for Geode – users and analysis history."""

import sqlite3
import os
import json
import uuid
from datetime import datetime

DB_DIR = os.environ.get("DB_DIR", os.path.dirname(__file__))
DB_PATH = os.path.join(DB_DIR, "geo_agent.db")


def get_db():
    """Get a connection with row_factory set to sqlite3.Row."""
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA busy_timeout=30000")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id          TEXT PRIMARY KEY,
            google_id   TEXT UNIQUE NOT NULL,
            email       TEXT NOT NULL,
            name        TEXT NOT NULL,
            picture_url TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS analyses (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            mode        TEXT NOT NULL,
            input       TEXT NOT NULL,
            score       INTEGER,
            results     TEXT NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_analyses_user
            ON analyses(user_id, created_at DESC);
        """
    )
    conn.commit()
    conn.close()
    print(f"✓ Database ready at {DB_PATH}")


# ── User helpers ──────────────────────────────────────────────────────────────

def upsert_user(google_id, email, name, picture_url=None):
    """Create or update a user from Google profile data. Returns user dict."""
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM users WHERE google_id = ?", (google_id,)
    ).fetchone()

    if existing:
        conn.execute(
            "UPDATE users SET email=?, name=?, picture_url=? WHERE google_id=?",
            (email, name, picture_url, google_id),
        )
        conn.commit()
        user_id = existing["id"]
    else:
        user_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO users (id, google_id, email, name, picture_url) VALUES (?,?,?,?,?)",
            (user_id, google_id, email, name, picture_url),
        )
        conn.commit()

    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(user)


def get_user_by_id(user_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


# ── Analysis history helpers ──────────────────────────────────────────────────

def save_analysis(user_id, mode, input_value, results, score=None):
    """Save an analysis result. Returns the analysis id."""
    analysis_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO analyses (id, user_id, mode, input, score, results) VALUES (?,?,?,?,?,?)",
        (analysis_id, user_id, mode, input_value, score, json.dumps(results)),
    )
    conn.commit()
    conn.close()
    return analysis_id


def get_user_analyses(user_id, limit=50, offset=0):
    """Return a user's analyses (most recent first), without full results blob."""
    conn = get_db()
    rows = conn.execute(
        """SELECT id, mode, input, score, created_at
           FROM analyses
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?""",
        (user_id, limit, offset),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_analysis_by_id(analysis_id, user_id):
    """Return a single analysis with full results, only if owned by user_id."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM analyses WHERE id = ? AND user_id = ?",
        (analysis_id, user_id),
    ).fetchone()
    conn.close()
    if row:
        result = dict(row)
        result["results"] = json.loads(result["results"])
        return result
    return None


def delete_analysis(analysis_id, user_id):
    """Delete an analysis. Returns True if deleted."""
    conn = get_db()
    cursor = conn.execute(
        "DELETE FROM analyses WHERE id = ? AND user_id = ?",
        (analysis_id, user_id),
    )
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted
