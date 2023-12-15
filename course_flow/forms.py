from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.utils.translation import gettext as _
from .models import CourseFlowUser


class RegistrationForm(UserCreationForm):
    first_name = forms.CharField(max_length=30, help_text="Required")
    last_name = forms.CharField(max_length=30, help_text="Required")
    email = forms.EmailField(max_length=254, help_text="Required")

    class Meta:
        model = User
        fields = (
            "username",
            "first_name",
            "last_name",
            "email",
            "password1",
            "password2",
        )


class ProfileSettings(forms.ModelForm):
    class Meta:
        model = CourseFlowUser
        fields = (
            "first_name",
            "last_name",
            "language",
        )
        widgets = {
            'language': forms.RadioSelect,
        }
