# @Author: Nick Steele <nichlock>
# @Date:   13:50 Sep 26 2020
# @Last modified by:   Nick Steele
# @Last modified time: 14:03 Jun 19 2021

IMAGE_TAG = ticket_tracking_viewer:latest
CONTAINER_NAME = ticket_tracking_viewer_server

# Docker commands
D_RUN = docker run
D_BUILD = docker build
D_KILL = docker kill

# Dockerfile Locations
DOCKERFILE = ./Dockerfile

## Run the server
refresh: kill run
## Enter into a CLI, no server will be run
cli: kill run-bash

## LOCAL BUILDS ###############################################################
# Builds off the source files found in '.'
build:
	$(D_BUILD) \
	-t $(IMAGE_TAG) \
	-f $(DOCKERFILE) \
	.

run: build
	$(D_RUN) \
	-p 3000:3000 \
	-v ${CURDIR}/app:/app \
	--rm \
	--env DISPLAY=host.docker.internal:0 \
	--env SRC_DIR=/app \
	--name $(CONTAINER_NAME) \
	-it $(IMAGE_TAG)

run-bash: build
	$(D_RUN) \
	-p 3000:3000 \
	-v ${CURDIR}/app:/app \
	--rm \
	--env DISPLAY=host.docker.internal:0 \
	--env SRC_DIR=/app \
	--name $(CONTAINER_NAME) \
	--entrypoint '/bin/bash' \
	-it $(IMAGE_TAG)

## KILL CONTAINER #############################################################
kill:
	-$(D_KILL) $(CONTAINER_NAME)
