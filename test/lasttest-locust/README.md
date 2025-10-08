# Lasttests mit Locust

<!--
  Copyright (C) 2024 - present Juergen Zimmermann, Hochschule Karlsruhe

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <http://www.gnu.org/licenses/>.
-->

[Juergen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)

Inhalt

- [Voraussetzungen](#voraussetzungen)
- [Aufruf](#aufruf)
- [Statische Codeanalyse und Formatierer](#statische-codeanalyse-und-formatierer)

## Voraussetzungen

- Python 3.14
- uv als Package Manager

## Aufruf

In der Datei `app.yml` im Verzeichnis `.extras\compose\buch` werden bei der
Property `log` die untergeordneten Properties `level` und `pretty` auskommentiert,
damit höchstens der Log-Level INFO verwendet wird, um vor allem die Log-Ausgaben
in der Konsole zu reduzieren.

Jetzt kann man die Docker-Container mit den Backend-Server und dem Buch-Server
starten:

```powershell
    cd .extras\compose\buch
    docker compose up
```

Danach startet man den Lasttest mit _Locust_:

```powershell
    cd .extras\lasttest-locust
    uv run locust -f locustfile.py
    http://localhost:8089
        Number of users: 50
        Ramp Up (users started/second): 5
        Host: https://localhost:3000
```

## Statische Codeanalyse und Formatierer

Unter Verwendung von _uv_ mit _tools_:

```powershell
    cd .extras\lasttest-locust
    uvx ruff check locustfile.py
    uvx ruff format locustfile.py
    uvx ty check locustfile.py
```
