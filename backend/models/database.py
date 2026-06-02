import sqlite3
from flask import g, current_app


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(
            current_app.config["DATABASE"],
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


SCHEMA = """
CREATE TABLE IF NOT EXISTS analyses (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    source_text TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    risk_level  TEXT,
    risk_score  INTEGER,
    ioc_count   INTEGER DEFAULT 0,
    technique_count INTEGER DEFAULT 0,
    rule_count  INTEGER DEFAULT 0,
    summary     TEXT
);

CREATE TABLE IF NOT EXISTS iocs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    value       TEXT NOT NULL,
    category    TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS techniques (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id     TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    technique_id    TEXT NOT NULL,
    technique_name  TEXT NOT NULL,
    tactic          TEXT NOT NULL,
    tactic_id       TEXT,
    confidence      TEXT NOT NULL,
    description     TEXT,
    matched_keywords TEXT
);

CREATE TABLE IF NOT EXISTS detection_rules (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    rule_type   TEXT NOT NULL,
    rule_name   TEXT NOT NULL,
    rule_content TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
);

CREATE INDEX IF NOT EXISTS idx_iocs_analysis ON iocs(analysis_id);
CREATE INDEX IF NOT EXISTS idx_techniques_analysis ON techniques(analysis_id);
CREATE INDEX IF NOT EXISTS idx_rules_analysis ON detection_rules(analysis_id);
"""


def init_db():
    db = sqlite3.connect(current_app.config["DATABASE"])
    db.executescript(SCHEMA)
    _seed_settings(db)
    db.commit()
    db.close()


def _seed_settings(db):
    defaults = {
        "llm_provider": "none",
        "openai_api_key": "",
        "gemini_api_key": "",
        "llm_model": "gpt-4o-mini",
        "max_ioc_results": "500",
    }
    for k, v in defaults.items():
        db.execute(
            "INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)", (k, v)
        )
