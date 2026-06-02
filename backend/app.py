import os
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from models.database import init_db, close_db
from routes.analysis import analysis_bp
from routes.ioc import ioc_bp
from routes.mitre import mitre_bp
from routes.detection import detection_bp
from routes.reports import reports_bp
from routes.settings import settings_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]}},
    )

    with app.app_context():
        init_db()

    app.teardown_appcontext(close_db)

    app.register_blueprint(analysis_bp, url_prefix="/api")
    app.register_blueprint(ioc_bp, url_prefix="/api")
    app.register_blueprint(mitre_bp, url_prefix="/api")
    app.register_blueprint(detection_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api")
    app.register_blueprint(settings_bp, url_prefix="/api")

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({"error": "File too large. Maximum 16 MB."}), 413

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "version": "1.0.0"})

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(debug=True, port=5000, host="0.0.0.0")
