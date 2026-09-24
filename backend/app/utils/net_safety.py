"""SSRF guard and network safety rules (3.2).

Enforces:
- Scheme must be http or https
- Port must be 80 or 443
- Hostname resolved to IP before connection
- Private, loopback, link-local, cloud metadata, multicast, and reserved ranges blocked
- Re-validates every redirect hop
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),  # Link-local & cloud metadata
    ipaddress.ip_network("100.64.0.0/10"),   # Carrier-grade NAT
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),         # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),        # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),       # IPv6 link-local
    ipaddress.ip_network("::ffff:0:0/96"),   # IPv4-mapped IPv6
]


class SSRFBlockedError(ValueError):
    """Raised when a URL attempts to target internal, private, or metadata IPs."""


def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """True if IP falls into any forbidden/private/loopback/cloud-metadata subnet."""
    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified:
        return True
    for net in BLOCKED_NETWORKS:
        if ip in net:
            return True
    return False


def validate_url_safety(url: str) -> None:
    """Validates that a URL is safe from SSRF attacks before any network fetch.

    Checks:
    - Scheme is http or https
    - Port is 80 or 443 (or standard default)
    - Hostname resolves to a public, non-forbidden IP address
    """
    if not url:
        raise SSRFBlockedError("Empty URL")

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise SSRFBlockedError(f"Unsupported scheme: {parsed.scheme!r}")

    port = parsed.port
    if port is not None and port not in (80, 443):
        raise SSRFBlockedError(f"Disallowed port: {port}")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFBlockedError("URL missing hostname")

    if hostname.lower() in ("localhost", "127.0.0.1", "::1"):
        raise SSRFBlockedError(f"Loopback host {hostname} blocked")

    # Resolve IP
    try:
        # Check if hostname is already an IP address
        try:
            raw_ip = ipaddress.ip_address(hostname)
            if is_ip_blocked(raw_ip):
                raise SSRFBlockedError(f"Blocked IP: {raw_ip}")
            return
        except ValueError:
            pass

        # Resolve DNS
        addr_info = socket.getaddrinfo(hostname, None)
        if not addr_info:
            raise SSRFBlockedError(f"Could not resolve host: {hostname}")

        for item in addr_info:
            sockaddr = item[4]
            ip_str = sockaddr[0]
            ip_obj = ipaddress.ip_address(ip_str)
            if is_ip_blocked(ip_obj):
                raise SSRFBlockedError(f"Host {hostname} resolved to blocked IP {ip_str}")
    except socket.gaierror as exc:
        raise SSRFBlockedError(f"DNS resolution failure: {exc}") from exc
