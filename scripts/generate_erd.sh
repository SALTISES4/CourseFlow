apt-get install graphviz
pip install graphviz
pip install django-extensions
# Go to settings.py > add 'django_extensions', to INSTALLED_APPS
# Add the following code
#GRAPH_MODELS ={
#    'all_applications': True,
#    'graph_models': True,
#     }
# to settings.py
pip install pyparsing pydot
py manage.py graph_models -a > erd.dot
py manage.py graph_models -a
py manage.py graph_models -a > erd.dot && py manage.py graph_models --pydot -a -g -o erd.png

python course_flow.py graph_models -a > erd.dot && python course_flow.py graph_models --pydot -a -g -o erd.svg
