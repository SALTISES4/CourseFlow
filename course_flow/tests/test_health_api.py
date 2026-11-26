import pytest
from django.test import Client, override_settings


def test_health_endpoint_reports_django_ready():
    response = Client().get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.django_db
def test_readiness_endpoint_checks_database():
    response = Client().get("/api/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.django_db
@override_settings(
    SECURE_SSL_REDIRECT=False,
    SECURE_PROXY_SSL_HEADER=None,
)
def test_readiness_endpoint_ignores_proxy_header_when_proxy_trust_is_disabled():
    response = Client().get(
        "/api/ready",
        HTTP_X_FORWARDED_PROTO="https",
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.django_db
@override_settings(
    SECURE_SSL_REDIRECT=True,
    SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https"),
)
def test_readiness_endpoint_accepts_trusted_https_proxy_header():
    insecure_response = Client().get("/api/ready")
    secure_response = Client().get(
        "/api/ready",
        HTTP_X_FORWARDED_PROTO="https",
    )

    assert insecure_response.status_code == 301
    assert secure_response.status_code == 200
    assert secure_response.json() == {"status": "ok"}
