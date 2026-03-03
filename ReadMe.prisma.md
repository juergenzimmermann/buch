# Hinweise zu Prisma

<!--
  Copyright (C) 2025 - present Juergen Zimmermann, Hochschule Karlsruhe

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
  - [Powershell bei Windows](#powershell-bei-windows)
  - [Basis-Software](#basis-software)
  - [Docker-Image für PostgreSQL](#docker-image-für-postgresql)
  - [Datenbank mit PostgreSQL](#datenbank-mit-postgresql)
  - [Umgebungsvariable](#umgebungsvariable)
- [Installation](#installation)
  - [Bun installieren](#bun-installieren)
  - [Bun überprüfen](#bun-überprüfen)
  - [Software-Pakete in node_modules mit Bun installieren](#software-pakete-in-node_modules-mit-bun-installieren)
  - [Indirekt genutzte Packages](#indirekt-genutzte-packages)
  - [Meta-Informationen zu einem Package](#meta-informationen-zu-einem-package)
- [Prisma-Schema für ein neues Projekt](#prisma-schema-für-ein-neues-projekt)
  - [Initiales Prisma-Schema erstellen](#initiales-prisma-schema-erstellen)
  - [Models aus einer bestehenden DB generieren](#models-aus-einer-bestehenden-db-generieren)
  - [Schema anpassen](#schema-anpassen)
- [Code-Generierung für den DB-Client](#code-generierung-für-den-db-client)
- [Einfaches Beispiel in TypeScript](#einfaches-beispiel-in-typescript)
- [Aufruf der Beispiele](#aufruf-der-beispiele)
- [Ausführbare Dateien ("Executables")](#ausführbare-dateien-executables)
- [Neuere Versionen und evtl. Sicherheitslücken](#neuere-versionen-und-evtl-sicherheitslücken)
- [Prisma Studio](#prisma-studio)

## Vorbereitung der Installation

- Das Beispiel _nicht_ in einem Pfad mit _Leerzeichen_ installieren.
  Viele Javascript-Bibliotheken werden unter Linux entwickelt und dort benutzt
  man **keine** Leerzeichen in Pfaden. Ebenso würde ich das Beispiel nicht auf
  dem _Desktop_ auspacken bzw. installieren.

- Bei [GitHub](https://github.com) oder [GitLab](https://gitlab.com)
  registrieren, falls man dort noch nicht registriert ist.

---

## Voraussetzungen

### Powershell bei Windows

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

### Basis-Software

Für _Windows_ gibt es in _ILIAS_ die ZIP-Datei `Zimmermann.zip`. Bevor man diese
ZIP-Datei unter `C:\Zimmermann` entpackt, sollten die Verzeichnisse
`C:\Zimmermann\Git` und `C:\Zimmermann\node` gelöscht werden, falls sie noch vom
letztem Semester vorhanden sind. Außerdem sollte _Docker Desktop_ installiert sein
(https://docs.docker.com/desktop/release-notes) und kann bei Windows folgendermaßen
überprüft werden:

```shell
    # Windows:
    Get-Command docker

    # macOS / Linux:
    which docker

    docker info
```

Für _Linux_ und _macOS_ muss folgende Software installiert sein (z.B. mit _apt_
bei Linux oder _brew_ bei macOS):

- Bun
- Docker Desktop
- Git
- Node
- GraphViz (wird für PlantUML benötigt)
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

### Umgebungsvariable

Vorab werden die notwendigen Umgebungsvariable gesetzt, damit nicht bei jeder
nachfolgenden Installation immer wieder einzelne Umgebungsvariable gesetzt werden
müssen.

`[Windows-Taste]` betätigen, dann als Suchstring `Systemumgebungsvariablen bearbeiten`
eingeben und auswählen.

Bei _Systemvariable_ (**nicht** bei _Benutzervariable_) folgende
Umgebungsvariable mit den jeweiligen Werten eintragen. Die Werte für `PATH`
_vor_ Pfaden mit _Leerzeichen_ eintragen.

| Name der Umgebungsvariable | Wert der Umgebungsvariable                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `GIT_HOME`                 | `C:\Zimmermann\git`                                                                                     |
| `PATH`                     | `C:\Zimmermann\node`;`%GIT_HOME%\cmd`;`%GIT_HOME%\bin`;`C:\Zimmermann\k6`;`C:\Zimmermann\Graphviz\bin`; |

## Installation

### Bun installieren

Wenn bereits _Node_ und _npm_ installiert sind, kann damit _Bun_ installiert werden:

```shell
    Get-Command node
    node --version
    Get-Command npm
    npm --version
```

Bei Linux und macOS in einer Shell die nachfolgenden Kommandos eingeben:

```shell
    which node
    node --version
    which npm
    npm --version
```

Ohne _npm_ zu verwenden, wird _Bun_ folgendermaßen installiert. Bei Windows
erfolgt die Installation im Pfad `${env:USERPROFILE}\.bun\bin`, welcher auch in
der Umgebungsvariablen `PATH` ergänzt wird. Bei macOS und Linux ist es analog
`$HOME/.bun/bin`. Außerdem wird bei Windows dann auch _Bun_ in _Installierte Apps_
eingetragen.

```shell
    # Windows:
    powershell -c "irm bun.sh/install.ps1|iex"

    # macOS / Linux:
    curl -fsSL https://bun.sh/install | bash
```

### Bun überprüfen

Zur Überprüfung kann man die nachfolgenden Kommandos eingeben:

```shell
    # Windows:
    Get-Command bun
    bun --version

    # macOS / Linux:
    which bun
    bun --version
```

### Software-Pakete in node_modules mit Bun installieren

Die Softwarepakete für _Prisma_ werden mit _Bun_ folgendermaßen installiert:

```shell
    bun i
```

### Indirekt genutzte Packages

```shell
    bun why body-parser
```

### Meta-Informationen zu einem Package

Mit dem nachfolgenden Kommando können Meta-Informationen zu einem Package, z.B.
`prisma`, abgerufen werden (siehe `package.json`):

```shell
    bun pm view prisma
```

---

## Prisma-Schema für ein NEUES Projekt

Für dieses Projektbeispiel **ÜBERSPRINGEN**, weil `prisma\schema.prisma` schon existiert.
Es geht weiter im Abschnitt [Code-Generierung für den DB-Client](#code-generierung-für-den-db-client).

### Initiales Prisma-Schema erstellen

Um ein neues Prisma-Schema zu erstellen, muss die Umgebungsvariable `DATABASE_URL`
gesetzt sein:

```shell
    # Windows:
    $env:DATABASE_URL='postgresql://buch:p@localhost/buch?schema=buch&connection_limit=10&sslnegotiation=direct?sslcert=src/config/resources/postgresql/server.crt'

    # macOS:
    DATABASE_URL='postgresql://buch:p@localhost/buch?schema=buch&connection_limit=10&sslnegotiation=direct?sslcert=src/config/resources/postgresql/server.crt'
```

Dadurch ist folgendes konfiguriert:

- Benutzername: `buch`
- Passwort: `p`
- DB-Host: `localhost`
- DB-Name: `buch`
- Schema: `buch`
- Größe des Verbindungs-Pools: max. `10` Verbindungen
- SSL: durch die Zertifikatsdatei `server.crt` im Verzeichnis `src\config\resources\postgresql`

Nun kann man ein neues Prisma-Schema erstellen, d.h. im Verzeichnis `prisma`
wird die Datei `schema.prisma` angelegt. Das Verzeichnis `prisma` darf dabei
noch nicht existieren.

```shell
    bun prisma init
```

Dabei werden folgende Dateien generiert:

- `prisma.config.ts` siehe https://github.com/prisma/prisma/releases/tag/6.18.0
- `prisma\schema.prisma`
- `.env`
- `.gitignore`

Falls `.env` bereits existiert, wird ggf. `DATABASE_URL` als Umgebungsvariable
eingetragen. Der Wert von `DATABASE_URL` muss auf jeden Fall mit dem Wert
übereinstimmen, den man zuvor in der Shell gesetzt hatte (s.o.).

In `prisma\schema.prisma` ergänzt man den Abschnitt `generator client` um
folgende Einträge, damit später die neuesten Features von Prisma genutzt werden
können:

```prisma
    generator client {
        ...
        previewFeatures = ["nativeDistinct", "relationJoins"]
        engineType      = "client"
    }
```

### Models aus einer bestehenden DB generieren

Als nächstes müssen Prisma-Models aus der bestehenden DB generiert werden,
um später das OR-Mapping zu ermöglichen. Dazu muss der DB-Server mit einer
existierenden DB gestartet sein:

```powerhell
    cd extras\compose\postgres
    docker compose up
```

Nun wird die Generierung durchgeführt, so dass die Datei `prisma\schema.prisma`
um die Models für das spätere OR-Mapping ergänzt wird:

```shell
    bun --env-file=.env prisma db pull
```

Warnungen, dass _Check-Constraints_ nicht unterstützt werden, können ignoriert
werden, weil an der API-Schnittstelle (z.B. REST) des künftigen Appservers,
Validierungsfehler überprüft werden.

### Schema anpassen

Nachdem die Models generiert wurden, empfiehlt es sich das Schema anzupassen, z.B.:

- PascalCase für die Model-Namen, z.B. `B`uch statt `b`uch.
  - Bei jedem umbenannten Model muss am Ende `@@map` ergänzt werden, z.B. @@map("buch").
- camelCase für die Field-Namen, z.B. `buchId` statt `buch_id`.
  - Bei jedem umbenannten Field muss `@map` ergänzt werden, z.B. @map("buch_id").
  - Bei jeder `@relation` muss bei `fields` der geänderte Name eingetragen werden.
- Bei 1:N-Beziehungen sollte ein Plural für die Field-Namen verwendet werden,
  z.B. abbildung`en` statt abbildung
- Bei Fields, die für den Zeitstempel der letzten Änderung verwendet werden,
  sollte `@updatedAt` ergänzt werden.
- Bei den Models sollte am Ende `@@schema` ergänzt werden, damit die späteren
  JavaScript-Objekte auf Datensätze in Tabellen im gewünschten Schema abgebildet
  werden.

Außerdem sollte in `prisma\schema.prisma` der eigene Schema-Name (hier: `buch`)
eingetragen werden:

```prisma
  ...
  datasource db {
    provider = "postgresql"
    schemas  = ["buch"]
  }
```

---

## Code-Generierung für den DB-Client

Das Prisma-Schema enthält nun die exakten Abbildungsvorschriften für das
künftige OR-Mapping. Mit diesem Schema kann nun der Prisma-Client generiert
werden, der später für das OR-Mapping in TypeScript verwendet wird:

```shell
    bun --env-file=.env prisma generate
```

---

## Einfaches Beispiel in TypeScript

Jetzt kann man mit TypeScript auf die DB zugreifen, z.B.:

```typescript
// src/beispiel.mts
// Aufruf:   node --env-file=.env src\beispiel.mts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  await prisma.$connect();
  const buecher = await prisma.buch.findMany();
  console.log(`buecher=${JSON.stringify(buecher)}`);
} finally {
  await prisma.$disconnect();
}
```

Der obige Prisma-Client `prisma.buch` greift auf die Tabelle `buch` in der
konfigurierten PostgreSQL-DB zu. Dabei werden die npm-Packages _@prisma/client_
und _@prisma/adapter-pg_ verwendet, die in `package.json` als `dependency`
eingetragen sind. @prisma/adapter-pg wiederum verwendet intern das npm-Package
_pg_ (siehe https://node-postgres.com).
.

## Aufruf der Beispiele

Die beiden Beispiel-Dateien `src\beispiele.mts` und `src\beispiele-write.mts`
können mit _Node_ folgendermaßen aufgerufen werden:

```shell
    bun --env-file=.env src/beispiele.mts
    bun --env-file=.env src/beispiele-write.mts
```

## Ausführbare Dateien ("Executables")

_Bun_ kann auch ausführbare Dateien ("Executables") erstellen, die alle notwendigen
Abhängigkeiten enthalten. Das ist für die Bereitstellung eines Servers oder für
die Verteilung an andere Benutzer nützlich, da keine separate Installation von
Bun oder den Abhängigkeiten erforderlich ist.

```shell
    bun run build
    bun run build:write
```

Dabei wird das jeweilige Skript aus `package.json` ausgeführt, welches die
ausführbare Datei im aktuellen Verzeichnis erstellt.

## Neuere Versionen und evtl. Sicherheitslücken

Mit _Bun_ können neuere Versionen der Software-Pakete aus `package.json` ermittelt
und auch auf Sicherheitslücken überprüft werden:

```shell
    bun outdated
    bun audit
    bun audit --prod
```

## Prisma Studio

Während die Erweiterung _PostgreSQL_ für VS Code nur Daten anzeigen kann, kann
_Prisma Studio_ auch Daten einfügen, ändern und löschen. Der Aufruf mit _Bun_
lautet folgendermaßen, wobei man an der Oberfläche von Prisma Studio noch das
Schema `buch` auswählen muss, um die Tabellen anzuzeigen:

```shell
    # Windows:
    $env:DATABASE_URL='postgresql://buch:p@localhost/buch'

    # macOS / Linux:
    DATABASE_URL='postgresql://buch:p@localhost/buch'

    bunx prisma studio
```

Durch den Menüpunkt _Visualizer_ kann man sich die Beziehungen zwischen den Tabellen anzeigen lassen.
