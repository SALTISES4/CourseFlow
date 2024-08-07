# CourseFlow

[![CircleCI](https://circleci.com/gh/SALTISES4/CourseFlow.svg?style=svg)](https://circleci.com/gh/SALTISES4/CourseFlow)

CourseFlow is a pedagogical tool for planning activities, courses, and programs, which is designed to enable Research Practice Partnerships between instructors, designers, and researchers.

## Setting up the development server

1.  Set up a virtualenv.

        python3 -m venv dev_venv

2.  Activate the virtualenv.

        source dev_venv/bin/activate

3.  Install the requirements.

        (dev_venv) pip install -r requirements/requirements.txt

4.  Install pre-commit (optional).

        pre-commit install

5.  Install node modules. (node `v18.15.0`)

        yarn install

6.  Build minified JS files.

        yarn build-js

7.  Migrate

        (dev_venv) python3 manage.py migrate

8.  If you don't have a local_settings.py set up, change line 25 in settings.py to:

        DEBUG = True

9.  Run the Django development server.

        (dev_venv) python3 manage.py runserver

10. Register at:

        127.0.0.1:8000/register

11. Create default strategies and disciplines.

        (dev_venv) python3 manage.py create_saltise_strategies
        (dev_venv) python3 manage.py create_base_disciplines

12. For testing before commits, run:

        (dev_venv) python3 manage.py test

    or:

        (dev_venv) pytest



14. When using in another project:

        add a COURSE_FLOW_RETURN_URL value to your settings.py

