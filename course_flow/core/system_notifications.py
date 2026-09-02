"""Closed client-rendered notification contracts.

Each code must have matching English and French catalogue entries. Parameters
are authored values interpolated by the client and therefore are not translated.
"""

SYSTEM_NOTIFICATION_REQUIRED_PARAMS: dict[str, frozenset[str]] = {
    "project.shared": frozenset({"projectTitle"}),
}

SYSTEM_NOTIFICATION_CODES = frozenset(SYSTEM_NOTIFICATION_REQUIRED_PARAMS)
