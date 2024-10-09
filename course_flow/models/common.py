from django.contrib.auth import get_user_model

User = get_user_model()
title_max_length = 200
workflow_choices = [
    "activity",
    "course",
    "program",
]
