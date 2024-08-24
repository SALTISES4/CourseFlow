# @todo alpine having problems
FROM python:3.9.18-bullseye as service_deps

WORKDIR /app

########################
# COPY FILES
########################
COPY ./manage.py ./src/
COPY ./pyproject.toml ./src/
COPY ./pytest.ini ./src/
COPY ./SALTISE_course_flow.egg-inf[o] ./src/SALTISE_course_flow.egg-info
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
# GECKO FOR SELENIUMRUN chmod +x /usr/local/bin/chromedriver



FROM service_deps as selenium_deps

########################

#RUN apt-get -y update
#RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys A6DCF7707EBC211F
#RUN sh -c 'echo "deb https://ppa.launchpad.net/ubuntu-mozilla-security/ppa/ubuntu bionic main" >> /etc/apt/sources.list.d/mozilla.list'
#RUN apt -y update
#RUN apt-get -y update
#RUN apt -y update
#RUN apt install -y firefox
#RUN wget -O /tmp/geckodriver.tar.gz https://github.com/mozilla/geckodriver/releases/download/v0.33.0/geckodriver-v0.33.0-linux64.tar.gz
#RUN tar -xvzf /tmp/geckodriver.tar.gz  -C /usr/local/bin/


RUN apt-get update
RUN apt-get install -y firefox-esr
RUN wget -O /tmp/geckodriver.tar.gz https://github.com/mozilla/geckodriver/releases/download/v0.33.0/geckodriver-v0.33.0-linux64.tar.gz
RUN tar -xvzf /tmp/geckodriver.tar.gz  -C /usr/local/bin/

# set display port to avoid crash
ENV DISPLAY=:99

FROM selenium_deps as service

########################
# entrypoint
########################
COPY ./docker/docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh


ENTRYPOINT ["/usr/local/bin/python"]
CMD ["/app/src/manage.py","runserver"]
EXPOSE 8000
