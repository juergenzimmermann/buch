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

- [Inhalt](#inhalt)
- [Vorbereitung der Installation](#vorbereitung-der-installation)
- [Migration von Bun zu pnpm](#migration-von-bun-zu-pnpm)
  - [pnpm installieren und aktivieren](#pnpm-installieren-und-aktivieren)
  - [Konfigurationsdateien für Bun löschen](#konfigurationsdateien-für-bun-löschen)
  - [package.json und node_modules](#packagejson-und-node_modules)
  - [Migration von Prisma für pnpm und Nest](#migration-von-prisma-für-pnpm-und-nest)
- [Download- und ggf. Upload Geschwindigkeit](#download--und-ggf-upload-geschwindigkeit)
- [ES Modules (= ESM)](#es-modules--esm)
- [Node Best Practices](#node-best-practices)
- [Lokaler Appserver mit Nest und dem Watch-Modus](#lokaler-appserver-mit-nest-und-dem-watch-modus)
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

## Vorbereitung der Installation

- Das Beispiel _nicht_ in einem Pfad mit _Leerzeichen_ installieren.
  Viele Javascript-Bibliotheken werden unter Linux entwickelt und dort benutzt
  man **keine** Leerzeichen in Pfaden. Ebenso würde ich das Beispiel nicht auf
  dem  _Desktop_ auspacken bzw. installieren.

- Bei [GitHub](https://github.com) oder [GitLab](https://gitlab.com)
  registrieren, falls man dort noch nicht registriert ist.

---

## Migration von Bun zu pnpm

### pnpm installieren und aktivieren

_pnpm_ (performant node package manager) ist ein Paketmanager für _Node_, der
effizienter ist als das herkömmliche _npm_ und in diesem Beispiel statt _Bun_
genutzt wird.

Die Kommandos für die Installation und Aktivierung von _pnpm_ sind hier kompakt
aufgeführt. Anschließend wird der Ablauf im Detail erklärt.

```shell
    node --version
    npm --version

    npm i -g corepack

    corepack enable pnpm
    corepack prepare pnpm@latest-10 --activate
```

Zunächst wird sichergestellt, dass _Node_ und _npm_ installiert sind und
aktuelle Versionen verwendet werden.

Um _pnpm_ zu installieren und zu aktivieren, muss _corepack_ global installiert
werden. _corepack_ wird mit `npm i -g corepack` aus der Distribution
von _Node_ in demselben Verzeichnis installiert wie die ausführbaren Dateien
`node` und `npm`, z.B. in `C:\Zimmermann\node`, was bereits in der Umgebungsvariable
`PATH` enthalten ist. Dabei wird in `node_modules\corepack\dist`
das "Dispatcher"-Skript `pnpm.js` installiert, das beim späteren Aufruf von `pnpm`,
die gewünschte Version von `pnpm` aufruft.

Nachdem _corepack_ installiert ist, werden durch `corepack enable pnpm` sogenannte
"Shims" erstellt. Das sind "kleine Ausführungswrapper" im Installationsverzeichnis
von corepack, z.B. `C:\Zimmermann\node (s.o.)`. Bei Windows ist das "Shim" dann das
PowerShell-Skript `pnpm.ps1`. Bei macOS und Linux ist das "Shim" das
_Bourne Shell_-Script `pnpm` und wird mittels `/bin/sh` aufgerufen, so dass das
Script auch korrekt unter der _dash_ bei Debian/Ubuntu, _ash_ bei Alpine,
_zsh_ bei macOS und _ksh_ (Korn Shell) bei z.B. AIX und HP-UX läuft. Das "Shim"
`pnpm.ps1` bzw. `pnpm` ruft dann das "Dispatcher"-Skript `pnpm.js` in
`node_modules\corepack\dist` auf, das zuvor mit _corepack_ installiert wurde.

Abschließend wird mit `corepack prepare pnpm@... --activate` die spezifizierte
Version von _pnpm_ heruntergeladen und im Cache von _corepack_ gespeichert. Das
Cache-Verzeichnis von _corepack_ befindet sich bei Windows in `$env:LOCALAPPDATA\node\corepack`
und _pnpm_ wird in `$env:LOCALAPPDATA\node\corepack\v1\pnpm` gespeichert. Diese
Version von _pnpm_ wird dann zur globalen Default-Version für das "Dispatcher"-Skript
`pnpm.js`.

### Konfigurationsdateien für Bun löschen

Die beiden Dateien `bun.lock` und `bunfig.toml` werden nur für _Bun_, aber nicht
für _pnpm_ benötigt und können deshalb gelöscht werden.

### `package.json` und node_modules

In der Datei `package.json` ist jetzt `pnpm` statt `bun` als Package-Manager
eingetragen und außerdem hat das Verzeichnis `node_modules` bei `pnpm` eine
andere Struktur. Außerdem werden für Nest, für die REST-Schnittstelle und viele
weitere Funktionalitäten weitere Packages benötigt, die in `package.json`
deklariert sind.

```shell
    # Verzeichnis node_modules loeschen, falls es existiert
    # Windows:
    rm -Recurse -Force node_modules
    # macOS:
    rm -rf node_modules

    pnpm i
```

### Migration von Prisma für pnpm und Nest

Nachdem das Prisma-Schema in der Datei `prisma/schema.prisma` erstellt wurde,
sind für das _Nest_-basierte Projekt die nachfolgenden Anpassungen notwendig.

Bei _Bun_ wurde das Feature _Type Stripping_ genutzt, d.h. `bun` wurde aufgerufen
und die Typen von _TypeScript_ wurden zur Laufzeit einfach weggelassen. _Nest_
verwendet dagegen _übersetzten_ Code, d.h. _JavaScript_. Deshalb müssen in
`tsconfig.json` folgende Anpassungen erfolgen:

- bei der Option `emitDecoratorMetadata` den Kommentar entfernen
- die Option `noEmit` auskommentieren
- die Option `allowImportingTsExtensions` auskommentieren

Das Prisma-Schema in der Datei `prisma/schema.prisma` ist unverändert gültig,
aber der Prisma-Client muss aufgrund der Änderungen in `tsconfig.json` und
`package.json` neu generiert werden, d.h.

- das Verzeichnis `src\generated` wird gelöscht und
- `pnpx prisma generate` wird in der PowerShell aufgerufen.

Die bisherigen Beispieldateien `beispiele.mts` und `beispiele-write.mts`
waren für den "alten" Prisma-Client, so dass die `import`-Klauseln nicht mehr
funktionieren, weshalb man sie am einfachsten aus dem Projekt löscht.

---

## Download- und ggf. Upload Geschwindigkeit

In einem Webbrowser kann man z.B. mit der URL `https://speed.cloudflare.com` die
Download- und die Upload-Geschwindigkeit testen.

Alternativ kann man durch das Kommando `fast` in einer Powershell die aktuelle
Download-Geschwindigkeit ermitteln. Mit der zusätzlichen Option `--upload` kann
zusätzlich die aktuelle Upload-Geschwindigkeit ermittelt werden.

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

Beim Starten des Appservers wird außerdem mit _Prisma_ auf die Datenbank
zugegriffen. Der Benutzername und das Passwort sind in der Datei
`src\config\db.ts` auf `admin` und `p` voreingestellt. Durch die Property
`db.populate` in `src\config\resources\app.toml` wird festgelegt, ob die
(Test-) DB `buch` neu geladen wird.

Durch `pnpm run start:ts` wird der Appserver gestartet und der TypeScript-Code
wird in das Verzeichnis `dist` übersetzt. Der Watch-Modus ist dabei deaktiviert.

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
`extras\compose` lässt sich der Container mit dem Basis-Image mit _Debian
Trixie (13) Slim_ folgendermaßen starten und später in einer weiteren
PowerShell herunterfahren.

```shell
    cd extras\compose\buch

    # PowerShell fuer buch-Server mit Trixie-Image zzgl. DB-Server und Mailserver
    docker compose up

    # Nur zur Fehlersuche: weitere PowerShell für bash
    cd extras\compose\buch
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
    cd extras\compose\buch
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

Siehe `extras\compose\sonarqube\ReadMe.md`.

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

Siehe `extras\doc\projekthandbuch\ReadMe.md`.

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
