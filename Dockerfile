## Image Setup ##################################################################
# Start with base image
FROM ubuntu:latest

## Run Installs ###############################################################
# These are run first to avoid having to re-run them on file edits/rebuilds

# Hopefully prevent interaction requirements that freeze installations
ENV DEBIAN_FRONTEND=noninteractive

# Apt installation
RUN apt-get update
RUN apt-get update && apt-get -yq install python3 python3-pip --fix-missing
RUN apt-get update && apt-get -yq install nodejs npm
RUN apt-get -yq install nano

RUN python3 -m pip install flask

RUN echo "alias python='python3'"
RUN echo "alias p='python'"

COPY ./install.makefile /makefile
COPY ./runapp.sh /

# ENTRYPOINT ["/bin/bash"]
ENTRYPOINT ["/bin/bash", "/runapp.sh"]
