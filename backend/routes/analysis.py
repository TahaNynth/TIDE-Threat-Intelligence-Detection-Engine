import uuid
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

from models.database import get_db
from services.ioc_extractor import extract_iocs, ioc_summary
from services.mitre_mapper import map_techniques
from services.risk_scorer import calculate_risk
from services.rule_generator import generate_rules
from services.summary_generator import generate_summary
from services.llm_service import enhance_summary
from utils.file_parser import parse_file
from utils.validators import (
    allowed_file, validate_text_input, sanitize_filename, check_for_injection
)

analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True, force=True) or {}
    raw_text = data.get("text", "")
    if not isinstance(raw_text, str):
        raw_text = ""
    text = raw_text.strip()
    raw_title = data.get("title", "")
    title = (raw_title.strip() if isinstance(raw_title, str) else "") or "Untitled Analysis"

    valid, msg = validate_text_input(text)
    if not valid:
        return jsonify({"error": msg}), 400

    if check_for_injection(text):
        return jsonify({"error": "Active script content detected in input. Only plain text reports are accepted."}), 400

    # Limit to 500k chars
    if len(text) > 500_000:
        text = text[:500_000]

    analysis_id = str(uuid.uuid4())
    iocs = extract_iocs(text)
    techniques = map_techniques(text)
    risk = calculate_risk(iocs, techniques, text)
    rules = generate_rules(iocs, techniques, title)
    summary = generate_summary(text, iocs, techniques, risk)

    # Optional LLM enhancement
    try:
        settings = _get_settings()
        if settings.get("llm_provider", "none") != "none":
            summary = enhance_summary(summary, text, settings)
    except Exception as e:
        # Surface the error in the summary so the frontend can show it
        summary["llm_error"] = str(e)
        summary["llm_enhanced"] = False

    ioc_stats = ioc_summary(iocs)

    # Persist to DB
    db = get_db()
    db.execute(
        """INSERT INTO analyses
           (id, title, source_text, created_at, risk_level, risk_score,
            ioc_count, technique_count, rule_count, summary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            analysis_id, title, text[:50_000],
            datetime.utcnow().isoformat(),
            risk["level"], risk["score"],
            ioc_stats["total"], len(techniques),
            sum(len(v) for v in rules.values()),
            json.dumps(summary),
        ),
    )

    # Store IOCs
    for category, items in iocs.items():
        for item in items:
            db.execute(
                "INSERT INTO iocs (analysis_id, type, value, category) VALUES (?, ?, ?, ?)",
                (analysis_id, item["type"], item["value"], category),
            )

    # Store techniques
    for t in techniques:
        db.execute(
            """INSERT INTO techniques
               (analysis_id, technique_id, technique_name, tactic, tactic_id,
                confidence, description, matched_keywords)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                analysis_id, t["technique_id"], t["technique_name"],
                t["tactic"], t.get("tactic_id", ""),
                t["confidence"], t.get("description", ""),
                json.dumps(t.get("matched_keywords", [])),
            ),
        )

    # Store rules
    for rule_type, rule_list in rules.items():
        for rule in rule_list:
            db.execute(
                """INSERT INTO detection_rules
                   (analysis_id, rule_type, rule_name, rule_content)
                   VALUES (?, ?, ?, ?)""",
                (analysis_id, rule_type, rule["name"], rule["content"]),
            )

    db.commit()

    return jsonify({
        "analysis_id": analysis_id,
        "title": title,
        "iocs": iocs,
        "ioc_stats": ioc_stats,
        "techniques": techniques,
        "risk": risk,
        "rules": rules,
        "summary": summary,
        "created_at": datetime.utcnow().isoformat(),
    })


@analysis_bp.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filename = sanitize_filename(secure_filename(file.filename))
    if not allowed_file(filename):
        return jsonify({"error": "Unsupported file type. Allowed: PDF, TXT, DOCX"}), 400

    content = file.read()
    if len(content) > current_app.config["MAX_CONTENT_LENGTH"]:
        return jsonify({"error": "File exceeds 16 MB limit"}), 413

    ext = filename.rsplit(".", 1)[-1].lower()
    try:
        text = parse_file(content, ext)
    except Exception as e:
        return jsonify({"error": f"Failed to parse file: {e}"}), 422

    if len(text) > 500_000:
        text = text[:500_000]

    return jsonify({
        "text": text,
        "filename": filename,
        "char_count": len(text),
    })


@analysis_bp.route("/analyses", methods=["GET"])
def list_analyses():
    db = get_db()
    rows = db.execute(
        """SELECT id, title, created_at, risk_level, risk_score,
                  ioc_count, technique_count, rule_count
           FROM analyses ORDER BY created_at DESC LIMIT 50"""
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@analysis_bp.route("/analyses/<analysis_id>", methods=["GET"])
def get_analysis(analysis_id: str):
    db = get_db()
    analysis = db.execute(
        "SELECT * FROM analyses WHERE id = ?", (analysis_id,)
    ).fetchone()
    if not analysis:
        return jsonify({"error": "Analysis not found"}), 404

    iocs_rows = db.execute(
        "SELECT type, value, category FROM iocs WHERE analysis_id = ?",
        (analysis_id,),
    ).fetchall()

    tech_rows = db.execute(
        """SELECT technique_id, technique_name, tactic, tactic_id,
                  confidence, description, matched_keywords
           FROM techniques WHERE analysis_id = ?""",
        (analysis_id,),
    ).fetchall()

    rule_rows = db.execute(
        "SELECT rule_type, rule_name, rule_content FROM detection_rules WHERE analysis_id = ?",
        (analysis_id,),
    ).fetchall()

    iocs: dict = {"network": [], "file": []}
    for row in iocs_rows:
        iocs[row["category"]].append({"type": row["type"], "value": row["value"]})

    techniques = []
    for row in tech_rows:
        t = dict(row)
        t["matched_keywords"] = json.loads(t.get("matched_keywords") or "[]")
        techniques.append(t)

    rules: dict = {"sigma": [], "yara": [], "snort": []}
    for row in rule_rows:
        rules[row["rule_type"]].append({
            "name": row["rule_name"],
            "content": row["rule_content"],
        })

    row = dict(analysis)
    try:
        summary = json.loads(row.get("summary") or "{}")
    except Exception:
        summary = {}

    # Reconstruct ioc_stats
    all_iocs = iocs["network"] + iocs["file"]
    by_type: dict = {}
    for item in all_iocs:
        by_type[item["type"]] = by_type.get(item["type"], 0) + 1

    ioc_stats = {
        "total": len(all_iocs),
        "network_total": len(iocs["network"]),
        "file_total": len(iocs["file"]),
        "by_type": by_type,
    }

    LEVEL_COLOR = {"Low": "#22C55E", "Medium": "#3B82F6", "High": "#F59E0B", "Critical": "#EF4444"}
    risk_level = row.get("risk_level", "Low") or "Low"
    risk = {
        "score": row.get("risk_score", 0) or 0,
        "level": risk_level,
        "color": LEVEL_COLOR.get(risk_level, "#6B7280"),
        "flags": [],
        "ioc_count": ioc_stats["total"],
        "technique_count": len(techniques),
    }

    return jsonify({
        "analysis_id": analysis_id,
        "title": row.get("title", ""),
        "created_at": row.get("created_at", ""),
        "iocs": iocs,
        "ioc_stats": ioc_stats,
        "techniques": techniques,
        "risk": risk,
        "rules": rules,
        "summary": summary,
    })


@analysis_bp.route("/analyses/<analysis_id>", methods=["DELETE"])
def delete_analysis(analysis_id: str):
    db = get_db()
    db.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
    db.commit()
    return jsonify({"success": True})


@analysis_bp.route("/stats", methods=["GET"])
def get_stats():
    db = get_db()
    total_analyses = db.execute("SELECT COUNT(*) FROM analyses").fetchone()[0]
    total_iocs = db.execute("SELECT COUNT(*) FROM iocs").fetchone()[0]
    total_techniques = db.execute("SELECT COUNT(*) FROM techniques").fetchone()[0]
    total_rules = db.execute("SELECT COUNT(*) FROM detection_rules").fetchone()[0]

    # IOC type breakdown
    ioc_types = db.execute(
        "SELECT type, COUNT(*) as count FROM iocs GROUP BY type ORDER BY count DESC"
    ).fetchall()

    # Tactic breakdown
    tactic_counts = db.execute(
        "SELECT tactic, COUNT(*) as count FROM techniques GROUP BY tactic ORDER BY count DESC"
    ).fetchall()

    # Recent analyses
    recent = db.execute(
        """SELECT id, title, created_at, risk_level, risk_score, ioc_count
           FROM analyses ORDER BY created_at DESC LIMIT 5"""
    ).fetchall()

    # Risk distribution
    risk_dist = db.execute(
        "SELECT risk_level, COUNT(*) as count FROM analyses GROUP BY risk_level"
    ).fetchall()

    return jsonify({
        "total_analyses": total_analyses,
        "total_iocs": total_iocs,
        "total_techniques": total_techniques,
        "total_rules": total_rules,
        "ioc_types": [dict(r) for r in ioc_types],
        "tactic_counts": [dict(r) for r in tactic_counts],
        "recent_analyses": [dict(r) for r in recent],
        "risk_distribution": [dict(r) for r in risk_dist],
    })


def _get_settings() -> dict:
    db = get_db()
    rows = db.execute("SELECT key, value FROM settings").fetchall()
    return {r["key"]: r["value"] for r in rows}
