import re


def password_meets_strength_requirement(password: str) -> bool:
    return bool(
        len(password) >= 12
        and re.search(r"[a-zA-Z]", password)
        and re.search(r"\d", password)
        and re.search(r"[^a-zA-Z0-9]", password)
    )
