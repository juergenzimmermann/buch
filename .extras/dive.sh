#!/bin/bash
# Copyright (C) 2024 -  Juergen Zimmermann, Hochschule Karlsruhe
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

# Aufruf:   .\dive.sh [distroless|wolfi|bookworm]

base=${1}

# Titel setzen
echo -en "\033]1; dive \007"

diveVersion='v0.12.0'
imagePrefix='juergenzimmermann/'
imageBase='buch'
imageTag="2024.04.0-$base"

image="$imagePrefix${imageBase}:$imageTag"
# image='gcr.io/distroless/nodejs20-debian12:nonroot'
# image='node:20.7.0-bookworm-slim'
# image='cgr.dev/chainguard/node:latest'

# https://github.com/wagoodman/dive#installation
docker run --rm --interactive --tty \
  --mount type='bind,source=/var/run/docker.sock,destination=/var/run/docker.sock' \
  --hostname dive --name dive \
  --read-only --cap-drop ALL \
  wagoodman/dive:$diveVersion $image
