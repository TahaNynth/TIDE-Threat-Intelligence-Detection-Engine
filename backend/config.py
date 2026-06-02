import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE = os.getenv("DATABASE_PATH", "database.db")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    UPLOAD_FOLDER = "uploads"
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "none")  # "openai" | "gemini" | "none"
    LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
    SECRET_KEY = os.getenv("SECRET_KEY", "tide-dev-secret")
