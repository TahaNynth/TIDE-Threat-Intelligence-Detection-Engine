"""Optional LLM enhancement — gracefully degrades when no API key is set."""
from typing import Dict


def enhance_summary(summary: Dict, text: str, config: Dict) -> Dict:
    provider = config.get("llm_provider", "none")
    if provider == "openai":
        return _enhance_openai(summary, text, config)
    if provider == "gemini":
        return _enhance_gemini(summary, text, config)
    return summary


def _enhance_openai(summary: Dict, text: str, config: Dict) -> Dict:
    try:
        from openai import OpenAI

        api_key = config.get("openai_api_key", "")
        if not api_key:
            return summary

        client = OpenAI(api_key=api_key)
        model = config.get("llm_model", "gpt-4o-mini")

        system = (
            "You are an expert cybersecurity analyst specializing in threat intelligence. "
            "Rewrite the provided executive summary to be more professional, concise, and actionable. "
            "Keep it under 3 paragraphs. Do not hallucinate new facts."
        )
        user = (
            f"Original executive summary:\n{summary['executive_summary']}\n\n"
            f"Threat overview context:\n"
            f"Risk level: {summary['threat_overview']['risk_level']}\n"
            f"Main threat: {summary['threat_overview']['main_threat']}\n"
            f"Tactics: {', '.join(summary['threat_overview']['tactics_observed'][:4])}"
        )

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=600,
            temperature=0.3,
        )
        enhanced = response.choices[0].message.content.strip()
        summary["executive_summary"] = enhanced
        summary["llm_enhanced"] = True
        summary["llm_provider"] = "openai"
        return summary
    except Exception as e:
        summary["llm_error"] = str(e)
        return summary


def _enhance_gemini(summary: Dict, text: str, config: Dict) -> Dict:
    try:
        import google.generativeai as genai

        api_key = config.get("gemini_api_key", "")
        if not api_key:
            return summary

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = (
            "You are a cybersecurity analyst. Rewrite this executive summary professionally "
            "in under 3 paragraphs. Do not add facts not present in the original.\n\n"
            f"Original:\n{summary['executive_summary']}\n\n"
            f"Risk: {summary['threat_overview']['risk_level']}\n"
            f"Threat: {summary['threat_overview']['main_threat']}"
        )

        response = model.generate_content(prompt)
        enhanced = response.text.strip()
        summary["executive_summary"] = enhanced
        summary["llm_enhanced"] = True
        summary["llm_provider"] = "gemini"
        return summary
    except Exception as e:
        summary["llm_error"] = str(e)
        return summary
