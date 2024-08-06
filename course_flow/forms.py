from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.utils.translation import gettext as _

from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.models.discipline import Discipline
from course_flow.models.project import Project
from course_flow.serializers import DisciplineSerializer


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
    # Re-declare form fields to make them required
    # Instead, the fields will come from CourseFlowUser and they
    # are declared as not required / blank, so a user will be able
    # to save his details without specifying first/last name.
    # TODO: Investigate if the CourseFlowUser model fields should be tweaked
    # or if this is the route to take when overriding fields manually
    first_name = forms.CharField(
        label=_("First name"),
        max_length=300,
    )

    last_name = forms.CharField(
        label=_("Last name"),
        max_length=300,
    )

    class Meta:
        model = CourseFlowUser
        fields = (
            "first_name",
            "last_name",
            "language",
        )
        widgets = {
            "language": forms.RadioSelect,
        }


class NotificationsSettings(forms.ModelForm):
    class Meta:
        model = CourseFlowUser
        fields = ("notifications",)


class DisciplineIterator(forms.models.ModelChoiceIterator):
    def choice(self, obj):
        return (
            str(obj.id),
            self.field.label_from_instance(obj),
        )


class CreateProject(forms.ModelForm):
    title = forms.CharField(
        label=_("Title"),
        max_length=200,
    )

    disciplines = forms.ModelMultipleChoiceField(
        label=_("Discipline"),
        required=False,
        queryset=Discipline.objects.all(),
    )
    disciplines.iterator = DisciplineIterator

    class Meta:
        model = Project
        fields = ("title", "description", "disciplines")
