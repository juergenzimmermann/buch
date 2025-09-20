# Hinweise zum Programmierbeispiel

<!--
  Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
-->

[Juergen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)

## Docker Image

Ein Docker-Image für _Jenkins_ muss u.a. die Funktionalität von _Node_ und
_Python_ enthalten, CI für einen Nest-basierten Server durchgeführt werden kann
und bei der Installation des zu testenden Servers auch C-basierte JavaScript-Packages
mittels Python übersetzt werden können. Ein solches Image kann mit Docker
folgendermaßen erstellt werden:

```powershell
    cd <projekt>\.extras\jenkins
    docker buildx bake
```

## Docker Compose

Der Jenkins-Server wird mit _Docker Compose_ gestartet. Dadurch muss Jenkins nicht
immer laufen und kann bei Bedarf gestartet und wieder heruntergefahren werden.

```powershell
    cd .extras\compose\jenkins
    docker compose up

    # In einer 2. PowerShell: Herunterfahren
    docker compose down
```

## Aufruf mit Webbrowser

Mit der URL https://localhost:7070 (siehe Port-Mapping in `compose.yml`) kann
man von einem Webbrowser auf den Jenkins-Container zugreifen. Der Benutzername
ist `admin` und das Passwort `Inf und WI.`.

## Job für Jenkins erstellen

Einen _Job_ für Jenkins mit dem Namen _buch_, der täglich um 2 Uhr ausgeführt
wird und nach einem Push in GitHub 5 Minuten wartet, kann folgendermaßen erstellt
werden:

```txt
    "Create a job" anklicken
    Geben Sie einen Element-Namen an
        buch
        "Pipeline" auswählen
        OK anklicken
    Beschreibung
        ...
    Alte Builds verwerfen
        Anzahl der Tage, die Builds aufbewahrt werden sollen
            1

    GitHub-Projekt      Haken setzen
        Project url     https://github.com/<username>/<projektname>

    Builds zeitgesteuert starten   (H = Hashwert für Lastausgleich)
        Zeitplan
            H 2 * * *
    Source Code Management System abfragen
        Zeitplan
            H/5 * * * *

    Pipeline
        Definition      Pipeline script from SCM
        SCM
            Git
        Repository URL
            https://github.com/<username>/<projektname>
        Credentials
            Add
                Benutzername   ...
                Passwort       ...
            <username>>/****** auswählen
        Branch specifier
            */main
        Script Path
            Jenkinsfile
    Speichern
```

## Bash zur evtl. Fehlersuche im laufenden Jenkins-Container

Das Homedirectory vom User `jenkins` ist `/var/jenkins_home` und der sogenannte
_Workspace_ für einen _Job_ ist in `/var/jenkins_home/workspace/<jobname>`.

```shell
    docker compose exec jenkins bash
        # z.B.
        cat /etc/os-release
        cat /etc/debian_version
        cat /etc/passwd
        cat /etc/group
        exit
```
