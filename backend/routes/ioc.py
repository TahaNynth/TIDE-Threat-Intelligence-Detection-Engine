from flask import Blueprint, request, jsonify
from models.database import get_db

ioc_bp = Blueprint("ioc", __name__)


@ioc_bp.route("/iocs", methods=["GET"])
def list_iocs():
    db = get_db()
    analysis_id = request.args.get("analysis_id")
    ioc_type = request.args.get("type")
    category = request.args.get("category")
    search = request.args.get("search", "").strip()
    limit = min(int(request.args.get("limit", 200)), 500)
    offset = int(request.args.get("offset", 0))

    query = "SELECT id, analysis_id, type, value, category, created_at FROM iocs WHERE 1=1"
    params = []

    if analysis_id:
        query += " AND analysis_id = ?"
        params.append(analysis_id)
    if ioc_type:
        query += " AND type = ?"
        params.append(ioc_type)
    if category:
        query += " AND category = ?"
        params.append(category)
    if search:
        query += " AND value LIKE ?"
        params.append(f"%{search}%")

    count_query = query.replace(
        "SELECT id, analysis_id, type, value, category, created_at", "SELECT COUNT(*)"
    )
    total = db.execute(count_query, params).fetchone()[0]

    query += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = db.execute(query, params).fetchall()
    return jsonify({
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [dict(r) for r in rows],
    })


@ioc_bp.route("/iocs/types", methods=["GET"])
def ioc_types():
    db = get_db()
    rows = db.execute(
        "SELECT type, COUNT(*) as count FROM iocs GROUP BY type ORDER BY count DESC"
    ).fetchall()
    return jsonify([dict(r) for r in rows])
