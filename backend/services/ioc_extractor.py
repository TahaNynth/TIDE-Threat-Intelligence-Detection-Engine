import re
import ipaddress
from typing import Dict, List


_COMMON_FP_DOMAINS = {
    "microsoft.com", "windows.com", "google.com", "github.com", "youtube.com",
    "example.com", "localhost", "cloudflare.com", "amazonaws.com", "azure.com",
    "office.com", "outlook.com", "live.com", "bing.com", "msn.com", "yahoo.com",
    "gmail.com", "apple.com", "icloud.com", "trustedsec.com", "sans.org",
    "mitre.org", "cisa.gov", "nist.gov",
}

PATTERNS = {
    "ipv4": re.compile(
        r"\b((?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))\b"
    ),
    "ipv6": re.compile(
        r"\b([0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){7})\b"
    ),
    "url": re.compile(
        r"(https?://[^\s<>\"'{}|\\\^`\[\]]{4,})",
        re.IGNORECASE,
    ),
    "email": re.compile(
        r"\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b"
    ),
    "domain": re.compile(
        r"\b((?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.){1,5}"
        r"(?:com|net|org|edu|gov|mil|int|io|co|uk|de|fr|ru|cn|nl|eu|info|biz"
        r"|name|pro|xyz|site|online|store|tech|app|dev|club|space|live|top"
        r"|pw|cc|to|me|us|ca|au|jp|br|in|it|es|pl|se|ch|be|at|dk|fi|no|pt"
        r"|nz|za|sg|hk|tw|kr|mx|ar|cl|pe|vn|id|th|ph|my|pk|bd|ng|gh|ke"
        r"|onion))\b",
        re.IGNORECASE,
    ),
    "md5": re.compile(r"\b([a-fA-F0-9]{32})\b"),
    "sha1": re.compile(r"\b([a-fA-F0-9]{40})\b"),
    "sha256": re.compile(r"\b([a-fA-F0-9]{64})\b"),
}

TLDS = {
    "com", "net", "org", "edu", "gov", "mil", "int", "io", "co", "uk", "de",
    "fr", "ru", "cn", "nl", "eu", "info", "biz", "name", "pro", "xyz", "site",
    "online", "store", "tech", "app", "dev", "club", "space", "live", "top",
    "pw", "cc", "to", "me", "us", "ca", "au", "jp", "br", "in", "it", "es",
    "pl", "se", "ch", "be", "at", "dk", "fi", "no", "pt", "nz", "za", "sg",
    "hk", "tw", "kr", "mx", "ar", "cl", "pe", "vn", "id", "th", "ph", "my",
    "pk", "bd", "ng", "gh", "ke", "onion",
}


def _is_private_ip(addr: str) -> bool:
    try:
        return ipaddress.ip_address(addr).is_private
    except ValueError:
        return False


def _is_valid_domain(domain: str) -> bool:
    parts = domain.lower().split(".")
    if len(parts) < 2:
        return False
    if parts[-1] not in TLDS:
        return False
    if domain.lower() in _COMMON_FP_DOMAINS:
        return False
    return True


def _dedupe(items: List[str]) -> List[str]:
    seen: set = set()
    result = []
    for item in items:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result


def extract_iocs(text: str) -> Dict:
    results: Dict = {
        "network": [],
        "file": [],
    }

    seen_values: set = set()

    def _add(category: str, ioc_type: str, value: str):
        key = value.lower()
        if key not in seen_values:
            seen_values.add(key)
            results[category].append({"type": ioc_type, "value": value})

    # --- SHA256 first (longest, most specific) ---
    for m in PATTERNS["sha256"].finditer(text):
        v = m.group(1)
        _add("file", "SHA256", v)

    # --- SHA1 ---
    for m in PATTERNS["sha1"].finditer(text):
        v = m.group(1)
        if v.lower() not in seen_values:
            _add("file", "SHA1", v)

    # --- MD5 ---
    for m in PATTERNS["md5"].finditer(text):
        v = m.group(1)
        if v.lower() not in seen_values:
            _add("file", "MD5", v)

    # --- URLs (extract domains out of them separately) ---
    url_domains: set = set()
    for m in PATTERNS["url"].finditer(text):
        v = m.group(1).rstrip(".,;)")
        _add("network", "URL", v)
        # Extract domain from URL
        try:
            domain_part = v.split("//", 1)[1].split("/")[0].split(":")[0]
            url_domains.add(domain_part.lower())
        except IndexError:
            pass

    # --- Emails ---
    for m in PATTERNS["email"].finditer(text):
        v = m.group(1)
        _add("network", "Email", v)
        email_domain = v.split("@")[1].lower()
        url_domains.add(email_domain)

    # --- IPv4 ---
    for m in PATTERNS["ipv4"].finditer(text):
        v = m.group(1)
        # Skip IPs already captured inside URLs
        if v not in seen_values:
            ioc_type = "IPv4 (Private)" if _is_private_ip(v) else "IPv4"
            _add("network", ioc_type, v)

    # --- IPv6 ---
    for m in PATTERNS["ipv6"].finditer(text):
        v = m.group(1)
        _add("network", "IPv6", v)

    # --- Standalone domains (not already captured in URLs/emails) ---
    for m in PATTERNS["domain"].finditer(text):
        v = m.group(1)
        if v.lower() in url_domains:
            continue
        if not _is_valid_domain(v):
            continue
        _add("network", "Domain", v)

    return results


def ioc_summary(iocs: Dict) -> Dict:
    network = iocs.get("network", [])
    file_ = iocs.get("file", [])
    counts: Dict = {}
    for item in network + file_:
        t = item["type"]
        counts[t] = counts.get(t, 0) + 1
    return {
        "total": len(network) + len(file_),
        "network_total": len(network),
        "file_total": len(file_),
        "by_type": counts,
    }
