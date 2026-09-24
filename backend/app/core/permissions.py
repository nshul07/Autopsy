"""Permission and component -> group classification (F3).

Groups, not individual permissions, carry points: an app declaring READ_SMS,
RECEIVE_SMS and SEND_SMS pays the ``sms`` cost once.

The permission -> group map is a flat dict built once at startup, so
classification is O(P) lookups rather than an O(P x G) nested scan over every
group's every permission.

Accessibility, notification listener and device admin are *not* uses-permission
entries. They are declared on <service>/<receiver> components and are recognised
from two independent signals each, because real banking trojans frequently use
the <meta-data> form alone and a permission-only check would miss them.
"""

from __future__ import annotations

from app.core.rules_loader import Rules, get_rules
from app.models.schemas import ComponentInfo, PermissionItem


def component_group_ids(
    services: list[ComponentInfo],
    receivers: list[ComponentInfo],
    rules: Rules,
) -> set[str]:
    """Groups implied by component declarations.

    A component contributes a group when it either declares the binding
    permission or carries the matching <meta-data> name. Either signal alone is
    sufficient — that is the whole point of the dual check.
    """
    found: set[str] = set()

    for component in (*services, *receivers):
        if component.permission:
            group = rules.component_permission_signals.get(component.permission)
            if group is not None:
                found.add(group)

        for meta_name in component.meta_data_names:
            group = rules.component_meta_data_signals.get(meta_name)
            if group is not None:
                found.add(group)

    return found


def present_groups(
    permissions: list[str],
    services: list[ComponentInfo],
    receivers: list[ComponentInfo],
    rules: Rules | None = None,
) -> frozenset[str]:
    """Every group the manifest declares, from permissions and components.

    Includes zero-point groups such as ``boot``: they carry no score but
    patterns depend on them. Time O(P + C), space O(G).
    """
    rules = rules or get_rules()
    perm_to_group = rules.perm_to_group

    groups = {perm_to_group[name] for name in permissions if name in perm_to_group}
    groups |= component_group_ids(services, receivers, rules)

    return frozenset(groups)


def permission_items(
    permissions: list[str],
    expected: frozenset[str],
    rules: Rules | None = None,
) -> list[PermissionItem]:
    """Per-permission view for the report table.

    Only permissions that map to a group are listed; everything else is noise
    for a non-technical reader. Ordered by group then name so the output is
    stable across runs.
    """
    rules = rules or get_rules()
    perm_to_group = rules.perm_to_group

    items = [
        PermissionItem(
            name=name,
            group=group,
            status="expected" if group in expected else "unexpected",
        )
        for name in permissions
        if (group := perm_to_group.get(name)) is not None
    ]

    items.sort(key=lambda item: (item.group, item.name))
    return items