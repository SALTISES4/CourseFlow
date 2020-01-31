# CourseFlow

[![CircleCI](https://circleci.com/gh/SALTISES4/CourseFlow.svg?style=svg)](https://circleci.com/gh/SALTISES4/CourseFlow)

CourseFlow is a pedagogical tool for planning activities, courses, and programs, which is designed to enable Research Practice Partnerships between instructors, designers, and researchers.

## Setting up the development server

1.  Set up a virtualenv.

        python3 -m venv dev_venv

2.  Activate the virtualenv.

        source dev_venv/bin/activate

3.  Install the requirements.

        (dev_venv) pip install -r requirements.txt

4.  Install pre-commit.

        pre-commit install

5.  Install node modules.

        npm install

6.  Build minified JS files.

        yarn run gulp build-js

7.  Migrate

        (dev_venv) python3 course_flow.py migrate

8.  Run the Django development server.

        (dev_venv) python3 course_flow.py runserver
