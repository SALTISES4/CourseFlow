class FormFieldsSerializer:
    def __init__(self, form_instance):
        self.form_instance = form_instance

    # figure out the appropriate html element input type
    # based on combination of field and widget type
    def get_field_type(self, field):
        field_type = field.__class__.__name__
        widget_type = field.widget.__class__.__name__

        if field_type == "CharField":
            if getattr(field, "choices", None):
                return "select" if widget_type == "Select" else "radio"
        elif field_type == "TypedChoiceField":
            return "radio" if widget_type == "RadioSelect" else "select"
        elif field_type == "IntegerField":
            return "number"
        elif field_type == "ChoiceField":
            if widget_type == "Select":
                return "select"
            elif widget_type == "RadioSelect":
                return "radio"
        elif field_type == "ModelMultipleChoiceField":
            return "multiselect"
        elif field_type == "BooleanField":
            if widget_type == "CheckboxInput":
                return "checkbox"

        return "text"

    # generate the list of choices for fields which have them
    def get_field_choices(self, field):
        choices = []
        if hasattr(field, "choices"):
            for choice in field.choices:
                choices.append({"label": str(choice[1]), "value": choice[0]})
        return choices if len(choices) > 0 else None

    def prepare_fields(self):
        fields = []

        # have to check if the form instance is valid
        # in order for cleaned_data to become available
        if self.form_instance.is_valid():
            for field_name, field in self.form_instance.fields.items():
                fields.append(
                    {
                        "name": field_name,
                        "label": field.label
                        if hasattr(field, "label")
                        else None,
                        "type": self.get_field_type(field),
                        "required": field.required,
                        "options": self.get_field_choices(field),
                        "max_length": field.max_length
                        if hasattr(field, "max_length")
                        else None,
                        "help_text": field.help_text
                        if hasattr(field, "help_text")
                        else None,
                        "value": self.form_instance.cleaned_data.get(
                            field_name, None
                        ),
                    }
                )
        return fields
