from flask import Blueprint, request, jsonify
from models.database import get_db

mitre_bp = Blueprint("mitre", __name__)


@mitre_bp.route("/techniques", methods=["GET"])
def list_techniques():
    db = get_db()
    analysis_id = request.args.get("analysis_id")
    tactic = request.args.get("tactic")
    confidence = request.args.get("confidence")
    search = request.args.get("search", "").strip()

    query = """SELECT technique_id, technique_name, tactic, tactic_id,
                      confidence, description, matched_keywords
               FROM techniques WHERE 1=1"""
    params = []

    if analysis_id:
        query += " AND analysis_id = ?"
        params.append(analysis_id)
    if tactic:
        query += " AND tactic = ?"
        params.append(tactic)
    if confidence:
        query += " AND confidence = ?"
        params.append(confidence)
    if search:
        query += " AND (technique_name LIKE ? OR technique_id LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY confidence, technique_id"

    import json
    rows = db.execute(query, params).fetchall()
    result = []
    for r in rows:
        row = dict(r)
        try:
            row["matched_keywords"] = json.loads(row.get("matched_keywords") or "[]")
        except Exception:
            row["matched_keywords"] = []
        result.append(row)

    return jsonify(result)


@mitre_bp.route("/tactics", methods=["GET"])
def list_tactics():
    db = get_db()
    rows = db.execute(
        "SELECT tactic, COUNT(*) as count FROM techniques GROUP BY tactic ORDER BY count DESC"
    ).fetchall()
    return jsonify([dict(r) for r in rows])
