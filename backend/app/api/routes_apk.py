"""POST /api/v1/apk/analyze endpoint implementation."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.core.apk_parser import parse_apk
from app.core.calibration import build_calibration_notes
from app.core.category import detect_category
from app.core.explain import build_explanations
from app.core.impersonation import detect_impersonation
from app.core.playbook import get_playbook
from app.core.prescription import prescribe_minimum_permissions
from app.core.repackaging import detect_repackaging
from app.core.risk_engine import score_apk
from app.core.rules_loader import get_rules
from app.intel.hash_stats import get_crowd_intel, record_scan
from app.intel.package_history import get_package_record, save_package_record
from app.intel.version_diff import compute_version_diff
from app.models.schemas import (
    ApkReport,
    AppInfo,
    Lang,
)
from app.store.report_store import get_report_store
from app.utils.file_safety import (
    FileSafetyError,
    safe_temp_apk,
    save_upload_stream,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/apk", tags=["APK"])


@router.post("/analyze", response_model=ApkReport)
async def analyze_apk(
    request: Request,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    lang: Lang = Form("en"),
) -> ApkReport:
    rules = get_rules()
    store = get_report_store()

    # Determine content length if header present
    content_length: int | None = None
    if "content-length" in request.headers:
        try:
            content_length = int(request.headers["content-length"])
        except ValueError:
            pass

    async def chunk_generator():
        while True:
            chunk = await file.read(64 * 1024)
            if not chunk:
                break
            yield chunk

    try:
        temp_path, sha256_hash = await save_upload_stream(
            chunk_generator(),
            content_length=content_length,
        )
    except FileSafetyError as exc:
        raise HTTPException(
            status_code=413 if exc.code == "file_too_large" else 400,
            detail={"code": exc.code, "message": exc.message},
        )
    except Exception as exc:
        logger.error("Failed during upload processing: %s", exc)
        raise HTTPException(
            status_code=400,
            detail={"code": "not_an_apk", "message": "Failed to process upload as APK"},
        )

    with safe_temp_apk(temp_path):
        try:
            parsed_apk = parse_apk(temp_path, sha256_hash)
        except Exception as exc:
            logger.error("Manifest parsing failed: %s", exc)
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "manifest_unreadable",
                    "message": "We could not read this app's manifest.",
                },
            )

        # 1. Category Detection
        category_res = detect_category(parsed_apk.label, parsed_apk.package, category, rules)

        # 2. Impersonation Check
        impersonation_res = detect_impersonation(parsed_apk.label, parsed_apk.package, rules)

        # 3. Package History & Repackaging Check
        history_rec = get_package_record(parsed_apk.package or "")
        prior_cert = history_rec["cert_sha256"] if history_rec else None

        repackaging_res = detect_repackaging(
            parsed_apk.label,
            parsed_apk.package,
            parsed_apk.signing_cert_sha256,
            prior_cert_sha256=prior_cert,
            rules=rules,
        )

        # 4. Risk Engine Scoring
        score_res = score_apk(
            parsed_apk,
            category_res,
            rules,
            impersonation_detected=bool(impersonation_res),
            repackaging_detected=bool(repackaging_res and repackaging_res.detected),
        )

        # 5. Version Diff & Intel History Update
        update_diff = compute_version_diff(
            history_rec,
            parsed_apk.version_code,
            parsed_apk.signing_cert_sha256,
            score_res.present_groups,
        )

        primary_cert = (
            parsed_apk.signing_cert_sha256[0]
            if parsed_apk.signing_cert_sha256
            else None
        )
        save_package_record(
            package=parsed_apk.package or "unknown",
            label=parsed_apk.label,
            version_code=parsed_apk.version_code,
            cert_sha256=primary_cert,
            groups=list(score_res.present_groups),
        )

        # 6. Crowd Intel
        record_scan(
            sha256=parsed_apk.sha256,
            label=parsed_apk.label,
            is_red=(score_res.verdict == "red"),
        )
        crowd_intel = get_crowd_intel(parsed_apk.sha256)

        # 7. Calibration Notes
        not_checked = ["signing_cert"] if parsed_apk.cert_check == "not_checked" else None
        calibration_notes = build_calibration_notes(
            parsed_apk, category_res, not_checked_checks=not_checked
        )

        # 8. Action Playbook
        playbook_steps = get_playbook(
            verdict=score_res.verdict,
            patterns=list(score_res.patterns),
            app_label=parsed_apk.label or "this app",
            repackaging_detected=bool(repackaging_res and repackaging_res.detected),
        )

        # 9. Minimum Permission Prescription
        prescription = prescribe_minimum_permissions(category_res.id, rules)

        # 10. Localized Explanations
        reasons, summary, recommendation, limitations = build_explanations(
            verdict=score_res.verdict,
            category_id=category_res.id,
            recommendation_id=score_res.recommendation,
            breakdown=list(score_res.breakdown),
            patterns=list(score_res.patterns),
            impersonation=impersonation_res,
            repackaging=repackaging_res,
            lang=lang,
        )

        # Generate report ID and save to store
        report_id = store.generate_id()
        app_info = AppInfo(
            label=parsed_apk.label,
            package=parsed_apk.package,
            version_name=parsed_apk.version_name,
            version_code=parsed_apk.version_code,
            min_sdk=parsed_apk.min_sdk,
            target_sdk=parsed_apk.target_sdk,
            sha256=parsed_apk.sha256,
            signing_cert_sha256=parsed_apk.signing_cert_sha256,
            cert_check=parsed_apk.cert_check,
            has_launcher_activity=parsed_apk.has_launcher_activity,
        )

        report = ApkReport(
            report_id=report_id,
            type="apk",
            created_at=datetime.now(timezone.utc),
            app=app_info,
            category=category_res,
            score=score_res.score,
            band=score_res.band.id,
            verdict=score_res.verdict,
            recommendation=score_res.recommendation,
            critical_pattern_triggered=score_res.critical_override,
            breakdown=list(score_res.breakdown),
            permissions=list(score_res.permissions),
            patterns=list(score_res.patterns),
            impersonation=impersonation_res,
            repackaging=repackaging_res,
            update_diff=update_diff,
            crowd_intel=crowd_intel,
            calibration=calibration_notes,
            playbook=playbook_steps,
            prescription=prescription,
            reasons=reasons,
            summary=summary,
            limitations=limitations,
            lang=lang,
        )

        store.save(report.model_dump(mode="json"), report_id=report_id)
        return report
