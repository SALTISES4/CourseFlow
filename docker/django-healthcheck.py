import json
import os
import urllib.request


def main() -> int:
    allowed_hosts = [
        host.strip()
        for host in os.environ["DJANGO_ALLOWED_HOSTS"].split(",")
        if host.strip()
    ]
    host = "127.0.0.1" if "*" in allowed_hosts else allowed_hosts[0]
    request = urllib.request.Request(
        "http://127.0.0.1:8000/api/ready",
        headers={"Host": host},
    )

    with urllib.request.urlopen(request, timeout=2) as response:
        payload = json.load(response)

    return 0 if response.status == 200 and payload == {"status": "ok"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
