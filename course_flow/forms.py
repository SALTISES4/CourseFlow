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
    # NOTE: If these two are omitted, the fields aren't required and the user can
    # enter/save empty fields - does this mean User model should be tweaked
    # or should we exclusively be working with the CourseFlowUser model?
    # first_name = forms.CharField(label=_("First name"), max_length=30)
    # last_name = forms.CharField(label=_("Last name"), max_length=30)

    # TODO: Add language preferences field
    # LANG_CHOICES = [
    #     ("en", _("English")),
    #     ("fr", _("French")),
    # ]

    # language = forms.ChoiceField(
    #     label=_("Language preferences"),
    #     choices=LANG_CHOICES,
    #     widget=forms.RadioSelect(),
    # )

    class Meta:
        model = CourseFlowUser
        fields = (
            "first_name",
            "last_name",
        )
