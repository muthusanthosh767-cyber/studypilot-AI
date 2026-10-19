import os
import sqlite3
from pathlib import Path

DB_PATH = os.getenv("STUDYPILOT_DB", str(Path(__file__).resolve().parent.parent / "studypilot.db"))

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_name TEXT NOT NULL,
                score INTEGER NOT NULL,
                total INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

def save_attempt(document_name: str, score: int, total: int):
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO quiz_attempts(document_name, score, total) VALUES (?, ?, ?)",
            (document_name, score, total),
        )
        conn.commit()
        return cur.lastrowid

def list_attempts(limit: int = 20):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, document_name, score, total, created_at FROM quiz_attempts ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]
