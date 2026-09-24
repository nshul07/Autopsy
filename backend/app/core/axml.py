"""Binary Android XML (AXML) decoding with decoder fallback chain (F2).

AndroidManifest.xml inside an APK is compiled binary AXML, not text XML.
This module decodes binary AXML bytes into an xml.etree.ElementTree.Element.

Fallback chain:
1. androguard AXMLPrinter
2. pyaxmlparser / apkutils2 if available
3. Raise ManifestUnreadableError cleanly if all fail
"""

from __future__ import annotations

import xml.etree.ElementTree as ET


class ManifestUnreadableError(Exception):
    """Raised when AndroidManifest.xml cannot be decoded as binary AXML."""


def decode_axml_to_xml(raw_bytes: bytes) -> str:
    """Decode raw binary AXML bytes to an XML string."""
    if not raw_bytes:
        raise ManifestUnreadableError("Empty manifest bytes")

    # Try 1: androguard AXMLPrinter
    try:
        try:
            from androguard.core.axml import AXMLPrinter
        except ImportError:
            from androguard.core.bytecodes.axml import AXMLPrinter
        printer = AXMLPrinter(raw_bytes)
        if printer.is_valid():
            xml_text = printer.get_xml()
            if isinstance(xml_text, bytes):
                xml_text = xml_text.decode("utf-8", errors="replace")
            if xml_text and "<manifest" in xml_text:
                return xml_text
    except Exception:
        pass

    # Try 2: pyaxmlparser if available
    try:
        import pyaxmlparser.axmlprinter as pap
        ap = pap.AXMLPrinter(raw_bytes)
        xml_text = ap.get_xml()
        if isinstance(xml_text, bytes):
            xml_text = xml_text.decode("utf-8", errors="replace")
        if xml_text and "<manifest" in xml_text:
            return xml_text
    except Exception:
        pass

    # Try 3: apkutils2 if available
    try:
        import apkutils2.axml as apk_axml
        parser = apk_axml.AXML(raw_bytes)
        xml_text = parser.get_xml()
        if isinstance(xml_text, bytes):
            xml_text = xml_text.decode("utf-8", errors="replace")
        if xml_text and "<manifest" in xml_text:
            return xml_text
    except Exception:
        pass

    raise ManifestUnreadableError("All binary AXML decoders failed to decode AndroidManifest.xml")


def parse_axml_tree(raw_bytes: bytes) -> ET.Element:
    """Decode binary AXML bytes and return the parsed ElementTree root."""
    xml_str = decode_axml_to_xml(raw_bytes)
    try:
        return ET.fromstring(xml_str)
    except ET.ParseError as exc:
        raise ManifestUnreadableError(f"Failed to parse decoded manifest XML: {exc}") from exc
