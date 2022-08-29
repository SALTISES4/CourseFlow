import hashlib

from django.conf import settings


def generate_password(username: str) -> str:
    """
    Generates the password created from the `username`. This will always be the
    same as long as `PASSWORD_KEY` doesn't change.
    Parameters
    ----------
    username : str
        Username used to create the password
    Returns
    -------
    str
        Password as a hashed string of length 64
    """
    return hashlib.sha3_256(
        f"{username}.{settings.PASSWORD_KEY}".encode()
    ).hexdigest()
