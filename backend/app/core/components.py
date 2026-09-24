"""Manifest component and permission extraction (F2).

Extracts permissions, services, receivers, activities, and SDK versions from
an Android manifest ElementTree.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from app.models.schemas import ComponentInfo

# Android XML namespaces
ANDROID_NS = "{http://schemas.android.com/apk/res/android}"
ATTR_NAME = f"{ANDROID_NS}name"
ATTR_PERMISSION = f"{ANDROID_NS}permission"
ATTR_VERSION_CODE = f"{ANDROID_NS}versionCode"
ATTR_VERSION_NAME = f"{ANDROID_NS}versionName"
ATTR_MIN_SDK = f"{ANDROID_NS}minSdkVersion"
ATTR_TARGET_SDK = f"{ANDROID_NS}targetSdkVersion"


def _clean_attr(element: ET.Element, attr_key: str, default: str | None = None) -> str | None:
    val = element.attrib.get(attr_key)
    if val is None:
        # Fallback to local name if namespace not matched
        local_name = attr_key.split("}")[-1] if "}" in attr_key else attr_key
        val = element.attrib.get(local_name, default)
    return val


def extract_manifest_components(root: ET.Element) -> dict:
    """Extract all relevant fields from the manifest root element."""
    package = root.attrib.get("package") or _clean_attr(root, ATTR_NAME)
    version_code_str = _clean_attr(root, ATTR_VERSION_CODE)
    version_code = int(version_code_str) if version_code_str and version_code_str.isdigit() else None
    version_name = _clean_attr(root, ATTR_VERSION_NAME)

    min_sdk = None
    target_sdk = None
    uses_sdk = root.find("uses-sdk")
    if uses_sdk is not None:
        min_sdk_str = _clean_attr(uses_sdk, ATTR_MIN_SDK)
        if min_sdk_str and min_sdk_str.isdigit():
            min_sdk = int(min_sdk_str)
        target_sdk_str = _clean_attr(uses_sdk, ATTR_TARGET_SDK)
        if target_sdk_str and target_sdk_str.isdigit():
            target_sdk = int(target_sdk_str)

    # Permissions: <uses-permission> and <uses-permission-sdk-23>
    permissions: set[str] = set()
    for perm_elem in root.findall("uses-permission") + root.findall("uses-permission-sdk-23"):
        perm_name = _clean_attr(perm_elem, ATTR_NAME)
        if perm_name:
            permissions.add(perm_name.strip())

    application = root.find("application")
    services: list[ComponentInfo] = []
    receivers: list[ComponentInfo] = []
    activities: list[str] = []
    has_launcher_activity = False

    if application is not None:
        # Extract services
        for svc in application.findall("service"):
            svc_name = _clean_attr(svc, ATTR_NAME) or ""
            svc_perm = _clean_attr(svc, ATTR_PERMISSION)
            meta_names = []
            for meta in svc.findall("meta-data"):
                m_name = _clean_attr(meta, ATTR_NAME)
                if m_name:
                    meta_names.append(m_name.strip())
            services.append(
                ComponentInfo(
                    name=svc_name,
                    permission=svc_perm.strip() if svc_perm else None,
                    meta_data_names=meta_names,
                )
            )

        # Extract receivers
        for rec in application.findall("receiver"):
            rec_name = _clean_attr(rec, ATTR_NAME) or ""
            rec_perm = _clean_attr(rec, ATTR_PERMISSION)
            meta_names = []
            for meta in rec.findall("meta-data"):
                m_name = _clean_attr(meta, ATTR_NAME)
                if m_name:
                    meta_names.append(m_name.strip())
            receivers.append(
                ComponentInfo(
                    name=rec_name,
                    permission=rec_perm.strip() if rec_perm else None,
                    meta_data_names=meta_names,
                )
            )

        # Extract activities & launcher check
        for act in application.findall("activity") + application.findall("activity-alias"):
            act_name = _clean_attr(act, ATTR_NAME) or ""
            if act_name:
                activities.append(act_name)

            for intent_filter in act.findall("intent-filter"):
                has_main = False
                has_launcher = False
                for action in intent_filter.findall("action"):
                    if _clean_attr(action, ATTR_NAME) == "android.intent.action.MAIN":
                        has_main = True
                for category in intent_filter.findall("category"):
                    if _clean_attr(category, ATTR_NAME) == "android.intent.category.LAUNCHER":
                        has_launcher = True
                if has_main and has_launcher:
                    has_launcher_activity = True

    return {
        "package": package,
        "version_code": version_code,
        "version_name": version_name,
        "min_sdk": min_sdk,
        "target_sdk": target_sdk,
        "permissions": sorted(permissions),
        "services": services,
        "receivers": receivers,
        "activities": activities,
        "has_launcher_activity": has_launcher_activity,
    }
