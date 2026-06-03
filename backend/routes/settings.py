from flask import Blueprint, request, jsonify
from models.database import get_db

settings_bp = Blueprint("settings", __name__)

ALLOWED_KEYS = {
    "llm_provider", "openai_api_key", "gemini_api_key",
    "llm_model", "max_ioc_results",
}

_MASKED = "***configured***"


@settings_bp.route("/settings", methods=["GET"])
def get_settings():
    db = get_db()
    rows = db.execute("SELECT key, value FROM settings").fetchall()
    settings = {r["key"]: r["value"] for r in rows}

    # Return boolean flags instead of sending actual keys to the frontend.
    # This prevents the "masked value overwrites real key" bug.
    settings["openai_configured"] = bool(settings.get("openai_api_key"))
    settings["gemini_configured"] = bool(settings.get("gemini_api_key"))
    settings.pop("openai_api_key", None)
    settings.pop("gemini_api_key", None)

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
        # Never let an empty string or masked placeholder overwrite a real key
        if key in ("openai_api_key", "gemini_api_key") and value in (_MASKED, ""):
            continue
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
            api_key = config.get("openai_api_key", "")
            if not api_key:
                return jsonify({"success": False, "message": "No OpenAI API key saved. Enter it above and save first."})
            client = OpenAI(api_key=api_key)
            client.models.list()
            return jsonify({"success": True, "message": "OpenAI connection successful."})

        if provider == "gemini":
            import google.generativeai as genai
            api_key = config.get("gemini_api_key", "")
            if not api_key:
                return jsonify({"success": False, "message": "No Gemini API key saved. Enter it above and save first."})
            genai.configure(api_key=api_key)
            # Make a real API call to actually verify the key works
            model = genai.GenerativeModel("gemini-1.5-flash")
            model.generate_content("Reply with the single word OK.")
            return jsonify({"success": True, "message": "Gemini API key verified — connection successful."})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

    return jsonify({"success": False, "message": "Unknown provider."})
