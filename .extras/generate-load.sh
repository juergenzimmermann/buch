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

# Aufruf:   ./generate-load.sh [ingress]

# Set-StrictMode -Version Latest

# Titel setzen
echo -en "\033]1; generate-load \007"

for ((index=1; ; index++))
do
  if [ $((index%2)) = 0 ]
  then
    id=20
  elif [ $((index%3)) = 0 ]
  then
    id=30
  elif [ $((index%5)) = 0 ]
  then
    id=40
  elif [ $((index%7)) = 0 ]
  then
    id=50
  else
    id=1
  fi

  url="https://localhost:3000/rest/$id"
  #$url = "http://localhost:3000/rest/$id"

  tls='--tlsv1.3'
  # FIXME Option `--tlsv1.3` wird im aktuellen Build von libcurl für macOS 14.4.1 nicht unterstützt
  #tls=''

  curl --insecure $tls \
    --header "Accept: application/hal+json" \
    $url \
    > /dev/null

  sleep 0.3
done
