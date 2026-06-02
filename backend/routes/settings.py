from flask import Blueprint, request, jsonify
from models.database import get_db

settings_bp = Blueprint("settings", __name__)

ALLOWED_KEYS = {
    "llm_provider", "openai_api_key", "gemini_api_key",
    "llm_model", "max_ioc_results",
}


@settings_bp.route("/settings", methods=["GET"])
def get_settings():
    db = get_db()
    rows = db.execute("SELECT key, value FROM settings").fetchall()
    settings = {r["key"]: r["value"] for r in rows}
    # Mask API keys in response
    for k in ("openai_api_key", "gemini_api_key"):
        if settings.get(k):
            settings[k] = "***configured***"
    return jsonify(settings)


@settings_bp.route("/settings", methods=["PUT"])
def update_settings():
    data = request.get_json(silent=True) or {}
    db = get_db()

    for key, value in data.items():
        if key not in ALLOWED_KEYS:
            continue
        if not isinstance(value, str):
            value = str(value)
        db.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            (key, value),
        )
    db.commit()
    return jsonify({"success": True})


@settings_bp.route("/settings/test-llm", methods=["POST"])
def test_llm():
    db = get_db()
    rows = db.execute("SELECT key, value FROM settings").fetchall()
    config = {r["key"]: r["value"] for r in rows}
    provider = config.get("llm_provider", "none")

    if provider == "none":
        return jsonify({"success": False, "message": "No LLM provider configured."})

    try:
        if provider == "openai":
            from openai import OpenAI
            client = OpenAI(api_key=config.get("openai_api_key", ""))
            client.models.list()
            return jsonify({"success": True, "message": "OpenAI connection successful."})
        if provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=config.get("gemini_api_key", ""))
            return jsonify({"success": True, "message": "Gemini connection successful."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

    return jsonify({"success": False, "message": "Unknown provider."})
