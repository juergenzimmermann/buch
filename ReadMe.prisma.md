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

- [Installation und Voraussetzungen](#installation-und-voraussetzungen)
  - [Powershell bei Windows](#powershell-bei-windows)
  - [Basis-Software](#basis-software)
  - [Umgebungsvariable](#umgebungsvariable)
  - [Node und npm überprüfen](#node-und-npm-überprüfen)
  - [pnpm aktivieren](#pnpm-aktivieren)
  - [node_modules initialisieren](#node_modules-initialisieren)
  - [Docker-Image für PostgreSQL](#docker-image-für-postgresql)
  - [Datenbank mit PostgreSQL](#datenbank-mit-postgresql)
- [Schema für ein neues Projekt](#schema-für-ein-neues-projekt)
  - [Initiales Schema erstellen](#initiales-schema-erstellen)
  - [Models aus einer bestehenden DB generieren](#models-aus-einer-bestehenden-db-generieren)
  - [Schema anpassen](#schema-anpassen)
- [Code-Generierung für den DB-Client](#code-generierung-für-den-db-client)
- [Einfaches Beispiel in TypeScript](#einfaches-beispiel-in-typescript)
- [Aufruf der Beispiele](#aufruf-der-beispiele)
- [Prisma Studio](#prisma-studio)

**BEACHTE: Prisma 7.0.0 kann nicht mit pnpm verwendet werden** https://github.com/prisma/prisma/issues/28581.

## Installation und Voraussetzungen

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

Für _Windows_ gibt es in _ILIAS_ ZIP-Datei `Zimmermann.zip`. Bevor man diese
ZIP-Datei unter `C:\Zimmermann` entpackt, sollten die Verzeichnisse
`C:\Zimmermann\Git` und `C:\Zimmermann\node` gelöscht werden, falls sie noch vom
letztem Semester vorhanden sind. Außerdem sollte _Docker Desktop_ installiert sein
(https://docs.docker.com/desktop/release-notes) und kann bei Windows folgendermaßen
überprüft werden:

```powershell
    Get-Command docker
    docker info
```

Für _Linux_ und _macOS_ muss folgende Software installiert sein (z.B. mit _apt_
bei Linux oder _brew_ bei macOS):

- Docker Desktop
- Git
- Node
- Python (wird für node-gyp benötigt)
- GraphViz (wird für PlantUML benötigt)

### Umgebungsvariable

Vorab werden die notwendigen Umgebungsvariable gesetzt, damit nicht bei jeder
nachfolgenden Installation immer wieder einzelne Umgebungsvariable gesetzt werden
müssen.

`[Windows-Taste]` betätigen, dann als Suchstring `Systemumgebungsvariablen bearbeiten`
eingeben und auswählen.

Bei _Systemvariable_ (**nicht** bei _Benutzervariable_) folgende
Umgebungsvariable mit den jeweiligen Werten eintragen. Die Werte für `PATH`
_vor_ Pfaden mit _Leerzeichen_ eintragen.

| Name der Umgebungsvariable | Wert der Umgebungsvariable                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `GIT_HOME`                 | `C:\Zimmermann\git`                                                                                                             |
| `PYTHON`                   | `C:\Zimmermann\Python\python.exe`                                                                                               |
| `PATH`                     | `C:\Zimmermann\node`;`%GIT_HOME%\cmd`;`%GIT_HOME%\bin`;`C:\Zimmermann\Python`;`C:\Zimmermann\k6`; `C:\Zimmermann\Graphviz\bin`; |

### Node und npm überprüfen

Bei Windows in einer Powershell die nachfolgenden Kommandos eingeben:

```powershell
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

### pnpm aktivieren

Um `pnpm` (performant node package manager) zu konfigurieren, werden zunächst
evtl. vorhandene Installationen von `pnpm` und `yarn` entfernt. `corepack` wird
ab Node 25 nicht mehr in der Distribution für Node enthalten sein.

```shell
    npm r -g pnpm yarn
    npm i -g corepack

    corepack enable pnpm
    corepack prepare pnpm@latest-10 --activate
```

### node_modules initialisieren

Softwarepakete für _Prisma_ und für die spätere Entwicklung mit z.B. _Nest_
werden folgendermaßen installiert.

```shell
    pnpm i
```

### Docker-Image für PostgreSQL

Das aktuelle Image für _PostgreSQL_ wird von _Docker Hub_ heruntergeladen:

```shell
    docker pull postgres:18.0-trixie
```

### Datenbank mit PostgreSQL

Die DB mit _PostgreSQL_ wird gemäß `.extras\compose\postgres\ReadMe.md` aufgesetzt.

Bei macOS und Linux sind in `.extras\compose\postgres\compose.yaml` Anpassungen
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

---

## Schema für ein NEUES Projekt

Für dieses Projektbeispiel **ÜBERSPRINGEN**, weil `prisma\schema.prisma` schon existiert.
Es geht weiter im Abschnitt [Code-Generierung für den DB-Client](#code-generierung-für-den-db-client).

### Initiales Schema erstellen

Um ein neues Prisma-Schema zu erstellen, muss die Umgebungsvariable `DATABASE_URL`
gesetzt sein:

```shell
    # Windows:
    $env:DATABASE_URL='postgresql://buch:p@localhost/buch?schema=buch&connection_limit=10&sslnegotiation=direct?sslcert=../src/config/resources/postgresql/certificate.cer'

    # macOS:
    DATABASE_URL='postgresql://buch:p@localhost/buch?schema=buch&connection_limit=10&sslnegotiation=direct?sslcert=../src/config/resources/postgresql/certificate.cer'
```

Dadurch ist folgendes konfiguriert:

- Benutzername: `buch`
- Passwort: `p`
- DB-Host: `localhost`
- DB-Name: `buch`
- Schema: `buch`
- Größe des Verbindungs-Pools: max. `10` Verbindungen
- SSL: durch die Zertifikatsdatei `certificate.cer` im Verzeichnis `src\config\resources\postgresql`

Nun kann man ein neues Prisma-Schema erstellen, d.h. im Verzeichnis `prisma`
wird die Datei `schema.prisma` angelegt. Das Verzeichnis `prisma` darf dabei
noch nicht existieren.

```shell
    pnpm prisma init
```

Dabei werden folgende Dateien generiert:

- `prisma.config.ts` siehe https://github.com/prisma/prisma/releases/tag/6.18.0
- `prisma\schema.prisma`

In der Datei `.env` wurde `DATABASE_URL` als Umgebungsvariable eingetragen.
Diesen Wert überschreibt man mit dem Wert, den man zuvor in der Shell gesetzt
hatte (s.o.).

### Models aus einer bestehenden DB generieren

Als nächstes müssen Prisma-Models aus der bestehenden DB generiert werden,
um später das OR-Mapping zu ermöglichen. Dazu muss der DB-Server mit einer
existierenden DB gestartet sein:

```powerhell
    cd .extras\compose\postgres
    docker compose up
```

Nun wird die Generierung durchgeführt, so dass die Datei `prisma\schema.prisma`
um die Models für das spätere OR-Mapping ergänzt wird:

```shell
    pnpm prisma db pull
```

Warnungen, dass _Check-Constraints_ nicht unterstützt werden, können ignoriert werden,
weil an der API-Schnittstelle (z.B. REST) des künftigen Appservers, Validierungsfehler
überprüft werden.

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

Um die neuesten Features von Prisma zu nutzen, sollten im Schema auch folgende
Einträge angepasst werden, wobei der Schema-Name `buch` durch den eigenen
Schema-Namen zu ersetzen ist. Zu beachten ist insbesondere, dass `prisma-client`
als provider für den Generator verwendet wird.

```prisma
  generator client {
    provider        = "prisma-client"
    output          = "../src/generated/prisma"
    previewFeatures = ["nativeDistinct", "relationJoins"]
    engineType      = "client"
  }
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
    pnpm prisma generate
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

## Aufruf der Beispiele

Die beiden Beispiel-Dateien `src\beispiele.mts` und `src\beispiele-write.mts`
können mit _Node_ folgendermaßen aufgerufen werden:

```shell
    node --env-file=.env src/beispiele.mts
    node --env-file=.env src/beispiele-write.mts
```

## Prisma Studio

Statt z.B. der Erweiterung _PostgreSQL_ für VS Code, kann auch _Prisma Studio_
als DB-Werkzeug verwendet werden:

```shell
    pnpx prisma studio
```

## Ausblick für Nest

Nachdem das Prisma-Schema in der Datei `prisma/schema.prisma` erstellt wurde,
sind für das _Nest_-basierte Projekt folgende Anpassungen notwendig:

- In `tsconfig.json`, weil beim direkten Arbeiten mit _Node_ das Feature _Type
  Stripping_ genutzt wurde, d.h. Node wurde aufgerufen und die Typen von
  _TypeScript_ wurden zur Laufzeit einfach weggelassen. _Nest_ verwendet dagegen
  _übersetzten_ Code, d.h. _JavaScript_.
  - bei der Option `emitDecoratorMetadata` den Kommentar entfernen
  - die Option `noEmit` auskommentieren
  - die Option `allowImportingTsExtensions` auskommentieren
- Der Prisma-Client muss deshalb auch neu generiert werden, d.h.
  - das Verzeichnis `src\generated` wird gelöscht und
  - `pnpx prisma generate` wird in der PowerShell aufgerufen.
- Die bisherigen Beispieldateien `beispiele.mts` und `beispiele-write.mts`
  für den "alten" Prisma-Client können deshalb nicht mehr funktionieren, weshalb
  man sie am einfachsten aus dem Projekt löscht.
