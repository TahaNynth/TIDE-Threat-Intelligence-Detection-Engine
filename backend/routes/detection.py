from flask import Blueprint, request, jsonify
from models.database import get_db

detection_bp = Blueprint("detection", __name__)


@detection_bp.route("/rules", methods=["GET"])
def list_rules():
    db = get_db()
    analysis_id = request.args.get("analysis_id")
    rule_type = request.args.get("rule_type")

    query = "SELECT id, analysis_id, rule_type, rule_name, rule_content, created_at FROM detection_rules WHERE 1=1"
    params = []
    if analysis_id:
        query += " AND analysis_id = ?"
        params.append(analysis_id)
    if rule_type:
        query += " AND rule_type = ?"
        params.append(rule_type)
    query += " ORDER BY created_at DESC"

    rows = db.execute(query, params).fetchall()
    return jsonify([dict(r) for r in rows])


@detection_bp.route("/rules/stats", methods=["GET"])
def rule_stats():
    db = get_db()
    rows = db.execute(
        "SELECT rule_type, COUNT(*) as count FROM detection_rules GROUP BY rule_type"
    ).fetchall()
    return jsonify([dict(r) for r in rows])
