apt-get install graphviz
pip install graphviz
pip install django-extensions
pip install pyparsing pydot
# Go to settings.py > add 'django_extensions', to INSTALLED_APPS
# Add the following code
#GRAPH_MODELS ={
#    'all_applications': True,
#    'graph_models': True,
#     }
# to settings.py
py manage.py graph_models -a > erd.dot
py manage.py graph_models -a
py manage.py graph_models -a > erd.dot && py manage.py graph_models --pydot -a -g -o erd.png

python manage.py graph_models -a > erd.dot && python manage.py graph_models --pydot -a -g -o erd.svg
