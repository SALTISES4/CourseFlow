# @todo alpine having problems
# FROM python:alpine3.7 as service_deps
FROM python:3.8.10 as service_deps
#ENV PATH="$VIRTUAL_ENV/bin:$PATH"
#FROM circleci/python:3.8-node-browsers as service_deps


WORKDIR /app

########################
# COPY FILES
########################
COPY ./course_flow.py ./src/
COPY ./course_flow.py ./src/
COPY ./pyproject.toml ./src/
COPY ./pytest.ini ./src/
COPY ./setup.py ./src/
COPY ./setup.cfg ./src/
COPY ./SALTISE_course_flow.egg-info ./src/SALTISE_course_flow.egg-info
COPY ./course_flow/ ./src/course_flow
COPY ./requirements/ ./src/requirements


WORKDIR /app/src
RUN apt-get -y update
RUN apt-get install -y \
  vim

########################
# PIP LIBS
########################
RUN pip install \
    redislite \
    pip-tools
RUN python3 -m pip install -r requirements/requirements.txt


########################
# Chrome for Selenium
########################
#RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
#RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
#RUN apt-get install -y google-chrome-stable

# install chromedriver


#RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
#RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
#RUN apt-get update -qqy --no-install-recommends && apt-get install -qqy --no-install-recommends google-chrome-stable
#
#RUN apt-get install -yqq unzip
#RUN wget -O /tmp/chromedriver.zip http://chromedriver.storage.googleapis.com/`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE`/chromedriver_linux64.zip
#RUN unzip /tmp/chromedriver.zip chromedriver -d /usr/local/bin/
#RUN chmod +x /usr/local/bin/chromedriver

########################
# GECKO FOR SELENIUMRUN chmod +x /usr/local/bin/chromedriver
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys A6DCF7707EBC211F
RUN sh -c 'echo "deb http://ppa.launchpad.net/ubuntu-mozilla-security/ppa/ubuntu bionic main" >> /etc/apt/sources.list.d/mozilla.list'
RUN apt -y update
RUN apt install -y firefox
RUN wget -O /tmp/geckodriver.tar.gz https://github.com/mozilla/geckodriver/releases/download/v0.33.0/geckodriver-v0.33.0-linux64.tar.gz
RUN tar -xvzf /tmp/geckodriver.tar.gz  -C /usr/local/bin/

# set display port to avoid crash
ENV DISPLAY=:99

FROM service_deps as builder

FROM builder as service

########################
# entrypoint
########################
COPY ./docker/docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh


ENTRYPOINT ["/usr/local/bin/python"]
CMD ["/app/src/course_flow.py","runserver"]
EXPOSE 8000
