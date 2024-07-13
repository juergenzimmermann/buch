# Copyright (C) 2022 - present, Juergen Zimmermann, Hochschule Karlsruhe
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

# https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/approved-verbs-for-windows-powershell-commands?view=powershell-7

# Aufruf:   .\dive.ps1 [alpine]
# ggf. vorher:  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# oder:         Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser

# "Param" muss in der 1. Zeile sein
Param (
  [string]$base = 'bookworm'
)

Set-StrictMode -Version Latest

$versionMinimum = [Version]'7.5.0'
$versionCurrent = $PSVersionTable.PSVersion
if ($versionMinimum -gt $versionCurrent) {
  throw "PowerShell $versionMinimum statt $versionCurrent erforderlich"
}

# Titel setzen
$host.ui.RawUI.WindowTitle = 'dive'

$diveVersion = 'v0.12.0'
$imagePrefix = 'juergenzimmermann/'
$imageBase = 'buch'
$imageTag = "2024.10.1-$base"
$image = "$imagePrefix${imageBase}:$imageTag"

# https://github.com/wagoodman/dive#installation
docker run --rm --interactive --tty `
  --mount type='bind,source=/var/run/docker.sock,destination=/var/run/docker.sock' `
  --hostname dive --name dive `
  --read-only --cap-drop ALL `
  wagoodman/dive:$diveVersion $image
