import re

ALLOWED_EXTENSIONS = {"txt", "pdf", "docx"}
MAX_TEXT_LENGTH = 500_000
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16 MB

# Dangerous content that must not be executed
_EXEC_PATTERNS = [
    re.compile(r"<script[\s>]", re.IGNORECASE),
    re.compile(r"javascript:", re.IGNORECASE),
    re.compile(r"on\w+\s*=\s*[\"']", re.IGNORECASE),
]


def allowed_file(filename: str) -> bool:
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[-1].lower()
    return ext in ALLOWED_EXTENSIONS


def validate_text_input(text: str) -> tuple[bool, str]:
    if not text or not text.strip():
        return False, "Report text cannot be empty."
    if len(text) > MAX_TEXT_LENGTH:
        return False, f"Report text exceeds maximum length of {MAX_TEXT_LENGTH:,} characters."
    return True, ""


def sanitize_filename(filename: str) -> str:
    # Remove path components and dangerous characters
    import os
    filename = os.path.basename(filename)
    filename = re.sub(r"[^\w\s.\-]", "_", filename)
    return filename[:128]


def check_for_injection(text: str) -> bool:
    """Returns True if suspicious active content is detected."""
    for pattern in _EXEC_PATTERNS:
        if pattern.search(text):
            return True
    return False
