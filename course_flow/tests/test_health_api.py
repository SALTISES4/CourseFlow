from django.test import Client
import pytest


def test_health_endpoint_reports_django_ready():
    response = Client().get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.django_db
def test_readiness_endpoint_checks_database():
    response = Client().get("/api/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
