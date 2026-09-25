import pytest
from app.core.repackaging import detect_repackaging
from app.core.rules_loader import Brand, Rules, get_rules


def test_repackaging_signer_mismatch() -> None:
    # Setup test brand with official cert
    brand = Brand(
        name="SampleBank",
        aliases=("samplebank",),
        official_domains=("samplebank.com",),
        official_packages=frozenset({"com.samplebank.app"}),
        official_cert_sha256=frozenset({"1122334455667788"}),
    )

    base_rules = get_rules()
    test_rules = Rules(
        bands=base_rules.bands,
        many_sensitive_threshold=base_rules.many_sensitive_threshold,
        many_sensitive_points=base_rules.many_sensitive_points,
        mismatch_points=base_rules.mismatch_points,
        impersonation_points=base_rules.impersonation_points,
        max_score=base_rules.max_score,
        group_points=base_rules.group_points,
        group_label_keys=base_rules.group_label_keys,
        perm_to_group=base_rules.perm_to_group,
        sensitive_groups=base_rules.sensitive_groups,
        component_permission_signals=base_rules.component_permission_signals,
        component_meta_data_signals=base_rules.component_meta_data_signals,
        categories=base_rules.categories,
        single_word_index=base_rules.single_word_index,
        multi_word_keywords=base_rules.multi_word_keywords,
        unknown_category_id=base_rules.unknown_category_id,
        patterns=base_rules.patterns,
        brands=(brand,),
        brand_alias_index={"samplebank": "SampleBank"},
        link_rules=base_rules.link_rules,
    )

    # Scanned with fake/debug cert
    res = detect_repackaging(
        label="SampleBank Mobile",
        package="com.samplebank.app",
        signing_certs=["deadbeefdeadbeef"],
        rules=test_rules,
    )
    assert res is not None
    assert res.detected
    assert res.signal == "signer_mismatch"


def test_repackaging_signer_changed_from_history() -> None:
    res = detect_repackaging(
        label="Clean App",
        package="com.example.clean",
        signing_certs=["cert_new_2222"],
        prior_cert_sha256="cert_old_1111",
    )
    assert res is not None
    assert res.detected
    assert res.signal == "signer_changed"
