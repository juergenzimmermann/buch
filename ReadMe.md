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
  - [Download- und ggf. Upload Geschwindigkeit](#download--und-ggf-upload-geschwindigkeit)
  - [Vorbereitung der Installation](#vorbereitung-der-installation)
  - [ES Modules (= ESM)](#es-modules--esm)
  - [Version für SQLite](#version-für-sqlite)
  - [DB-Server und DB-Browser](#db-server-und-db-browser)
    - [DB-Server](#db-server)
    - [pgAdmin](#pgadmin)
    - [phpMyAdmin](#phpmyadmin)
  - [Node Best Practices](#node-best-practices)
  - [Lokaler Appserver mit Nest und dem Watch-Modus](#lokaler-appserver-mit-nest-und-dem-watch-modus)
  - [OpenAPI](#openapi)
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
    - [REST Client als Extension](#rest-client-als-extension)
  - [Tests aufrufen](#tests-aufrufen)
  - [Docker-Image und Docker Compose](#docker-image-und-docker-compose)
    - [Minimales Basis-Image](#minimales-basis-image)
    - [Image erstellen](#image-erstellen)
    - [Image inspizieren](#image-inspizieren)
      - [docker inspect](#docker-inspect)
      - [docker sbom](#docker-sbom)
    - [Docker Compose](#docker-compose)
  - [Statische Codeanalyse und Formattierer](#statische-codeanalyse-und-formatierer)
    - [Prettier](#prettier)
    - [ESLint](#eslint)
    - [SonarQube](#sonarqube)
    - [Madge](#madge)
    - [type-coverage](#type-coverage)
  - [Sicherheitslücken](#sicherheitslücken)
    - [npm audit](#npm-audit)
    - [OWASP Dependency Check](#owasp-dependency-check)
    - [Docker Scout](#docker-scout)
    - [Snyk](#snyk)
  - [AsciiDoctor und PlantUML](#asciidoctor-und-plantuml)
    - [Preview von PlantUML-Dateien](#preview-von-plantuml-dateien)
    - [Einstellungen für Preview von AsciiDoctor-Dateien](#einstellungen-für-preview-von-asciidoctor-dateien)
    - [Preview von AsciiDoctor-Dateien](#preview-von-asciidoctor-dateien)
    - [Dokumentation im Format HTML](#dokumentation-im-format-html)
  - [Continuous Integration mit Jenkins](#continuous-integration-mit-jenkins)
    - [Aufruf mit Webbrowser](#aufruf-mit-webbrowser)
    - [Bash zur evtl. Fehlersuche im laufenden Jenkins-Container](#bash-zur-evtl-fehlersuche-im-laufenden-jenkins-container)
  - [Visual Studio Code](#visual-studio-code)
  - [Empfohlene Code-Konventionen](#empfohlene-code-konventionen)

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

## Version für SQLite

_TypeORM_ unterstützt nur SQLite 9, aber nicht SQLite 11: https://github.com/typeorm/typeorm/blob/master/package.json#L153

---

## DB-Server und DB-Browser

### DB-Server

> ❗ Vor dem 1. Start von PostgreSQL muss man die Skripte `create-db-buch.sql`
> und `create-schema-buch.sql` aus dem Verzeichnis `.extras\db\postgres\sql`
> nach `C:\Zimmermann\volumes\postgres\sql` kopieren und die Anleitung ausführen.
> Danach kopiert man die CSV-Dateien aus dem Verzeichnis `.extras\postgres\csv`
> nach `C:\Zimmermann\volumes\postgres\csv\buch`.

> ❗ Vor dem 1. Start von MySQL muss man das Skript `create-db-buch.sql` aus
> dem Projektverzeichnis `.extras\db\mysql\sql` nach`C:\Zimmermann\volumes\mysql\sql`
> kopieren und die Anleitung ausführen. Danach kopiert man die CSV-Dateien aus
> dem Verzeichnis `.extras\db\mysql\csv` nach `C:\Zimmermann\volumes\mysql\csv\buch`.

Vor dem Start des Appservers muss man den DB-Server und ggf. den DB-Browser starten.
Falls man _PostgreSQL_ oder _MySQL_ und nicht _SQLite_ als "Embedded Database" nutzt:

```txt
    # PostgreSQL mit pgAdmin
    cd .\extras\compose\postgres
    docker compose up

    # alternativ: MySQL mit phpMyAdmin:
    cd .\extras\compose\mysql
    docker compose up
```

Der DB-Server wird zusammen mit dem DB-Browser als _Container_ gestartet.
Sie sind als _Service_ in der jeweiligen Datei `compose.yml` unter Verwendung der
Docker-Images konfiguriert:

- Image `postgres` für PostgreSQL
- Image `dpage/pgadmin4` für pgAdmin
- Image `mysql` für MySQL
- Image `phpmyadmin/phpmyadmin` für phpMyAdmin

Jetzt läuft der DB-Server mit folgender Konfiguration:

- Rechnername `localhost` aus Windows-Sicht
- Default-Port `5432` bei _PostgreSQL_ bzw. `3306` bei _MySQL_
- Datenbankname `buch`
- Administrations-User `postgres` bei _PostgreSQL_ bzw. `root` bei _MySQL_
- Passwort `p` für den jeweiligen Administrations-User

### pgAdmin

_pgadmin_ kann zur Administration von _PostgreSQL_ verwendet werden und ist
durch Docker Compose über ein virtuelles Netzwerk mit dem Docker-Container des
DB-Servers verbunden. Deshalb muss beim Verbinden mit dem DB-Server der
virtuelle Rechnername `postgres` statt `localhost` verwendet werden. pgadmin
kann man mit einem Webbrowser und der URL `http://localhost:8888` aufrufen.
Die Emailadresse `pgadmin@acme.com` und das Passwort `p` sind voreingestellt.
pgadmin ist übrigens mit Chromium implementiert.

Beim 1. Einloggen konfiguriert man einen Server-Eintrag mit z.B. dem Namen
`localhost` und verwendet folgende Werte:

- Host: `postgres` (virtueller Rechnername des DB-Servers im Docker-Netzwerk.
  **BEACHTE**: `localhost` ist im virtuellen Netzwerk der Name des
  pgadmin-Containers selbst !!!)
- Port: `5432` (Defaultwert)
- Username: `postgres` (Superuser beim DB-Server)
- Password: `p`

Es empfiehlt sich, das Passwort abzuspeichern, damit man es künftig nicht jedes
Mal beim Einloggen eingeben muss.

### phpMyAdmin

_phpMyAdmin_ kann zur Administration von _MySQL_ verwendet werden. phpMyAdmin
ist durch Docker Compose über ein virtuelles Netzwerk mit dem Docker-Container
des DB-Servers verbunden. Deshalb muss beim Verbinden mit dem DB-Server auch der
virtuelle Rechnername `mysql` statt `localhost` verwendet werden. Man ruft
phpMyAdmin mit einem Webbrowser und der URL `http://localhost:8889` auf.
Zum Einloggen verwendet folgende Werte:

- Server: `mysql` (virtueller Rechnername des DB-Servers im Docker-Netzwerk.
  **BEACHTE**: `localhost` ist im virtuellen Netzwerk der Name des
  phpMyAdmin-Containers selbst !!!)
- Benutzername: `root` (Superuser beim DB-Server)
- Password: `p`

---

## Node Best Practices

Sehr empfehlenswert ist https://github.com/goldbergyoni/nodebestpractices

---

## Lokaler Appserver mit Nest und dem Watch-Modus

Durch `npm run dev` wird der Appserver im _Watch_-Modus für die
Entwicklung gestartet, d.h. bei Code-Änderungen wird der Server automatisch
neu gestartet. Durch die Option `--builder swc` beim Node-Skript `swc`
in der Datei `package.json` wird _swc_ (= speedy web compiler) anstatt des
TypeScript-Compilers _tsc_ verwendet. swc ist in Rust implementiert und bis zu
20x schneller als tsc. Defaultmäßig arbeitet swc allerdings ohne Typprüfungen.
Beim Node-Skript `swc:check` wird zusätzlich die Option `--type-check`
verwendet.

Beim Starten des Appservers wird außerdem mit _TypeORM_ auf die Datenbank
zugegriffen. Der Benutzername und das Passwort sind in der Datei
`src\config\db.ts` auf `admin` und `p` voreingestellt. Durch die Property
`db.populate` in `src\config\resources\buch.yml` wird festgelegt, ob die
(Test-) DB `buch` neu geladen wird.

## OpenAPI

Durch die Decorators `@Api...()` kann man _OpenAPI_ (früher: Swagger) in den
Controller-Klassen und -Methoden konfigurieren und dann in einem Webbrowser mit
`https://localhost:3000/swagger` aufrufen. Die _Swagger JSON Datei_ kann man mit
`https://localhost:3000/swagger-json` abrufen.

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

### REST Client als Extension

Als Alternative zu _Postman_ kann man auch die Extension _REST Client_ nutzen.

---

## Tests aufrufen

Folgende Voraussetzungen müssen oder sollten erfüllt sein:

- Der DB-Server muss gestartet sein.
- Der Appserver muss _nicht gestartet_ sein.

Nun kann man die Tests folgendermaßen in einer Powershell aufrufen. Dabei wird
beim Skript `test` in `package.json` die Property `log.default` auf `true`
gesetzt, um nicht zu detailliert zu protokollieren bzw. damit die Log-Ausgabe
übersichtlich bleibt.

```shell
    npm t
```

Bei der Fehlersuche ist es ratsam, nur eine einzelnen Testdatei aufzurufen,
z.B.:

```shell
    npm exec jest --detectOpenHandles --errorOnDeprecated `
      --forceExit --runTestsByPath '__tests__\buch\buch-GET.controller.test.ts'
```

---

## Docker-Image und Docker Compose

### Minimales Basis-Image

Für ein minimales Basis-Image gibt es folgende Alternativen:

- _Debian Bookworm slim_
  - ca. 250 MB
  - Bookworm ist der Codename für Debian 12
  - mit Node 22
- _Alpine_
  - ca. 50 MB
  - C-Bibliothek _musl_ statt von GNU
  - _ash_ als Shell
  - _apk_ ("Alpine Package Keeper") als Package-Manager
  - mit Node 22
- _Distroless_
  - auf Basis von Debian
  - ohne Shell, Package Manager, GUI, grep, sed, awk, ...
  - von Google
- _Wolfi_
  - minimales Community Linux von Chainguard
  - _undistro_: keine volle Linux-Distribution
  - nutzt den Linux-Kernel der Laufzeitumgebung, z.B. Container Runtime
  - _glibc_ als C-Bibliothek und **nicht** _musl_ wie bei _Alpine_
  - _ash_ als Shell
  - _apk_ als Package-Format wie bei _Alpine_
  - https://github.com/wolfi-dev
  - https://chainguard.dev

### Image erstellen

Durch eine Default-Datei `Dockerfile` kann man ein Docker-Image erstellen und
durch ein _Multi-stage Build_ optimieren. Eine weitverbreitete Namenskonvention
für ein Docker-Image ist `<registry-name>/<username>/<image-name>:<image-tag>`.
Ob das Dockerfile gemäß _Best Practices_ (https://docs.docker.com/develop/develop-images/dockerfile_best-practices)
erstellt wurde, kann man mit _Hadolint_ überprüfen.

```shell
    # Debian Bookworm (12) slim
    Get-Content Dockerfile | docker run --rm --interactive hadolint/hadolint:v2.13.1-beta2-debian
    docker build --tag juergenzimmermann/buch:2025.10.1-bookworm .

    # Alpine
    Get-Content Dockerfile.alpine | docker run --rm --interactive hadolint/hadolint:v2.13.1-beta2-debian
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
    docker history juergenzimmermann/buch:2025.10.1-bookworm
    docker history juergenzimmermann/buch:2025.10.1-alpine
```

#### docker inspect

Mit dem Unterkommando `inspect` kann man die Metadaten, z.B. Labels, zu einem
Image inspizieren:

```shell
    docker inspect juergenzimmermann/buch:2025.10.1-bookworm
    docker inspect juergenzimmermann/buch:2025.10.1-alpine
```

#### docker sbom

Mit dem Unterkommando `sbom` (Software Bill of Materials) von `docker` kann man
inspizieren, welche Bestandteilen in einem Docker-Images enthalten sind, z.B.
npm-Packages oder Debian-Packages.

```shell
    docker sbom juergenzimmermann/buch:2025.10.1-bookworm
    docker sbom juergenzimmermann/buch:2025.10.1-alpine
```

### Docker Compose

Mit _Docker Compose_ und der Konfigurationsdatei `compose.yml` im Verzeichnis
`.extras\compose` lässt sich der Container mit dem Basis-Image mit _Debian
Bookworm (12) Slim_ folgendermaßen starten und später in einer weiteren
PowerShell herunterfahren.

```shell
    cd .extras\compose\buch

    # PowerShell fuer buch-Server mit Bookworm-Image zzgl. DB-Server und Mailserver
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

### Prettier

`Prettier` ist ein Formatierer, der durch `.prettierrc.yml` (rc = run command)
konfiguriert und durch folgendes npm-Skript ausgeführt wird:

```shell
    npm run prettier
```

### ESLint

_ESLint_ wird durch `.eslintrc.yml` (rc = run command) konfiguriert und durch
folgendes npm-Skript ausgeführt:

```shell
    npm run eslint
```

Mit dem _ESLint Config Inspector_ kann man inspizieren, welche

- Plugins genutzt werden,
- Regeln aktiviert sind,
- aktivierten Regeln deprecated sind

```shell
    npx @eslint/config-inspector@latest
```

### SonarQube

Für eine statische Codeanalyse durch _SonarQube_ muss zunächst der
SonarQube-Server mit _Docker Compose_ als Docker-Container gestartet werden:

```shell
    cd .extras\compose\sonarqube
    docker compose up
```

Wenn der Server zum ersten Mal gestartet wird, ruft man in einem Webbrowser die
URL `http://localhost:9000` auf. In der Startseite muss man sich einloggen und
verwendet dazu als Loginname `admin` und ebenso als Password `admin`. Danach
wird man weitergeleitet, um das initiale Passwort zu ändern.

Nun wählt man in der Webseite rechts oben das Profil über _MyAccount_ aus und
klickt auf den Karteireiter _Security_. Im Abschnitt _Generate Tokens_ macht man
nun die folgende Eingaben:

- _Name_: z.B. Software Engineering
- _Type_: _Global Analysis Token_ auswählen
- _Expires in_: z.B. _90 days_ auswählen

Abschließend klickt man auf den Button _Generate_ und trägt den generierten
Token im Skript `scripts\sonar-scanner.mts` ein.

Nachdem der Server gestartet ist, wird der SonarQube-Scanner in einer zweiten
PowerShell mit `npm run sonar` gestartet. Das Resultat kann dann in der
Webseite des zuvor gestarteten Servers über die URL `http://localhost:9000`
inspiziert werden. Falls es dabei zu einem Fehler kommt, kann man auch direkt
`C:\Users\<MY__USER>\.sonar\native-sonar-scanner\sonar-scanner-5.0.1.3006-windows\bin\sonar-scanner`
aufrufen.

Abschließend wird der oben gestartete Server heruntergefahren.

```shell
    cd .extras\compose\sonarqube
    docker compose down
```

### Madge

Mit _Madge_ kann man zyklische Abhängigkeiten auflisten lassen: `npm run madge`.
Mit `npm run madge:dep` kann man sämtliche Abhängigkeiten in einer SVG-Datei
`dependencies.svg` visualisieren.

### type-coverage

Mit `type-coverage` kann man ermitteln, wo im TypeScript-Code `any` verwendet
wurde:

```shell
    npm run type-coverage
```

---

## Sicherheitslücken

### npm audit

Mit dem Unterkommando `audit` von _npm_ kann man `npm_modules` auf Sicherheitslücken
analysieren. Dabei lässt man sinnvollerweise die `devDependencies` aus `package.json`
weg:

```shell
    npm audit --omit dev
```

### OWASP Dependency Check

Mit _OWASP Dependency Check_ werden alle in `node_modules` installierten
npm-Packages mit den _CVE_-Nummern der NIST-Datenbank abgeglichen.

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
    docker scout quickview juergenzimmermann/buch:2025.10.1-bookworm
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
    docker scout cves juergenzimmermann/buch:2025.10.1-bookworm
    docker scout cves --format only-packages juergenzimmermann/buch:2025.10.1-bookworm
````

Statt der Kommandozeile kann man auch den Menüpunkt "Docker Scout" im
_Docker Dashboard_ verwenden.

### Snyk

Zunächst muss man sich bei https://app.snyk.io/account registrieren und dort
auch einen Token besorgen. Danach kann man sich folgendermaßen authentifizieren
und das Projekt auf Sicherheitslücken überprüfen

```shell
    synk auth <MEIN_TOKEN>
    snyk test
```

## AsciiDoctor und PlantUML

Mit AsciiDoctor und PlantUML ist die Dokumentation geschrieben.

### Preview von PlantUML-Dateien

Um in VS Code die Erweiterung für PlantUML zu nutzen, wird eine Java-Installation
benötigt, d.h. die Umgebungsvariable `JAVA_HOME` muss auf das Wurzelverzeichnis
der Java-Installation verweisen und die Umgebugnsvariable `PATH` muss dieses
Verzeichnis einschließlich dem Unterverzeichnis `bin` enthalten.

Durch das Tastaturkürzel `<Alt>d` erhält man eine Preview-Sicht vom jeweiligen
UML-Diagramm. Dazu ist eine Internet-Verbindung notwendig.
Beispiele für PlantUML und AsciiDoctor sind im Unterverzeichnis `.extras\doc`.

### Einstellungen für Preview von AsciiDoctor-Dateien

Zunächst müssen einmalig die Einstellungen (_Settings_) von VS Code geändert
werden. Dazu klickt man in der linken unteren Ecke das Icon ("Rädchen") für die
Einstellungen an und wählt den Menüpunkt _Einstellungen_ bzw. _Settings_ aus.
Dann gibt man im Suchfeld `asciidoc.use_kroki` ein und setzt den Haken bei
_Enable kroki integration to generate diagrams_.

Wenn man zum ersten Mal eine `.adoc`-Datei im Editor öffnet, muss man noch
die Verbindung zum PlantUML-Server zulassen, damit die eingebundenen
`.puml`-Dateien in `.svg`-Dateien konvertiert werden. Dazu gibt man zunächst
das `<F1>` ein und schickt im Eingabefeld das Kommando
_AsciiDoc: Change Preview Security Settings_ durch `<Enter>` ab.
Danach wählt man den Unterpunkt _Allow insecure content_ aus.

### Preview von AsciiDoctor-Dateien

Durch das Tastaturkürzel `<Strg><Shift>v`. Dazu ist eine Internet-Verbindung
notwendig.

### Dokumentation im Format HTML

Die Dokumentation im Format HTML wird in einer Powershell folgendermaßen
im Verzeichnis `.extras\doc\html` erstellt:

```shell
    npm run asciidoc
```

## Continuous Integration mit Jenkins

Jenkins wird direkt mit _Docker Compose_ genutzt. Dadurch muss Jenkins nicht
immer laufen und kann bei Bedarf gestartet und wieder heruntergefahren werden.

```shell
    cd .extras\compose\jenkins
    docker compose up

    # In einer 2. PowerShell: Herunterfahren
    docker compose down
```

### Aufruf mit Webbrowser

Mit der URL https://localhost:7070 kann man von einem Webbrowser auf den
Jenkins-Container zugreifen. Der Benutzername ist `admin` und das Passwort
`Inf und WI.`.

### Bash zur evtl. Fehlersuche im laufenden Jenkins-Container

```shell
    docker compose exec jenkins bash
```

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

## Empfohlene Code-Konventionen

In Anlehnung an die
[Guidelines von TypeScript](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)

- "Feature Filenames", z.B. buch.service.ts
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
