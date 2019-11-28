# How to Graph your Django Models

1.  Install Graphviz using Homebrew.

        brew install graphviz

    If you received the following errror:

        Error: The following formula
        [#<Dependency: "python" []>, #<Options: []>]
        cannot be installed as binary package and must be built from source.

    Install Command Line Tools.

        xcode-select --install

    Now install Graphviz using Homebrew.

        brew install graphviz

2.  Activate your virtualenv with django already installed.

        source django_venv/bin/activate

3.  Install django-extensions and Graphviz using pip.

        (django_venv) pip install django-extensions graphviz

4.  Add django-extensions to your Django project's `INSTALLED_APPS` in settings.py.

        INSTALLED_APPS = [
            "django_extensions",
            ...
        ]

5.  Install pygraphviz using pip while providing path to graphviz include and library.

        (django_venv) pip install pygraphviz --install-option="--include-path=/usr/local/include/graphviz/" --install-option="--library-path=/usr/local/lib/graphviz"

6.  Add these default settings for `GRAPH_MODELS` in settings.py.

        GRAPH_MODELS = {
            'all_applications': True,
            'group_models': True,
        }

7.  Graph your project's models.

        (django_venv) python manage.py graph_models -a -g -o django_project_models.png
