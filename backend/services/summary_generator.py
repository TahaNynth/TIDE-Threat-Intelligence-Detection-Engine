from datetime import date
from typing import Dict, List

TODAY = date.today().strftime("%B %d, %Y")


def generate_summary(text: str, iocs: Dict, techniques: List[Dict], risk: Dict) -> Dict:
    """Generate a deterministic analyst summary. Upgrades via LLM if configured."""

    network = iocs.get("network", [])
    file_ = iocs.get("file", [])
    total_iocs = risk.get("ioc_count", 0)
    risk_level = risk.get("level", "Unknown")
    technique_count = len(techniques)

    tactics_found = list({t["tactic"] for t in techniques})
    top_techniques = [f"{t['technique_id']} ({t['technique_name']})" for t in techniques[:5]]

    # --- Threat actor identification (keyword scanning) ---
    threat_actor = _identify_threat_actor(text)
    target_sectors = _identify_targets(text)
    attack_type = _identify_attack_type(techniques, text)

    # --- Executive summary paragraph ---
    exec_summary = _build_executive_summary(
        risk_level, attack_type, threat_actor, target_sectors,
        total_iocs, technique_count, tactics_found,
    )

    # --- Threat overview ---
    threat_overview = {
        "main_threat": attack_type,
        "targeted_assets": target_sectors if target_sectors else ["General enterprise infrastructure"],
        "risk_level": risk_level,
        "threat_actor": threat_actor or "Unknown Threat Actor",
        "tactics_observed": tactics_found,
        "top_techniques": top_techniques,
        "ioc_breakdown": {
            "network": len(network),
            "file": len(file_),
        },
    }

    # --- Recommendations ---
    recommendations = _build_recommendations(techniques, iocs, text, risk_level)

    return {
        "executive_summary": exec_summary,
        "threat_overview": threat_overview,
        "recommendations": recommendations,
        "generated_at": TODAY,
        "llm_enhanced": False,
    }


def _identify_threat_actor(text: str) -> str:
    actors = {
        "APT28": ["apt28", "fancy bear", "sofacy", "cozy bear"],
        "APT29": ["apt29", "cozy bear", "the dukes", "nobelium"],
        "Lazarus Group": ["lazarus", "hidden cobra", "bluenoroff"],
        "FIN7": ["fin7", "carbanak"],
        "REvil": ["revil", "sodinokibi"],
        "LockBit": ["lockbit"],
        "Conti": ["conti group"],
        "BlackCat": ["blackcat", "alphv"],
        "Ryuk": ["ryuk"],
        "DarkSide": ["darkside"],
        "Emotet": ["emotet"],
        "TrickBot": ["trickbot"],
        "Cobalt Group": ["cobalt group", "cobalt gang"],
    }
    text_lower = text.lower()
    for actor, keywords in actors.items():
        if any(kw in text_lower for kw in keywords):
            return actor
    return ""


def _identify_targets(text: str) -> List[str]:
    sectors = {
        "Financial institutions": ["bank", "financial", "fintech", "payment", "swift"],
        "Healthcare organizations": ["hospital", "healthcare", "medical", "pharmaceutical", "clinic"],
        "Government agencies": ["government", "federal", "ministry", "agency", "nato", "military"],
        "Critical infrastructure": ["power grid", "energy", "utility", "water", "scada", "ics"],
        "Manufacturing sector": ["manufacturing", "factory", "industrial", "ics", "plc"],
        "Retail and e-commerce": ["retail", "ecommerce", "e-commerce", "pos", "point of sale"],
        "Technology companies": ["software", "tech company", "saas", "cloud provider"],
        "Educational institutions": ["university", "college", "school", "education"],
        "Telecommunications": ["telecom", "isp", "carrier", "network provider"],
    }
    text_lower = text.lower()
    found = []
    for sector, keywords in sectors.items():
        if any(kw in text_lower for kw in keywords):
            found.append(sector)
    return found[:4]


def _identify_attack_type(techniques: List[Dict], text: str) -> str:
    text_lower = text.lower()
    tech_ids = {t["technique_id"] for t in techniques}

    if any(kw in text_lower for kw in ["ransomware", "encrypt files", "ransom demand"]):
        return "Ransomware Attack"
    if any(kw in text_lower for kw in ["apt", "advanced persistent"]):
        return "Advanced Persistent Threat (APT) Campaign"
    if any(kw in text_lower for kw in ["supply chain", "trojanized software"]):
        return "Supply Chain Attack"
    if any(kw in text_lower for kw in ["phishing", "spear phish"]):
        return "Phishing / Social Engineering Campaign"
    if "T1498" in tech_ids:
        return "Distributed Denial of Service (DDoS) Attack"
    if any(kw in text_lower for kw in ["data breach", "exfiltration", "data theft"]):
        return "Data Breach / Exfiltration Campaign"
    if any(kw in text_lower for kw in ["espionage", "intelligence gathering", "collection"]):
        return "Cyber Espionage Campaign"
    if any(kw in text_lower for kw in ["banking", "financial fraud", "credential"]):
        return "Financial Fraud / Banking Trojan Campaign"
    if techniques:
        return "Multi-Stage Intrusion Campaign"
    return "Unclassified Threat Activity"


def _build_executive_summary(
    risk_level, attack_type, threat_actor, target_sectors,
    total_iocs, technique_count, tactics,
) -> str:
    actor_phrase = f"attributed to {threat_actor}" if threat_actor else "attributed to an unidentified threat actor"
    sector_phrase = (
        f"targeting {', '.join(target_sectors[:2])}"
        if target_sectors
        else "with broad targeting observed"
    )
    tactic_phrase = (
        f"spanning {', '.join(tactics[:3])}"
        if tactics
        else "employing multiple adversarial tactics"
    )

    para1 = (
        f"This analysis has identified a {risk_level.upper()}-severity {attack_type} "
        f"{actor_phrase}, {sector_phrase}. "
        f"The report yielded {total_iocs} indicator(s) of compromise across network "
        f"and file-based categories, alongside {technique_count} MITRE ATT&CK technique(s) "
        f"{tactic_phrase}. "
        f"These findings indicate a {'highly sophisticated and coordinated' if risk_level in ('High', 'Critical') else 'notable'} "
        f"adversarial operation requiring immediate analyst attention."
    )

    para2 = (
        f"Security teams should prioritize blocking the extracted network indicators "
        f"at the perimeter, deploying the generated detection rules across relevant "
        f"log sources, and conducting a retrospective hunt for the identified ATT&CK "
        f"techniques within their environment. "
        f"{'Incident response procedures should be initiated immediately given the critical risk posture.' if risk_level == 'Critical' else 'Continuous monitoring and threat hunting are recommended.'}"
    )

    return f"{para1}\n\n{para2}"


def _build_recommendations(
    techniques: List[Dict], iocs: Dict, text: str, risk_level: str
) -> List[str]:
    recs = []
    tech_ids = {t["technique_id"] for t in techniques}
    network = iocs.get("network", [])
    file_ = iocs.get("file", [])
    text_lower = text.lower()

    # Priority blocking
    ips = [i["value"] for i in network if i["type"] == "IPv4"]
    domains = [i["value"] for i in network if i["type"] == "Domain"]
    if ips:
        recs.append(f"Block {len(ips)} extracted IP address(es) at the network perimeter and SIEM immediately.")
    if domains:
        recs.append(f"Add {len(domains)} malicious domain(s) to DNS sinkhole or firewall deny lists.")

    # Hash-based
    hashes = [i for i in file_ if i["type"] in ("MD5", "SHA256", "SHA1")]
    if hashes:
        recs.append(f"Deploy {len(hashes)} file hash(es) as IOCs in EDR and AV platforms for detection and blocking.")

    # Technique-specific
    if tech_ids & {"T1003", "T1003.001"}:
        recs.append("Enable LSA Protection (RunAsPPL) to prevent LSASS memory dumping.")
        recs.append("Audit privileged account usage and enforce Privileged Access Workstations (PAW).")
    if tech_ids & {"T1059.001"}:
        recs.append("Restrict PowerShell execution via constrained language mode and signed script enforcement.")
        recs.append("Enable PowerShell Script Block Logging (Event ID 4104) for full script visibility.")
    if tech_ids & {"T1486"}:
        recs.append("Ensure offline, immutable backups are in place and test restoration procedures immediately.")
        recs.append("Deploy canary files to detect early-stage file encryption attempts.")
    if tech_ids & {"T1021.001", "T1021.002"}:
        recs.append("Restrict RDP and SMB access; enforce Network Level Authentication (NLA) for RDP.")
        recs.append("Monitor for unusual lateral movement patterns using network detection solutions.")
    if tech_ids & {"T1566"}:
        recs.append("Enforce email filtering with sandboxed attachment analysis and anti-spoofing policies.")
    if tech_ids & {"T1547.001"}:
        recs.append("Monitor registry Run/RunOnce keys for unauthorized modifications.")
    if tech_ids & {"T1070"}:
        recs.append("Centralize log collection to a SIEM to prevent attacker-side log deletion.")

    # Generic always-applicable
    recs.append("Deploy the generated Sigma rules across your SIEM for immediate detection coverage.")
    recs.append("Conduct a threat hunt across historical logs for the identified ATT&CK techniques.")

    if risk_level in ("High", "Critical"):
        recs.append("Initiate incident response procedures and isolate potentially compromised systems.")
        recs.append("Notify stakeholders and consider engaging a DFIR team for full investigation.")

    recs.append("Share extracted IOCs with trusted intelligence-sharing communities (ISAC, MISP).")

    return recs[:12]
