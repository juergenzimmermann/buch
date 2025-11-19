# syntax=docker.io/docker/dockerfile-upstream:1.20.0
# check=error=true

# Copyright (C) 2023 - present, Juergen Zimmermann, Hochschule Karlsruhe
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
# along with this program. If not, see <https://www.gnu.org/licenses/>.

# Aufruf:   docker build --tag juergenzimmermann/buch:2025.10.1-trixie .
#               ggf. --progress=plain
#               ggf. --no-cache
#           Get-Content Dockerfile | docker run --rm --interactive hadolint/hadolint:v2.14.0-debian
#               Linux:   cat Dockerfile | docker run --rm --interactive hadolint/hadolint:v2.14.0-debian
#           docker save juergenzimmermann/buch:2025.10.1-trixie > buch.tar
#           docker network ls

# https://docs.docker.com/engine/reference/builder/#syntax
# https://github.com/moby/buildkit/blob/master/frontend/dockerfile/docs/reference.md
# https://hub.docker.com/r/docker/dockerfile
# https://docs.docker.com/build/building/multi-stage
# https://github.com/textbook/starter-kit/blob/main/Dockerfile
# https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker
# https://cheatsheetseries.owasp.org/cheatsheets/NodeJS_Docker_Cheat_Sheet.html

ARG NODE_VERSION=25.2.1

# ---------------------------------------------------------------------------------------
# S t a g e   d i s t
# ---------------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-trixie-slim AS dist

# ggf. Python fuer pg
# https://packages.debian.org/trixie/python3.12-minimal
# "python3-dev" enthaelt "multiprocessing"
# "build-essential" enthaelt "make"
RUN <<EOF
# https://explainshell.com/explain?cmd=set+-eux
set -eux
# https://manpages.debian.org/trixie/apt/apt-get.8.en.html
# Die "Package Index"-Dateien neu synchronisieren
apt-get update --no-show-upgraded
# Die neuesten Versionen der bereits installierten Packages installieren
apt-get upgrade --yes --no-show-upgraded

npm r -g yarn pnpm corepack
rm /usr/local/bin/yarn
rm /usr/local/bin/yarnpkg
npm i -g corepack
corepack enable pnpm
corepack prepare pnpm@latest-10 --activate

# Debian Trixie bietet nur Packages fuer Python 3.13
# https://packages.debian.org/trixie/python3.13-minimal
# https://packages.debian.org/trixie/python3.13-dev
# https://packages.debian.org/trixie/build-essential
apt-get install --no-install-recommends --yes python3.13-minimal=3.13.5-2 python3.13-dev=3.13.5-2 build-essential=12.12
ln -s /usr/bin/python3.13 /usr/bin/python3
ln -s /usr/bin/python3.13 /usr/bin/python

EOF

USER node

WORKDIR /home/node

# https://docs.docker.com/engine/reference/builder/#run---mounttypebind
RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=bind,source=nest-cli.json,target=nest-cli.json \
  --mount=type=bind,source=tsconfig.json,target=tsconfig.json \
  --mount=type=bind,source=tsconfig.build.json,target=tsconfig.build.json \
  --mount=type=bind,source=src,target=src \
  --mount=type=cache,target=/root/.pnpm <<EOF
set -eux

pnpm i --prefer-frozen-lockfile
pnpm run build
EOF

# ------------------------------------------------------------------------------
# S t a g e   d e p e n d e n c i e s
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-trixie-slim AS dependencies

RUN --mount=type=bind,source=package.json,target=package.json <<EOF
set -eux
# Die "Package Index"-Dateien neu synchronisieren
apt-get update
# Die neuesten Versionen der bereits installierten Packages installieren
apt-get upgrade --yes

npm r -g yarn pnpm corepack
rm /usr/local/bin/yarn
rm /usr/local/bin/yarnpkg
npm i -g corepack
corepack enable pnpm
corepack prepare pnpm@latest-10 --activate

# https://packages.debian.org/trixie/python3.13-minimal
# https://packages.debian.org/trixie/python3.13-dev
# https://packages.debian.org/trixie/build-essential
apt-get install --no-install-recommends --yes python3.13-minimal=3.13.5-2 python3.13-dev=3.13.5-2 build-essential=12.12
ln -s /usr/bin/python3.13 /usr/bin/python3
ln -s /usr/bin/python3.13 /usr/bin/python

EOF

USER node

WORKDIR /home/node

RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
  --mount=type=cache,target=/root/.pnpm <<EOF
set -eux

pnpm i -P --frozen-lockfile
EOF

# ------------------------------------------------------------------------------
# S t a g e   f i n a l
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-trixie-slim AS final

# Anzeige bei "docker inspect ..."
# https://specs.opencontainers.org/image-spec/annotations
# https://spdx.org/licenses
# MAINTAINER ist deprecated https://docs.docker.com/engine/reference/builder/#maintainer-deprecated
LABEL org.opencontainers.image.title="buch" \
  org.opencontainers.image.description="Appserver buch mit Basis-Image Debian Trixie" \
  org.opencontainers.image.version="2025.10.1-trixie" \
  org.opencontainers.image.licenses="GPL-3.0-or-later" \
  org.opencontainers.image.authors="Juergen.Zimmermann@h-ka.de"

RUN <<EOF
set -eux
# Die "Package Index"-Dateien neu synchronisieren
apt-get update
# Die neuesten Versionen der bereits installierten Packages installieren
apt-get upgrade --yes
# https://github.com/Yelp/dumb-init
# https://packages.debian.org/trixie/dumb-init
# https://packages.debian.org/trixie/wget
apt-get install --no-install-recommends --yes dumb-init=1.2.5-3 wget=1.25.0-2

apt-get autoremove --yes
apt-get clean --yes
rm -rf /var/lib/apt/lists/*
rm -rf /tmp/*
EOF

WORKDIR /opt/app

USER node

# ADD hat mehr Funktionalitaet als COPY, z.B. auch Download von externen Dateien
COPY --chown=node:node package.json .env ./
COPY --from=dependencies --chown=node:node /home/node/node_modules ./node_modules
COPY --from=dist --chown=node:node /home/node/dist ./dist
COPY --chown=node:node src/config/resources ./dist/config/resources

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=1 \
  CMD wget -qO- --no-check-certificate https://localhost:3000/health/readiness/ | grep ok || exit 1

# Bei CMD statt ENTRYPOINT kann das Kommando bei "docker run ..." ueberschrieben werden
# "Array Syntax" damit auch <Strg>C funktioniert
# https://github.com/Yelp/dumb-init:
# "a simple process supervisor and init system designed to run as PID 1 inside
# minimal container environments (such as Docker)""
ENTRYPOINT ["dumb-init", "/usr/local/bin/node", "dist/main.js"]
