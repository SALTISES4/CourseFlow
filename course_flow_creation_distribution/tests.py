from django.test import TestCase

from django.test.client import RequestFactory
from django.urls import reverse

from .models import (
    model_lookups,
    Course,
    Preparation,
    Activity,
    Assesment,
    Artifact,
    Strategy,
    Node,
    NodeStrategy,
    StrategyActivity,
    ComponentWeek,
    WeekCourse,
    Component,
    Week,
    Program,
    ComponentProgram,
)


class FeedbackPostTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_feedback_post(self):
        response = self.client.post(reverse("dialog-form/create"))
        self.assertEqual(response.status_code, 302)
        user = User.objects.create(username="testuser")
        user.set_password("testpass")
        user.save()
        logged_in = self.client.login(username="testuser", password="testpass")
        self.assertTrue(logged_in)
        response = self.client.get()
        self.assertEqual(response.status_code, 405)
        response = self.client.post()
        posted_feedback = Feedback.objects.first()
        self.assertEqual(posted_feedback.rating, 4)
        self.assertEqual(posted_feedback.text, "dfgfdgdfgdfgdfgfdgdfg")
        self.assertEqual(posted_feedback.author, user)
        self.assertEqual(posted_feedback.type, 2)
        self.assertEqual(response.status_code, 200)
