from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.enum import (
    ContextClassification,
    TaskClassification,
    TimeUnit,
)
from course_flow.core.models import Authtoken


def _auth_header(user) -> dict[str, str]:
    raw = generate_raw_token()
    Authtoken.objects.create(
        user=user,
        token_hash=hash_token(raw),
        expires_at=timezone.now() + timedelta(hours=1),
    )
    return {"HTTP_AUTHORIZATION": f"Bearer {raw}"}


def test_reference_data_requires_authentication(client: Client):
    response = client.get("/api/reference-data")
    assert response.status_code == 401


@pytest.mark.django_db
def test_reference_data_returns_named_options_and_disciplines(
    client: Client, django_user_model
):
    user = django_user_model.objects.create_user(
        email="reference-data@example.com", password="password123"
    )
    response = client.get("/api/reference-data", **_auth_header(user))

    assert response.status_code == 200, response.content
    body = response.json()
    assert {"code": "biology", "label": "Biology"} in body["disciplines"]
    assert body["activityContexts"] == [
        {"value": ContextClassification.NONE, "label": "None"},
        {"value": ContextClassification.INDIVIDUAL_WORK, "label": "Individual Work"},
        {"value": ContextClassification.WORK_IN_GROUPS, "label": "Work in Groups"},
        {"value": ContextClassification.IN_THE_CLASSROOM, "label": "Whole Class"},
    ]
    assert body["courseContexts"][1]["value"] == ContextClassification.FORMATIVE
    assert body["activityTaskClassifications"][1]["value"] == (
        TaskClassification.GATHER_INFORMATION
    )
    assert body["timeUnits"][2]["value"] == TimeUnit.HOURS
