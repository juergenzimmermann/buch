# syntax=docker/dockerfile:1.17.1
# check=error=true

# Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
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

# Aufruf:   docker build --tag juergenzimmermann/jenkins:2025.10.1 .
#           Get-Content Dockerfile | docker run --rm --interactive hadolint/hadolint:2.12.1-beta-debian
#           docker compose exec jenkins bash
#               cat /etc/os-release
#                   ID=debian
#                   VERSION="12 (bookworm)"

# https://manpages.debian.org/bullseye/apt/apt-get.8.en.html

ARG JENKINS_VERSION=2.521-jdk21

FROM jenkins/jenkins:${JENKINS_VERSION}

USER root

RUN <<EOF
set -ex

apt-get update --yes
apt-get upgrade --yes

# LSB = Linux Standard Base
# lsb-release: benutzte Linux-Distribution identifizieren und Einhaltung der Linux Standard Base zu pruefen
# https://packages.debian.org/bookworm/lsb-release
apt-get install --no-install-recommends --yes --show-progress lsb-release=12.0-1

# https://packages.debian.org/stable/python/python3
# https://packages.debian.org/bookworm/python3
# https://packages.debian.org/bookworm/python3-minimal
# https://packages.debian.org/trixie/python3.12
# https://computingforgeeks.com/how-to-install-python-on-debian-linux
# https://cloudcone.com/docs/article/how-to-install-python-3-10-on-debian-11
# https://linuxhint.com/install-python-debian-10
# https://computingforgeeks.com/how-to-install-python-on-debian-linux
# apt show python3.11-minimal
# apt list
apt-get install --no-install-recommends --yes --show-progress gcc=4:12.2.0-3 g++=4:12.2.0-3 make=4.3-4.1 python3.11-minimal=3.11.2-6+deb12u6
ln -s /usr/bin/python3.11 /usr/bin/python
ln -s /usr/bin/python3.11 /usr/bin/python3
#apt-get install --no-install-recommends --yes --show-progress ca-certificates=20230311 curl=7.88.1-10+deb12u8 gnupg=2.2.40-1.1

# https://unix.stackexchange.com/questions/217369/clear-apt-get-list
apt-get autoremove --yes
apt-get clean
rm -rf /var/lib/apt/lists/*
EOF

USER jenkins
