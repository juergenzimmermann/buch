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

> Diese Datei ist in Markdown geschrieben und kann mit `<Strg><Shift>v` in
> Visual Studio Code leicht gelesen werden.
>
> Näheres zu Markdown gibt es z.B. bei [Markdown Guide](https://www.markdownguide.org/)
>
> Nur in den ersten beiden Vorlesungswochen kann es Unterstützung bei
> Installationsproblemen geben.

## Inhalt

- [Hinweise zum Programmierbeispiel](#hinweise-zum-programmierbeispiel)
  - [Inhalt](#inhalt)
  - [Vorbereitung von Prisma für Nest](#vorbereitung-von-prisma-für-nest)
  - [Download- und ggf. Upload Geschwindigkeit](#download--und-ggf-upload-geschwindigkeit)
  - [Vorbereitung der Installation](#vorbereitung-der-installation)
  - [ES Modules (= ESM)](#es-modules--esm)
  - [Node Best Practices](#node-best-practices)
  - [Lokaler Appserver mit Nest und dem Watch-Modus](#lokaler-appserver-mit-nest-und-dem-watch-modus)
  - [Postman: Desktop-Anwendung und Extension für VS Code](#postman-desktop-anwendung-und-extension-für-vs-code)
    - [Registrieren und Installieren](#registrieren-und-installieren)
    - [Workspace anlegen](#workspace-anlegen)
    - [Environments](#environments)
    - [Collections und Folders](#collections-und-folders)
    - [Requests](#requests)
    - [Variable](#variable)
    - [Tokens durch Pre-request Scripts und Authorization-Header](#tokens-durch-pre-request-scripts-und-authorization-header)
    - [Tests in Postman](#tests-in-postman)
    - [Erweiterung für VS Code](#erweiterung-für-vs-code)
  - [Tests aufrufen](#tests-aufrufen)
  - [Docker-Image und Docker Compose](#docker-image-und-docker-compose)
    - [Minimales Basis-Image](#minimales-basis-image)
    - [Image erstellen](#image-erstellen)
    - [Image inspizieren](#image-inspizieren)
      - [docker inspect](#docker-inspect)
      - [docker sbom](#docker-sbom)
    - [Docker Compose](#docker-compose)
  - [Statische Codeanalyse und Formattierer](#statische-codeanalyse-und-formatierer)
    - [ESLint](#eslint)
    - [Prettier](#prettier)
    - [SonarQube](#sonarqube)
    - [Madge](#madge)
  - [Sicherheitslücken](#sicherheitslücken)
    - [pnpm audit](#pnpm-audit)
    - [OWASP Dependency Check](#owasp-dependency-check)
    - [Docker Scout](#docker-scout)
  - [OpenAPI](#openapi)
  - [AsciiDoctor und PlantUML](#asciidoctor-und-plantuml)
  - [TypeDoc](#typedoc)
  - [Continuous Integration mit Jenkins](#continuous-integration-mit-jenkins)
  - [Visual Studio Code](#visual-studio-code)
  - [Empfohlene Code-Konventionen](#empfohlene-code-konventionen)

---

## Vorbereitung von Prisma für Nest

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

---

## Download- und ggf. Upload Geschwindigkeit

In einem Webbrowser kann man z.B. mit der URL `https://speed.cloudflare.com` die
Download- und die Upload-Geschwindigkeit testen.

Alternativ kann man durch das Kommando `fast` in einer Powershell die aktuelle
Download-Geschwindigkeit ermitteln. Mit der zusätzlichen Option `--upload` kann
zusätzlich die aktuelle Upload-Geschwindigkeit ermittelt werden.

---

## Vorbereitung der Installation

- Das Beispiel _nicht_ in einem Pfad mit _Leerzeichen_ installieren.
  Viele Javascript-Bibliotheken werden unter Linux entwickelt und dort benutzt
  man **keine** Leerzeichen in Pfaden. Ebenso würde ich das Beispiel nicht auf
  dem  _Desktop_ auspacken bzw. installieren.

- Bei [GitHub](https://github.com) oder [GitLab](https://gitlab.com)
  registrieren, falls man dort noch nicht registriert ist.

---

## ES Modules (= ESM)

ESM ist die gängige Abkürzung für _ES Modules_, so dass man `import` und
`export` statt `require()` aus _CommonJS_ verwenden kann. Die Unterstützung von
ESM wurde in Node ab Version 12 begonnen. Außerdem ist es wichtig, das man beim
Umstieg auf ESM auch die Unterstützung in _ts-node_ und _ts-jest_ beachtet.

Wenn man ESM verwendet, muss man die eigenen Module z.B. folgendermaßen
importieren:

```javascript
    import { myFunc } from './foo.js';
    import { myClass } from './bar/index.js';
```

Außerdem gibt es ab Node 17.1 das _Node Protocol_ für den Import von
_Builtin Modules_, z.B.:

```javascript
    import { resolve } from 'node:path';
```

Gute Literatur zu ESM gibt es bei:

- https://nodejs.org/api/esm.html#esm_node_imports
- https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
- https://docs.joshuatz.com/cheatsheets/node-and-npm/node-esm
- https://www.typescriptlang.org/docs/handbook/esm-node.html
- https://github.com/TypeStrong/ts-node/issues/1007

Unterstützung für ESM ist notwendig in:

- Node
- TypeScript
- ts-node
- ts-jest: versteht noch nicht die Datei-Endung `.mts` und beim Import `.mjs`
- VS Code
- Node innerhalb von Jenkins

---

## Node Best Practices

Sehr empfehlenswert ist https://github.com/goldbergyoni/nodebestpractices

---

## Lokaler Appserver mit Nest und dem Watch-Modus

Durch `pnpm run dev` wird der Appserver im _Watch_-Modus für die
Entwicklung gestartet, d.h. bei Code-Änderungen wird der Server automatisch
neu gestartet.

Beim Starten des Appservers wird außerdem mit _TypeORM_ auf die Datenbank
zugegriffen. Der Benutzername und das Passwort sind in der Datei
`src\config\db.ts` auf `admin` und `p` voreingestellt. Durch die Property
`db.populate` in `src\config\resources\buch.yml` wird festgelegt, ob die
(Test-) DB `buch` neu geladen wird.

---

## Postman: Desktop-Anwendung und Extension für VS Code

Mit der Desktop-Applikation _Postman_ wie auch mit der Erweiterung _Postman_ für
VS Code kann man u.a. REST-, GraphQL und gRPC-Schnittstellen interaktiv testen.

### Registrieren und Installieren

Zunächst muss man sich bei https://www.postman.com registrieren und kann danach
die Desktop-Application _Postman_ von https://www.postman.com/downloads
herunterladen und installieren. Die Installation erfolgt dabei im Verzeichnis
`${LOCALAPPDATA}\Postman\app-VERSION`, z.B. `C:\Users\MeineKennung\AppData\Local\Postman\app-VERSION`.

### Workspace anlegen

Über die Desktop-Applikation legt man sich folgendermaßen einen _Workspace_ an:

- Den Menüpunkt _Workspaces_ anklicken
- Im Drop-Down Menü den Button _Create Workspace_ anklicken
- Danach den Button _Next_ anklicken
- Im Eingabefeld _Name_ `buch` und im Eingabefeld _Summary_ z.B.
  `REST- und GraphQL-Requests für den Appserver.`
- Abschließend den Button _Create_ anklicken.

### Environments

Zunächst legt man ein _Environment_ mit Variablen an. Dazu wählt man am
linken Rand den Menüpunkt _Environments_, klickt auf den Button `Import`
und wählt aus dem Verzeichnis `.extras\postman` die Datei `buch.postman_environment.json`
aus. Jetzt hat man die Umgebung `buch` mit der Variablen `base_url` und dem
Wert `https://localhost:3000` angelegt.

Im Environment `buch` muss man die Variable `client_secret` auf den Wert setzen,
der in Keycloak beim _Realm acme_ in _Clients > buch-client > Credentials_
bei _Client Secret_ steht.

### Collections und Folders

Als nächstes wählt man den Menüpunkt _Collections_ aus und importiert der Reihe
nach _Collections_ aus dem Verzeichnis `.extras\postman`, indem man den Button
`Import` anklickt. Collections sind zusammengehörige Gruppierungen von Requests
und können zur besseren Strukturierung in _Folder_ unterteilt werden.
Beispielsweise gibt es die Collection _REST_ mit untergeordneten Folder, wie
z.B. _Suche mit ID_ und _Neuanlegen_. Im Folder _Suche mit ID_ gibt es dann z.B.
den Eintrag _GET vorhandene ID 1_, um einen GET-Request mit dem Pfadparameter
`:id` und dem Wert `1` abzusetzen.

Eine neue Collection legt man mit dem Button _+_ an und einen untergeordneten
Folder mit dem Overflow-Menü sowie dem Menüpunkt _Add folder_.

### Requests

Im Overflow-Menü eines Folders oder einer Collection kann man durch den Menüpunkt
_Add request_ einen neuen Eintrag für Requests erstellen, wobei man dann z.B.
folgendes festlegt:

- Bezeichnung des Eintrags
- GET, POST, PUT, PATCH, DELETE
- URL mit ggf. Pfadparameter, z.B. :id
- Im Karteireiter _Params_ sieht man dann die Pfadparameter und kann auch
  Query-Parameter spezifizieren.
- Im Karteireiter _Headers_ sieht man voreingestellte Request-Header und kann
  auch zusätzliche eintragen, z.B. den Header `Content-Type` und als zugehörigen
  Wert `application/hal+json`.
- Im Karteireiter _Body_ kann man z.B. JSON-Daten für einen POST-Request oder
  Daten für GraphQL-Queries oder -Mutations eintragen. Dazu wählt man dann
  unterhalb von _Body_ den Radiobutton _raw_ mit _JSON_ aus, wenn man einen
  POST- oder PUT-Request spezifiziert bzw. den Radiobutton _GraphQL_ für
  Queries oder Mutations aus.
- Wenn man GraphQL-Requests spezifiziert, d.h. im Request-Body _GraphQL_
  festlegt, dann lädt Postman aufgrund der Request-URL das zugehörige GraphQL-Schema
  herunter, falls man die Vorbelegung _Auto-fetch_ beibehält. Dadurch hat man
  Autovervollständigen beim Formulieren von Queries und Mutations.

> Beachte: Wenn man gebündelte Requests von Collections oder Folders abschickt,
> hat man bis zu 50 "Runs" pro Monat frei.

### Variable

Um bei der URL für die diversen Requests nicht ständig wiederholen zu müssen,
kann man in einer Collection auch _Variable_ definieren, indem man die Collection
auswählt und dann den Karteireiter _Variables_, z.B. `rest_url` als Variablenname
und `https://localhost:3000/rest` als zugehöriger Wert.

### Tokens durch Pre-request Scripts und Authorization-Header

Wenn ein Request eine URL adressiert, für die man einen Token benötigt, so muss
ein solcher Token vor dem Abschicken des Requests ermittelt werden. Dazu trägt
man bei der Collection, beim Folder oder beim konkreten Request im Karteireiter
_Pre-request Script_ ein JavaScript ein, mit dem man vorab einen (Hilfs-) Request
senden kann, dessen Response dann einen Token liefert. Der Request wird mit
`pm.sendRequest({...}, myCallback)` abgeschickt.

Falls der Token im Response-Body in einem JSON-Datensatz z.B. in der Property
`token` empfangen wird, kann man den Token in z.B. einer Variablen in der
Collection puffern. Dazu liest man im Callback den Token durch `res.json().token`
aus dem Response-Body aus und puffert ihn z.B. in einer Collection-Variablen `TOKEN`.
Das ergibt insgesamt die Anweisung: `pm.collectionVariables.set('TOKEN', res.json().token)`.

Unter dieser Voraussetzung kann man dann im Karteireiter _Authorization_ bei der
Collection, beim Folder oder beim Request als _Type_ die Option _Bearer Token_
auswählen und als Wert `{{TOKEN}}` eintragen. Dadurch wird der Request-Header
`Authorization` mit dem Wert `Bearer <Aktueller_Token>` generiert.

### Tests in Postman

Wenn man Requests einzeln oder komplett für einen Folder oder eine Collection
abschickt, dann kann man in Postman den zugehörigen Response zu jedem Request
überprüfen. Dazu implementiert man ein JavaScript-Skript im Karteireiter _Tests_.
Zur Überprüfung von z.B. Statuscode, Response-Header oder Response-Body stellt
Postman die _Chai Assertion Library_ mit _expect_ bereit. Details zu Chai
findet man bei https://www.chaijs.com/api/bdd.

### Erweiterung für VS Code

Seit Mai 2023 gibt es Postman auch als Erweiterung für VS Code. Damit kann man
zwar (noch) nicht Workspaces, Collections, Folders und Requests anlegen, aber
Requests abschicken, ohne dass man VS Code als Arbeitsumgebung verlassen muss.

### Invoke-WebRequest in der PowerShell

Auch von der PowerShell können Requests an die REST-Schnittstelle abgeschickt
werden:

```shell
    # GET-Request an die REST-Schnittstelle
    Invoke-WebRequest https://localhost:3000/rest/1 -SslProtocol Tls13 -SkipCertificateCheck
```

---

## Tests aufrufen

Folgende Voraussetzungen müssen oder sollten erfüllt sein:

- Der DB-Server muss gestartet sein.
- Der Mailserver muss gestartet sein.
- Der Appserver muss gestartet sein.

Nun kann man die Tests folgendermaßen in einer Powershell aufrufen. Dabei wird
beim Skript `test` in `package.json` die Property `log.default` auf `true`
gesetzt, um nicht zu detailliert zu protokollieren bzw. damit die Log-Ausgabe
übersichtlich bleibt.

```shell
    pnpm t
```

Bei der Fehlersuche ist es ratsam, nur eine einzelnen Testdatei oder sogar
geziehlt eine Test-Funktion aufzurufen, z.B.:

```shell
    # Filter für den Namen der Testdatei
    pnpm vitest GET-id

    # Test-Funktion an einer bestimmten Zeile in der Testdatei
    pnpm vitest test/integration/rest/GET-id.test.mts:47
```

---

## Docker-Image und Docker Compose

### Minimales Basis-Image

Für ein minimales Basis-Image gibt es z.B. folgende Alternativen:

- _Debian Trixie slim_
  - ca. 250 MB
  - Trixie ist der Codename für Debian 13
  - mit Node 22
- _Alpine_
  - ca. 50 MB
  - C-Bibliothek _musl_ statt von GNU
  - _ash_ als Shell
  - _apk_ ("Alpine Package Keeper") als Package-Manager
  - mit Node 22

### Image erstellen

Durch eine Default-Datei `Dockerfile` kann man ein Docker-Image erstellen und
durch ein _Multi-stage Build_ optimieren. Eine weitverbreitete Namenskonvention
für ein Docker-Image ist `<registry-name>/<username>/<image-name>:<image-tag>`.
Ob das Dockerfile gemäß _Best Practices_ (https://docs.docker.com/develop/develop-images/dockerfile_best-practices)
erstellt wurde, kann man mit _Hadolint_ überprüfen.

```shell
    # Debian Trixie (13) slim
    Get-Content Dockerfile | docker run --rm --interactive hadolint/hadolint:v2.13.1-beta4-debian
    docker build --tag juergenzimmermann/buch:2025.10.1-trixie .

    # Alpine
    Get-Content Dockerfile.alpine | docker run --rm --interactive hadolint/hadolint:v2.13.1-beta4-debian
    docker build --tag juergenzimmermann/buch:2025.10.1-alpine --file Dockerfile.alpine .
```

Mit Docker _Bake_:

```shell
    # Debian als default
    docker buildx bake
    docker buildx bake alpine
```

### Image inspizieren

#### docker history

Mit dem Unterkommando `history` kann man ein Docker-Image und die einzelnen Layer
inspizieren:

```shell
    docker history juergenzimmermann/buch:2025.10.1-trixie
    docker history juergenzimmermann/buch:2025.10.1-alpine
```

#### docker inspect

Mit dem Unterkommando `inspect` kann man die Metadaten, z.B. Labels, zu einem
Image inspizieren:

```shell
    docker inspect juergenzimmermann/buch:2025.10.1-trixie
    docker inspect juergenzimmermann/buch:2025.10.1-alpine
```

#### docker sbom

Mit dem Unterkommando `sbom` (Software Bill of Materials) von `docker` kann man
inspizieren, welche Bestandteilen in einem Docker-Images enthalten sind, z.B.
npm-Packages oder Debian-Packages.

```shell
    docker sbom juergenzimmermann/buch:2025.10.1-trixie
    docker sbom juergenzimmermann/buch:2025.10.1-alpine
```

### Docker Compose

Mit _Docker Compose_ und der Konfigurationsdatei `compose.yml` im Verzeichnis
`.extras\compose` lässt sich der Container mit dem Basis-Image mit _Debian
Trixie (13) Slim_ folgendermaßen starten und später in einer weiteren
PowerShell herunterfahren.

```shell
    cd .extras\compose\buch

    # PowerShell fuer buch-Server mit Trixie-Image zzgl. DB-Server und Mailserver
    docker compose up

    # Nur zur Fehlersuche: weitere PowerShell für bash
    cd .extras\compose\buch
    docker compose exec buch bash
        id
        env
        exit

    # Fehlersuche im Netzwerk:
    docker compose -f compose.busybox.yml up
    docker compose exec busybox sh
        nslookup postgres
        exit

    # 2. Powershell: buch-Server einschl. DB-Server und Mailserver herunterfahren
    cd .extras\compose\buch
    docker compose down
```

---

## Statische Codeanalyse und Formatierer

### ESLint

_ESLint_ wird durch `eslint.config.mts` (rc = run command) konfiguriert und durch
folgendes pnpm-Skript ausgeführt:

```shell
    pnpm run eslint
```

Mit dem _ESLint Config Inspector_ kann man inspizieren, welche

- Plugins genutzt werden,
- Regeln aktiviert sind,
- aktivierten Regeln deprecated sind

```shell
    npx @eslint/config-inspector
```

### Prettier

`Prettier` ist ein Formatierer, der durch `prettier.config.mts` (rc = run command)
konfiguriert und durch folgendes pnpm-Skript ausgeführt wird:

```shell
    pnpm run prettier
```

### SonarQube

Siehe `.extras\compose\sonarqube\ReadMe.md`.

### Madge

Mit _Madge_ kann man zyklische Abhängigkeiten auflisten lassen: `pnpm run madge`.
Mit `pnpm run madge:dep` kann man sämtliche Abhängigkeiten in einer SVG-Datei
`dependencies.svg` visualisieren.

---

## Sicherheitslücken

### pnpm audit

Mit dem Unterkommando `audit` von _pnpm_ kann man `npm_modules` auf Sicherheitslücken
analysieren. Wenn man - sinnvollerweise - nur die `dependencies` aus `package.json`
berücksichtigen möchte, ergänzt man die Option `-P` ("Production"):

```shell
    pnpm audit -P
```

### OWASP Dependency Check

Mit _OWASP Dependency Check_ werden alle in `node_modules` installierten
Packages mit den _CVE_-Nummern der NIST-Datenbank abgeglichen.

Von https://nvd.nist.gov/developers/request-an-api-key fordert man einen "API Key"
an, um im Laufe des Semesters mit _OWASP Dependency Check_ die benutzte Software
("3rd Party Libraries") auf Sicherheitslücken zu prüfen. Diesen API Key trägt
man im Skript `scripts\dependency-check.mts` als Wert der Variablen `nvdApiKey` ein.

```shell
    cd scripts
    node dependency-check.mts
```

### Docker Scout

Mit dem Unterkommando `quickview` von _Scout_ kann man sich zunächst einen
groben Überblick verschaffen, wieviele Sicherheitslücken in den Bibliotheken im
Image enthalten sind:

```shell
    docker scout quickview juergenzimmermann/buch:2025.10.1-trixie
    docker scout quickview juergenzimmermann/buch:2025.10.1-alpine
```

Dabei bedeutet:

- C ritical
- H igh
- M edium
- L ow

Sicherheitslücken sind als _CVE-Records_ (CVE = Common Vulnerabilities and Exposures)
katalogisiert: https://www.cve.org (ursprünglich: https://cve.mitre.org/cve).
Übrigens bedeutet _CPE_ in diesem Zusammenhang _Common Platform Enumeration_.
Die Details zu den CVE-Records im Image kann man durch das Unterkommando `cves`
von _Scout_ auflisten:

```shell
    docker scout cves juergenzimmermann/buch:2025.10.1-trixie
    docker scout cves --format only-packages juergenzimmermann/buch:2025.10.1-trixie
```

Statt der Kommandozeile kann man auch den Menüpunkt "Docker Scout" im
_Docker Dashboard_ verwenden.

---

## OpenAPI

Durch die Decorators `@Api...()` kann man _OpenAPI_ bzw. _Swagger_ in den
Controller-Klassen und -Methoden konfigurieren und dann in einem Webbrowser mit
`https://localhost:3000/swagger` aufrufen. Die _Swagger JSON Datei_ kann man mit
`https://localhost:3000/swagger-json` abrufen.

---

## AsciiDoctor und PlantUML

Siehe `.extras\doc\projekthandbuch\ReadMe.md`.

---

## TypeDoc

Um die API-Dokumentation mit _TypeDoc_ zu erstellen, ruft man in einer Powershell
folgendes Kommando auf:

```shell
    pnpm typedoc
```

---

## Continuous Integration mit Jenkins

Siehe `.extras\compose\jenkins\ReadMe.md`.

---

## Visual Studio Code

[Visual Studio Code](https://code.visualstudio.com/Download) kann man
kostenfrei herunterladen.

Tipps:

- `<Strg>#` : Kommentare setzen und entfernen
- `<F1>`: Die Kommandopalette erscheint
- `<Strg><Shift>v`: Vorschau für MarkDown und AsciiDoctor
- `<Alt>d`: Vorschau für PlantUml
- https://vscodecandothat.com: Kurze Videos zu VS Code
- https://www.youtube.com/watch?v=beNIDKgdzwQ: Video für Debugging

---

## Empfohlene Code-Konventionen

In Anlehnung an die
[Guidelines von TypeScript](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)

- Klassennamen mit PascalCase
- Union-Types (mit Strings) statt Enums
- Attribute und Funktionen mit camelCase
- `#` für private Properties
- private Properties _nicht_ mit vorangestelltem **\_**
- Interfaces _nicht_ mit vorangestelltem **I**
- Higher-Order Functions: [...].`forEach`(), [...].`filter`() und [...].`map`()
- Arrow-Functions statt function()
- `undefined` verwenden und nicht `null`
- Geschweifte Klammern bei if-Anweisungen
- Maximale Dateigröße: 400 Zeilen
- Maximale Funktionslänge: 75 Zeilen
