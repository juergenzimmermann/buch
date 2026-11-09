# Hinweise zu Drizzle

<!--
  Copyright (C) 2026 - present Juergen Zimmermann, Hochschule Karlsruhe

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

> Diese Datei ist in Markdown geschrieben und kann mit `<Strg><Shift>v` in
> Visual Studio Code leicht gelesen werden. Näheres zu Markdown gibt es z.B. bei
> [Markdown Guide](https://www.markdownguide.org/).
> Die Anleitung ist für _Windows 11_; für _andere Betriebssysteme_ oder
> _Windows-Emulationen_ sind Anpassungen notwendig.

## Inhalt

- [Vorbereitung der Installation](#vorbereitung-der-installation)
- [Voraussetzungen](#voraussetzungen)
  - [Skripte für Powershell bei Windows](#skripte-für-powershell-bei-windows)
  - [Docker Desktop](#docker-desktop)
  - [3rd-party-Software für macOS und Linux](#3rd-party-software-für-macos-und-linux)
  - [Docker-Image für PostgreSQL](#docker-image-für-postgresql)
  - [Datenbank mit PostgreSQL](#datenbank-mit-postgresql)
  - [Umgebungsvariable für Windows](#umgebungsvariable-für-windows)
- [Installation](#installation)
  - [Node und npm überprüfen](#node-und-npm-überprüfen)
  - [pnpm installieren](#pnpm-installieren)
  - [pnpm überprüfen](#pnpm-überprüfen)
  - [pnpm ggf. deinstallieren](#pnpm-ggf-deinstallieren)
  - [Software-Pakete in node_modules mit pnpm installieren](#software-pakete-in-node_modules-mit-pnpm-installieren)
  - [Indirekt genutzte Packages](#indirekt-genutzte-packages)
  - [Meta-Informationen zu einem Package](#meta-informationen-zu-einem-package)
- [Drizzle-Schema für ein neues Projekt](#drizzle-schema-für-ein-neues-projekt)
  - [Initiales Drizzle-Schema erstellen](#initiales-drizzle-schema-erstellen)
  - [Schema anpassen](#schema-anpassen)
- [Einfache Beispiele in TypeScript](#einfache-beispiele-in-typescript)
- [Aufruf der Beispiele](#aufruf-der-beispiele)
- [Neuere Versionen und evtl. Sicherheitslücken](#neuere-versionen-und-evtl-sicherheitslücken)
- [Drizzle Studio](#drizzle-studio)

## Vorbereitung der Installation

- Das Beispiel _nicht_ in einem Pfad mit _Leerzeichen_ installieren.
  Viele Javascript-Bibliotheken werden unter Linux entwickelt und dort benutzt
  man **keine** Leerzeichen in Pfaden. Ebenso würde ich das Beispiel nicht auf
  dem _Desktop_ auspacken bzw. installieren.

- Bei z.B. [GitHub](https://github.com) oder [GitLab](https://gitlab.com)
  registrieren, falls man dort noch nicht registriert ist.

---

## Voraussetzungen

### Skripte für Powershell bei Windows

Überprüfung, ob sich Powershell-Skripte starten lassen:

```powershell
    Get-ExecutionPolicy -list
```

`CurrentUser` muss _zumindest_ das Recht `RemoteSigned` haben. Ggf. muss dieses
Ausführungsrecht gesetzt werden:

```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Ggf. genügt `RemoteSigned` nicht und man muss `Bypass` verwenden, sodass
keine Ausführung blockiert wird und dabei keine Warnings ausgegeben werden.
Das hängt von der eigenen Windows-Installation ab. Details siehe
https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.security/set-executionpolicy?view=powershell-7.2

### Docker Desktop

Außerdem sollte _Docker Desktop_ installiert sein
(https://docs.docker.com/desktop/release-notes) und kann folgendermaßen überprüft werden:

```shell
    # Windows:
    Get-Command docker

    # macOS / Linux:
    which docker

    docker info
```

### Git, Node und Bruno für Windows

Für _Windows_ gibt es in _ILIAS_ die ZIP-Datei `Zimmermann.zip`. Bevor man diese
ZIP-Datei unter `C:\Zimmermann` entpackt, sollten die Verzeichnisse
`C:\Zimmermann\Git` und `C:\Zimmermann\node` gelöscht werden, falls sie noch vom
letztem Semester vorhanden sind.

### 3rd-party-Software für macOS und Linux

Für _Linux_ und _macOS_ muss folgende Software installiert sein (z.B. mit _brew_ bei macOS oder
apt_ bei Linux):

- Bruno
- Git
- GraphViz (wird für PlantUML benötigt)
- Node
- VS Code (siehe ReadMe.vscode.md)

### Docker-Image für PostgreSQL

Das aktuelle Image für _PostgreSQL_ wird von _Docker Hub_ heruntergeladen. Die
aktuelle Versionsnummer kann man `extras\compose\postgres\compose.yml` entnehmen.

```shell
    docker pull dhi.io/postgres:<VERSION>-debian13
```

### Datenbank mit PostgreSQL

Die DB mit _PostgreSQL_ wird gemäß `extras\compose\postgres\ReadMe.md` aufgesetzt.

Bei macOS und Linux sind in `extras\compose\postgres\compose.yaml` Anpassungen
für die Volumes notwendig, um für das Mounting folgende Verzeichnisse zu haben:

- csv
- data
- run
- sql
- tablespace
- tls

Für csv, sql und tls gibt es in ILIAS die ZIP-Datei `postgres.macos-linux.zip.zip`.
Die anderen Verzeichnisse (data, run und tablespace) müssen lediglich als zunächst
leere Verzeichnisse existieren.

### Umgebungsvariable für Windows

Vorab werden die notwendigen Umgebungsvariable gesetzt, damit nicht bei jeder
nachfolgenden Installation immer wieder einzelne Umgebungsvariable gesetzt werden
müssen.

`[Windows-Taste]` betätigen, dann als Suchstring `Systemumgebungsvariablen bearbeiten`
eingeben und auswählen.

Bei _Systemvariable_ (**nicht** bei _Benutzervariable_) folgende
Umgebungsvariable mit den jeweiligen Werten eintragen. Die Werte für `PATH`
_vor_ Pfaden mit _Leerzeichen_ eintragen.

| Name der Umgebungsvariable | Wert der Umgebungsvariable |
| -------------------------- | -------------------------- |
| `GIT_HOME`                 | `C:\Zimmermann\git` |
| `PNPM_HOME`                | `%LOCALAPPDATA%\pnpm` |
| `PATH`                     | `C:\Zimmermann\node`;`%PNPM_HOME%\bin`,`%GIT_HOME%\cmd`;`%GIT_HOME%\bin`;`C:\Zimmermann\k6`;`C:\Zimmermann\Graphviz\bin`; |

## Installation

### Node und npm überprüfen

Ob _Node_ und _npm_ korrekt installiert sind, kann folgendermaßen überprüft werden:

```shell
    Get-Command node
    node --version
    Get-Command npm
    npm --version
```

Bei Linux und macOS gibt man in einer Shell die nachfolgenden Kommandos ein:

```shell
    which node
    node --version
    which npm
    npm --version
```

### pnpm installieren

Bei Windows erfolgt die Installation im Pfad `$$env:LOCALAPPDATA\pnpm`.

```shell
    # Windows:
    Invoke-WebRequest https://get.pnpm.io/install.ps1 -UseBasicParsing | Invoke-Expression

    # macOS / Linux:
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    # oder falls curl nicht installiert ist:
    wget -qO- https://get.pnpm.io/install.sh | sh -
```

Damit bei _Windows_ der _Defender_ künftige Installationen mit pnpm nicht signifikant
verlangsamt, sollte das Verzeichnis `$env:$LOCALAPPDATA\pnpm` von der Echtzeitüberwachung
ausgeschlossen werden, was als _Administrator_ durchgeführt werden muss.

```shell
    # Windows PowerShell als Administrator starten
    Add-MpPreference -ExclusionPath "<LOCALAPPDATA des Benutzers>\pnpm\store\v11"
```

Bei _macOS_ und _Linux_ wird pnpm im Verzeichnis `$HOME/.local/share/pnpm` installiert.
Die Umgebungsvariable `PNPM_HOME` wird automatisch auf dieses Verzeichnis gesetzt
und die Umgebungsvariable `PATH` wird entsprechend ergänzt.

### pnpm überprüfen

Zur Überprüfung kann man die nachfolgenden Kommandos eingeben:

```shell
    # Windows:
    Get-Command pnpm
    pnpm --version

    # macOS / Linux:
    which pnpm
    pnpm --version
```

### pnpm ggf. deinstallieren

pnpm wird folgendermaßen deinstalliert:

```shell
    # Windows:
    Remove-Item -Recurse -Force $env:PNPM_HOME

    # macOS / Linux:
    rm -rf $PNPM_HOME
```

Danach muss `%PNPM_HOME%/bin` bzw. `$PNPM_HOME` aus der Umgebungsvariable `PATH`
entfernt werden und die Umgebungsvariable `PNPM_HOME` kann gelöscht werden.

### Software-Pakete in node_modules mit pnpm installieren

Die Softwarepakete aus `package.json` für _Drizzle_ werden mit _pnpm_ folgendermaßen installiert:

```shell
    pnpm i
```

### Indirekt genutzte Packages

```shell
    pnpm why pg-pool
```

### Meta-Informationen zu einem Package

Mit dem nachfolgenden Kommando können Meta-Informationen zu einem Package, z.B.
`drizzle-orm`, abgerufen werden (siehe `package.json`):

```shell
    pnpm view drizzle-orm
```

---

## Drizzle-Schema für ein NEUES Projekt

Für dieses Projektbeispiel **ÜBERSPRINGEN**, weil `src\db\schema.mts` schon existiert.

### Initiales Drizzle-Schema erstellen

Um ein neues Drizzle-Schema zu erstellen, muss die Umgebungsvariable `DATABASE_URL`
gesetzt sein:

```shell
    # Windows:
    $env:DATABASE_URL='postgresql://buch:p@localhost/buch?schema=buch&connection_limit=5&sslnegotiation=direct&sslcert=src/config/postgresql/server.crt'

    # macOS:
    DATABASE_URL='postgresql://buch:p@localhost/buch?schema=buch&connection_limit=5&sslnegotiation=direct&sslcert=src/config/postgresql/server.crt'
```

Dadurch ist folgendes konfiguriert:

- Benutzername: `buch`
- Passwort: `p`
- DB-Host: `localhost`
- DB-Name: `buch`
- Schema: `buch`
- Größe des Verbindungs-Pool: max. `5` Verbindungen
- SSL: durch die Zertifikatsdatei `server.crt` im Verzeichnis `src\config\postgresql`

Außerdem muss die Konfigurationsdatei `drizzle.config.ts` im Wurzelverzeichnis existieren, in welcher
Folgendes konfiguriert ist:

- _PostgreSQL_ als Datenbank-System
- URL für den DB-Zugriff mit der Umgebungsvariable `DATABASE_URL`
- Schema der DB, das für die Tabellen verwendet werden soll (hier: `buch`)
- Verzeichnis für die zu generierendden Dateien `schema.ts` und `relations.ts` (hier: `drizzle`)
- DB-Schema in TypeScript für _Drizzle Studio_ (s.u.)

Jetzt werden die beiden Dateien `schema.ts` und `relations.ts` im Verzeichnis `drizzle` generiert:

```shell
    pnpm exec drizzle-kit pull
```

### Schema anpassen

Nachdem die Dateien im Verzeichnis `drizzle` generiert wurden, kopiert man sie als _ESM-Module_
mit der Endung `.mts` in das Verzeichnis `src/db`. Danach empfiehlt es sich, `schema.mts` anzupassen
und zu ändern:

- Falls Variablen vor ihrer Definition verwendet werden, muss man die Reihenfolge ändern.
- Die Drizzle-Methode`.defaultNow()` kann man statt `.default(sql`now()`)` verwenden.
- Die Variable für das Schema kann man `...Schema` nennen, z.B. `buchSchema`
- Die Variablen für die Tabellen kann man `...Table` nennen, z.B. `buchTable`

So erkennt man später in den TypeScript-Dateien, dass es sich um das DB-Schema und um die DB-Tabellen
handelt.

Die Änderungen der Schema- und Tabellen-Variablen zieht man anschließend in der Datei
`relations.mts` nach. Außerdem empfiehlt es sich, in `relations.mts` den sogenannten _Namespace Import_
`import * as schema from "./schema";` durch _Named Imports_ mit den Variablen der Tabellen-Namen zu
ersetzen, z.B. `import { abbildungTable, buchTable, titelTable } from './schema.mts';`.

---

## Einfache Beispiele in TypeScript

In den beiden Dateien `src\beispiele.mts` und `src\beispiele-write.mts` sind einfache
Beispiele in TypeScript enthalten, die zeigen, wie man mit _Drizzle_ auf die
Datenbank zugreifen kann.

## Aufruf der Beispiele

Die beiden Beispiel-Dateien `src\beispiele.mts` und `src\beispiele-write.mts`
können mit _Node_ folgendermaßen aufgerufen werden:

```shell
    node --env-file=.env src/beispiele.mts
    node --env-file=.env src/beispiele-write.mts

    pnpm run tsc
    node --env-file=.env dist/src/beispiele.mjs
    node --env-file=.env dist/src/beispiele-write.mjs

    bun --env-file=.env src/beispiele.mts
    bun --env-file=.env src/beispiele-write.mts
```

## Neuere Versionen und evtl. Sicherheitslücken

Mit _pnpm_ können neuere Versionen der Software-Pakete aus `package.json` ermittelt
und auch auf Sicherheitslücken überprüft werden:

```shell
    pnpm outdated
    pnpm audit
    pnpm audit --prod
```

## Drizzle Studio

_Drizzle Studio_ ist eine Alternative zur Erweiterung _PostgreSQL_ für _VS Code_. Der Aufruf mit
_pnpm_ lautet folgendermaßen:

```shell
    pnpm exec drizzle-kit studio
```

Nun kann man in einem Webbrowser `https://local.drizzle.studio` aufrufen, weshalb eine Internet-Verbindung
erforderlich ist. An der Oberfläche von Drizzle Studio muss man noch das Schema `buch` auswählen,
um die Tabellen anzuzeigen.
