import json
from flask import Blueprint, request, jsonify, Response
from models.database import get_db

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/reports", methods=["GET"])
def list_reports():
    db = get_db()
    rows = db.execute(
        """SELECT id, title, created_at, risk_level, risk_score,
                  ioc_count, technique_count, rule_count
           FROM analyses ORDER BY created_at DESC"""
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@reports_bp.route("/reports/<analysis_id>/export/iocs", methods=["GET"])
def export_iocs_csv(analysis_id: str):
    db = get_db()
    rows = db.execute(
        "SELECT type, value, category FROM iocs WHERE analysis_id = ?",
        (analysis_id,),
    ).fetchall()

    lines = ["Type,Value,Category"]
    for r in rows:
        lines.append(f'"{r["type"]}","{r["value"]}","{r["category"]}"')

    csv_content = "\n".join(lines)
    return Response(
        csv_content,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=iocs_{analysis_id[:8]}.csv"},
    )


@reports_bp.route("/reports/<analysis_id>/export/json", methods=["GET"])
def export_json(analysis_id: str):
    db = get_db()
    analysis = db.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,)).fetchone()
    if not analysis:
        return jsonify({"error": "Not found"}), 404

    iocs = db.execute(
        "SELECT type, value, category FROM iocs WHERE analysis_id = ?", (analysis_id,)
    ).fetchall()
    techniques = db.execute(
        "SELECT technique_id, technique_name, tactic, confidence FROM techniques WHERE analysis_id = ?",
        (analysis_id,),
    ).fetchall()
    rules = db.execute(
        "SELECT rule_type, rule_name, rule_content FROM detection_rules WHERE analysis_id = ?",
        (analysis_id,),
    ).fetchall()

    export = {
        "analysis_id": analysis_id,
        "title": analysis["title"],
        "created_at": analysis["created_at"],
        "risk_level": analysis["risk_level"],
        "risk_score": analysis["risk_score"],
        "iocs": [dict(r) for r in iocs],
        "techniques": [dict(r) for r in techniques],
        "rules": [dict(r) for r in rules],
    }

    return Response(
        json.dumps(export, indent=2),
        mimetype="application/json",
        headers={"Content-Disposition": f"attachment; filename=analysis_{analysis_id[:8]}.json"},
    )
