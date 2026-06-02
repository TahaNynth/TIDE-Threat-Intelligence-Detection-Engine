import uuid
from datetime import date
from typing import Dict, List


TODAY = date.today().strftime("%Y/%m/%d")


def generate_rules(iocs: Dict, techniques: List[Dict], title: str) -> Dict:
    analysis_id = str(uuid.uuid4())[:8]
    sigma_rules = _generate_sigma(iocs, techniques, title, analysis_id)
    yara_rules = _generate_yara(iocs, techniques, title, analysis_id)
    snort_rules = _generate_snort(iocs, title, analysis_id)

    return {
        "sigma": sigma_rules,
        "yara": yara_rules,
        "snort": snort_rules,
    }


# ---------------------------------------------------------------------------
# Sigma
# ---------------------------------------------------------------------------

def _sigma_safe_title(s: str) -> str:
    return "".join(c if c.isalnum() or c in " -_" else "" for c in s)[:60]


def _generate_sigma(iocs: Dict, techniques: List[Dict], title: str, aid: str) -> List[Dict]:
    rules = []
    network = iocs.get("network", [])
    file_ = iocs.get("file", [])

    ips = [i["value"] for i in network if "IPv4" in i["type"]][:10]
    domains = [i["value"] for i in network if i["type"] == "Domain"][:10]
    hashes = [i["value"] for i in file_ if i["type"] in ("MD5", "SHA256", "SHA1")][:8]
    urls = [i["value"] for i in network if i["type"] == "URL"][:6]

    tags = []
    for t in techniques[:6]:
        tac = t["tactic"].lower().replace(" ", "_")
        tags.append(f"    - attack.{tac}")
        tags.append(f"    - attack.{t['technique_id'].lower()}")
    tags_str = "\n".join(tags) if tags else "    - attack.unknown"

    safe_title = _sigma_safe_title(title)

    # --- Network connection rule ---
    if ips or domains:
        conditions = []
        detection_lines = []
        if ips:
            detection_lines.append("    ip_selection:")
            for ip in ips:
                detection_lines.append(f"        DestinationIp: '{ip}'")
            conditions.append("ip_selection")
        if domains:
            detection_lines.append("    domain_selection:")
            for d in domains:
                detection_lines.append(f"        DestinationHostname|contains: '{d}'")
            conditions.append("domain_selection")
        condition = " or ".join(conditions)

        rule_content = f"""title: '{safe_title} - Network IOC Detection'
id: {str(uuid.uuid4())}
status: experimental
description: >
    Detects network connections to indicators of compromise identified
    in the threat report: {safe_title}
references:
    - Internal analysis {aid}
author: TIDE
date: {TODAY}
modified: {TODAY}
tags:
{tags_str}
    - detection.threat_intel
logsource:
    category: network_connection
    product: windows
detection:
{chr(10).join(detection_lines)}
    condition: {condition}
falsepositives:
    - Legitimate business traffic to these destinations
level: high
"""
        rules.append({"name": f"{safe_title} - Network IOC", "content": rule_content})

    # --- Process creation / hash rule ---
    if hashes:
        hash_lines = []
        for h in hashes:
            if len(h) == 32:
                hash_lines.append(f"        Hashes|contains: 'MD5={h}'")
            elif len(h) == 40:
                hash_lines.append(f"        Hashes|contains: 'SHA1={h}'")
            elif len(h) == 64:
                hash_lines.append(f"        Hashes|contains: 'SHA256={h}'")

        rule_content = f"""title: '{safe_title} - Malicious File Hash Detection'
id: {str(uuid.uuid4())}
status: experimental
description: >
    Detects execution of files matching known malicious hashes extracted
    from: {safe_title}
references:
    - Internal analysis {aid}
author: TIDE
date: {TODAY}
modified: {TODAY}
tags:
{tags_str}
logsource:
    category: process_creation
    product: windows
detection:
    hash_selection:
{chr(10).join(hash_lines)}
    condition: hash_selection
falsepositives:
    - None expected
level: critical
"""
        rules.append({"name": f"{safe_title} - File Hashes", "content": rule_content})

    # --- Technique-based behavioral rules ---
    for tech in techniques[:3]:
        rule_content = _technique_sigma_rule(tech, safe_title, tags_str, aid)
        if rule_content:
            rules.append({"name": f"{tech['technique_id']} - {tech['technique_name']}", "content": rule_content})

    if not rules:
        rules.append({
            "name": f"{safe_title} - Generic Threat Detection",
            "content": _generic_sigma(safe_title, tags_str, aid),
        })

    return rules


def _technique_sigma_rule(tech: Dict, report_title: str, tags: str, aid: str) -> str:
    tid = tech["technique_id"]
    tname = tech["technique_name"]

    templates = {
        "T1059.001": f"""title: 'Suspicious PowerShell Execution - {report_title}'
id: {uuid.uuid4()}
status: experimental
description: Detects suspicious PowerShell patterns associated with {tname}
author: TIDE
date: {TODAY}
tags:
{tags}
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        Image|endswith: '\\\\powershell.exe'
        CommandLine|contains:
            - '-EncodedCommand'
            - '-enc '
            - 'IEX'
            - 'Invoke-Expression'
            - 'DownloadString'
            - 'FromBase64String'
            - '-nop -w hidden'
    condition: selection
falsepositives:
    - Legitimate administrative scripts
level: high
""",
        "T1003": f"""title: 'Credential Dumping Activity - {report_title}'
id: {uuid.uuid4()}
status: experimental
description: Detects credential dumping tools associated with {tname}
author: TIDE
date: {TODAY}
tags:
{tags}
logsource:
    category: process_creation
    product: windows
detection:
    selection_tools:
        Image|endswith:
            - '\\\\mimikatz.exe'
            - '\\\\procdump.exe'
            - '\\\\wce.exe'
    selection_lsass:
        TargetImage|endswith: '\\\\lsass.exe'
        GrantedAccess: '0x1010'
    condition: selection_tools or selection_lsass
falsepositives:
    - Legitimate security scanning tools
level: critical
""",
        "T1486": f"""title: 'Ransomware - File Encryption Activity - {report_title}'
id: {uuid.uuid4()}
status: experimental
description: Detects ransomware file encryption behavior associated with {tname}
author: TIDE
date: {TODAY}
tags:
{tags}
logsource:
    category: process_creation
    product: windows
detection:
    selection_vss:
        CommandLine|contains:
            - 'vssadmin delete shadows'
            - 'wbadmin delete'
            - 'bcdedit /set recoveryenabled no'
    selection_ransom_ext:
        TargetFilename|endswith:
            - '.locked'
            - '.encrypted'
            - '.crypted'
            - '.ransom'
    condition: selection_vss or selection_ransom_ext
falsepositives:
    - Legitimate disk management operations
level: critical
""",
        "T1021.001": f"""title: 'Suspicious RDP Lateral Movement - {report_title}'
id: {uuid.uuid4()}
status: experimental
description: Detects RDP-based lateral movement identified in {tname}
author: TIDE
date: {TODAY}
tags:
{tags}
logsource:
    product: windows
    service: security
detection:
    selection:
        EventID: 4648
        TargetServerName|endswith: '.rdp'
    selection_new_rdp:
        EventID: 4624
        LogonType: 10
    condition: selection or selection_new_rdp
falsepositives:
    - Legitimate remote administration
level: medium
""",
    }

    # Try exact match, then parent ID (T1003.001 → T1003)
    rule = templates.get(tid) or templates.get(tid.split(".")[0])
    return rule or ""


def _generic_sigma(title: str, tags: str, aid: str) -> str:
    return f"""title: '{title} - Threat Intelligence Detection'
id: {uuid.uuid4()}
status: experimental
description: >
    Generic detection rule generated from threat intelligence report.
    Review matched keywords and adapt conditions to your environment.
references:
    - Internal analysis {aid}
author: TIDE
date: {TODAY}
tags:
{tags}
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        CommandLine|contains:
            - 'mimikatz'
            - 'meterpreter'
            - 'cobalt strike'
            - 'powershell -enc'
    condition: selection
falsepositives:
    - Security testing tools in authorized red team exercises
level: high
"""


# ---------------------------------------------------------------------------
# YARA
# ---------------------------------------------------------------------------

def _generate_yara(iocs: Dict, techniques: List[Dict], title: str, aid: str) -> List[Dict]:
    rules = []
    file_ = iocs.get("file", [])
    network = iocs.get("network", [])

    hashes = [i for i in file_ if i["type"] in ("MD5", "SHA256", "SHA1")]
    domains = [i["value"] for i in network if i["type"] == "Domain"][:8]
    ips = [i["value"] for i in network if i["type"] == "IPv4"][:8]
    urls = [i["value"] for i in network if i["type"] == "URL"][:5]

    rule_name = "".join(c if c.isalnum() or c == "_" else "_" for c in title)[:40]

    # Hash rule
    if hashes:
        hash_lines = []
        for idx, h in enumerate(hashes[:15]):
            hash_lines.append(f'        $hash_{idx} = "{h}"  // {h["type"]}')

        content = f"""rule {rule_name}_FileHashes
{{
    meta:
        description = "Detects files matching IOC hashes from: {title}"
        author      = "TIDE"
        date        = "{TODAY}"
        analysis_id = "{aid}"
        reference   = "Internal CTI analysis"

    strings:
        // Hashes are checked programmatically — add string patterns below
{chr(10).join(f'        $h{i} = "{h["value"]}" ascii wide' for i, h in enumerate(hashes[:10]))}

    condition:
        any of them
}}
"""
        rules.append({"name": f"{rule_name} - File Hashes", "content": content})

    # Network indicators rule
    if domains or ips:
        string_defs = []
        for idx, d in enumerate(domains):
            string_defs.append(f'        $domain_{idx} = "{d}" ascii wide nocase')
        for idx, ip in enumerate(ips):
            string_defs.append(f'        $ip_{idx}     = "{ip}" ascii')
        for idx, url in enumerate(urls):
            safe_url = url[:80]
            string_defs.append(f'        $url_{idx}    = "{safe_url}" ascii nocase')

        content = f"""rule {rule_name}_NetworkIndicators
{{
    meta:
        description = "Detects network artifacts from: {title}"
        author      = "TIDE"
        date        = "{TODAY}"
        analysis_id = "{aid}"

    strings:
{chr(10).join(string_defs)}

    condition:
        any of them
}}
"""
        rules.append({"name": f"{rule_name} - Network Indicators", "content": content})

    # Behavioral YARA for common techniques
    for tech in techniques[:2]:
        behavioral = _behavioral_yara(tech, rule_name, TODAY, aid)
        if behavioral:
            rules.append({"name": f"{rule_name}_{tech['technique_id'].replace('.', '_')}", "content": behavioral})

    if not rules:
        content = f"""rule {rule_name}_GenericThreat
{{
    meta:
        description = "Generic IOC rule for: {title}"
        author      = "TIDE"
        date        = "{TODAY}"

    strings:
        $s1 = "cmd.exe /c" ascii nocase
        $s2 = "powershell -enc" ascii nocase
        $s3 = "mimikatz" ascii nocase wide
        $s4 = "meterpreter" ascii nocase

    condition:
        2 of them
}}
"""
        rules.append({"name": f"{rule_name} - Generic", "content": content})

    return rules


def _behavioral_yara(tech: Dict, rule_prefix: str, today: str, aid: str) -> str:
    tid = tech["technique_id"]
    tname = tech["technique_name"]
    rule_id = tid.replace(".", "_")

    templates = {
        "T1059.001": f"""rule {rule_prefix}_PowerShellObfuscation
{{
    meta:
        description = "Detects obfuscated PowerShell execution - {tname}"
        author      = "TIDE"
        date        = "{today}"

    strings:
        $enc1 = "-EncodedCommand" ascii nocase wide
        $enc2 = "-enc " ascii nocase
        $iex  = "Invoke-Expression" ascii nocase wide
        $b64  = "FromBase64String" ascii nocase
        $dl   = "DownloadString" ascii nocase wide
        $bypass = "Bypass" ascii nocase

    condition:
        2 of ($enc*, $iex, $b64, $dl, $bypass)
}}
""",
        "T1003": f"""rule {rule_prefix}_CredentialDumping
{{
    meta:
        description = "Detects credential dumping tools - {tname}"
        author      = "TIDE"
        date        = "{today}"

    strings:
        $mimi1 = "mimikatz" ascii nocase wide
        $mimi2 = "sekurlsa" ascii nocase
        $mimi3 = "lsadump" ascii nocase
        $mimi4 = "privilege::debug" ascii nocase
        $wce   = "WCE" ascii
        $dump  = "hashdump" ascii nocase

    condition:
        any of them
}}
""",
        "T1486": f"""rule {rule_prefix}_Ransomware
{{
    meta:
        description = "Detects ransomware behavioral patterns - {tname}"
        author      = "TIDE"
        date        = "{today}"

    strings:
        $vss1 = "vssadmin" ascii nocase wide
        $vss2 = "delete shadows" ascii nocase
        $bcde = "bcdedit" ascii nocase
        $wba  = "wbadmin delete" ascii nocase
        $note1 = "your files have been encrypted" ascii nocase wide
        $note2 = "pay ransom" ascii nocase wide
        $note3 = "bitcoin" ascii nocase wide
        $ext1 = ".encrypted" ascii wide
        $ext2 = ".locked" ascii wide

    condition:
        2 of ($vss*, $bcde, $wba) or 2 of ($note*) or (1 of ($vss*, $bcde) and 1 of ($ext*))
}}
""",
    }

    return templates.get(tid) or templates.get(tid.split(".")[0], "")


# ---------------------------------------------------------------------------
# Snort
# ---------------------------------------------------------------------------

def _generate_snort(iocs: Dict, title: str, aid: str) -> List[Dict]:
    rules = []
    network = iocs.get("network", [])
    sid_base = 9000000 + int(aid[:4], 16) % 9999

    ips = [i["value"] for i in network if i["type"] == "IPv4"][:10]
    domains = [i["value"] for i in network if i["type"] == "Domain"][:8]
    urls = [i["value"] for i in network if i["type"] == "URL"][:5]

    safe_msg = title.replace('"', "'")[:60]

    lines = [
        f"# Snort rules generated by TIDE",
        f"# Report: {title}",
        f"# Date:   {TODAY}",
        f"# Analysis ID: {aid}",
        "",
    ]

    for idx, ip in enumerate(ips):
        sid = sid_base + idx
        lines.append(
            f'alert ip any any -> {ip} any '
            f'(msg:"T2D - {safe_msg} - Known Malicious IP {ip}"; '
            f'classtype:trojan-activity; sid:{sid}; rev:1;)'
        )
        lines.append(
            f'alert ip {ip} any -> any any '
            f'(msg:"T2D - {safe_msg} - C2 Callback from {ip}"; '
            f'classtype:trojan-activity; sid:{sid + 500}; rev:1;)'
        )

    for idx, domain in enumerate(domains):
        sid = sid_base + 1000 + idx
        escaped = domain.replace(".", "\\x2e")
        lines.append(
            f'alert dns any any -> any 53 '
            f'(msg:"T2D - {safe_msg} - Malicious Domain {domain}"; '
            f'dns.query; content:"{domain}"; nocase; '
            f'classtype:trojan-activity; sid:{sid}; rev:1;)'
        )
        lines.append(
            f'alert http any any -> any $HTTP_PORTS '
            f'(msg:"T2D - {safe_msg} - HTTP to Malicious Domain {domain}"; '
            f'http.host; content:"{domain}"; nocase; '
            f'classtype:trojan-activity; sid:{sid + 500}; rev:1;)'
        )

    for idx, url in enumerate(urls):
        sid = sid_base + 2000 + idx
        path = url.split("/", 3)[-1][:50] if "/" in url else url[:50]
        safe_path = path.replace('"', '\\"')
        lines.append(
            f'alert http any any -> any $HTTP_PORTS '
            f'(msg:"T2D - {safe_msg} - Malicious URL"; '
            f'http.uri; content:"/{safe_path}"; nocase; '
            f'classtype:trojan-activity; sid:{sid}; rev:1;)'
        )

    if len(lines) <= 5:
        lines.extend([
            f'alert tcp any any -> $EXTERNAL_NET $HTTP_PORTS '
            f'(msg:"T2D - {safe_msg} - Suspicious Outbound Connection"; '
            f'flags:S; threshold: type both, track by_src, count 20, seconds 60; '
            f'classtype:trojan-activity; sid:{sid_base + 9000}; rev:1;)',
        ])

    content = "\n".join(lines)
    rules.append({"name": f"{title[:40]} - Snort Rules", "content": content})
    return rules
