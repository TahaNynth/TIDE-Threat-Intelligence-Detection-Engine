from typing import Dict, List


RANSOMWARE_TECHNIQUES = {"T1486", "T1490", "T1489"}
CREDENTIAL_TECHNIQUES = {"T1003", "T1003.001", "T1110", "T1555", "T1539"}
LATERAL_TECHNIQUES = {"T1021.001", "T1021.002", "T1570", "T1550"}
PRIVILEGE_TECHNIQUES = {"T1548.002", "T1055", "T1068", "T1134"}
PHISHING_TECHNIQUES = {"T1566"}

RANSOMWARE_KEYWORDS = [
    "ransomware", "encrypt", "ransom", "lockbit", "ryuk", "conti", "revil",
    "wannacry", "petya", "darkside", "blackcat",
]
CREDENTIAL_KEYWORDS = [
    "mimikatz", "lsass", "hashdump", "credential dump", "pass-the-hash",
    "password dump", "sekurlsa",
]
PHISHING_KEYWORDS = [
    "phishing", "spear phish", "spearphishing", "credential harvest",
]
DESTRUCTIVE_KEYWORDS = [
    "wiper", "destroy data", "delete backup", "shadow copy",
]


def calculate_risk(iocs: Dict, techniques: List[Dict], text: str) -> Dict:
    score = 0
    flags = []

    # --- IOC volume ---
    total_iocs = sum(len(v) for v in iocs.values())
    if total_iocs >= 30:
        score += 20
    elif total_iocs >= 15:
        score += 15
    elif total_iocs >= 5:
        score += 10
    elif total_iocs > 0:
        score += 5

    # --- Network IOC specifics (C2 indicators carry higher weight) ---
    network = iocs.get("network", [])
    ip_count = sum(1 for i in network if "IPv4" in i["type"])
    if ip_count >= 5:
        score += 8
    elif ip_count > 0:
        score += 4

    # --- Technique volume ---
    t_count = len(techniques)
    if t_count >= 10:
        score += 20
    elif t_count >= 6:
        score += 15
    elif t_count >= 3:
        score += 10
    elif t_count > 0:
        score += 5

    # --- High-risk technique categories ---
    tech_ids = {t["technique_id"] for t in techniques}
    high_conf_ids = {t["technique_id"] for t in techniques if t["confidence"] == "High"}

    if tech_ids & RANSOMWARE_TECHNIQUES:
        score += 20
        flags.append("Ransomware indicators detected")
    if tech_ids & CREDENTIAL_TECHNIQUES:
        score += 15
        flags.append("Credential theft techniques identified")
    if tech_ids & LATERAL_TECHNIQUES:
        score += 10
        flags.append("Lateral movement activity detected")
    if tech_ids & PRIVILEGE_TECHNIQUES:
        score += 8
        flags.append("Privilege escalation techniques observed")
    if tech_ids & PHISHING_TECHNIQUES:
        score += 5
        flags.append("Phishing-based initial access detected")

    # --- Keyword-based boosts ---
    text_lower = text.lower()
    if any(kw in text_lower for kw in RANSOMWARE_KEYWORDS):
        score += 10
        if "Ransomware indicators detected" not in flags:
            flags.append("Ransomware language identified in report")
    if any(kw in text_lower for kw in CREDENTIAL_KEYWORDS):
        score += 5
        if "Credential theft techniques identified" not in flags:
            flags.append("Credential dumping tools mentioned")
    if any(kw in text_lower for kw in DESTRUCTIVE_KEYWORDS):
        score += 8
        flags.append("Destructive/wiper capabilities mentioned")

    # --- High confidence technique bonus ---
    if len(high_conf_ids) >= 5:
        score += 5

    score = min(score, 100)

    if score >= 75:
        level = "Critical"
        color = "#EF4444"
    elif score >= 50:
        level = "High"
        color = "#F59E0B"
    elif score >= 25:
        level = "Medium"
        color = "#3B82F6"
    else:
        level = "Low"
        color = "#22C55E"

    return {
        "score": score,
        "level": level,
        "color": color,
        "flags": flags,
        "ioc_count": total_iocs,
        "technique_count": t_count,
    }
