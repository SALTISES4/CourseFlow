from django.test import TestCase


class FeedbackPostTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
