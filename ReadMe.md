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
> Visual Studio Code leicht gelesen werden. Näheres zu Markdown gibt es z.B. bei
> [Markdown Guide](https://www.markdownguide.org/).
> Wenn _Bun_ installiert ist, kann man die Datei auch mit `bun ReadMe.md` lesen.
> Die Anleitung ist für _Windows 11_; für _andere Betriebssysteme_ oder
> _Windows-Emulationen_ sind Anpassungen notwendig.

## Inhalt

- [Inhalt](#inhalt)
- [Vorbereitung der Installation](#vorbereitung-der-installation)
- [Download- und ggf. Upload Geschwindigkeit](#download--und-ggf-upload-geschwindigkeit)
- [Lokaler Appserver mit dem Watch-Modus](#lokaler-appserver-mit-dem-watch-modus)
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
- [Sicherheitslücken](#sicherheitslücken)
  - [bun audit](#bun-audit)
  - [OWASP Dependency Check](#owasp-dependency-check)
  - [Docker Scout](#docker-scout)
- [OpenAPI](#openapi)
- [AsciiDoctor und PlantUML](#asciidoctor-und-plantuml)
- [Empfohlene Code-Konventionen](#empfohlene-code-konventionen)
- [Port bereits belegt?](#port-bereits-belegt)

---

## Vorbereitung der Installation

- Das Beispiel _nicht_ in einem Pfad mit _Leerzeichen_ installieren.
  Viele Javascript-Bibliotheken werden unter Linux entwickelt und dort benutzt
  man **keine** Leerzeichen in Pfaden. Ebenso würde ich das Beispiel nicht auf
  dem  _Desktop_ auspacken bzw. installieren.

- Bei [GitHub](https://github.com) oder [GitLab](https://gitlab.com)
  registrieren, falls man dort noch nicht registriert ist.

---

## Download- und ggf. Upload Geschwindigkeit

In einem Webbrowser kann man z.B. mit der URL `https://speed.cloudflare.com` die
Download- und die Upload-Geschwindigkeit testen.

Alternativ kann man durch das Kommando `fast` in einer Powershell die aktuelle
Download-Geschwindigkeit ermitteln. Mit der zusätzlichen Option `--upload` kann
zusätzlich die aktuelle Upload-Geschwindigkeit ermittelt werden.

---

## Lokaler Appserver mit dem Watch-Modus

Durch `bun run dev` wird der Appserver im _Watch_-Modus für die
Entwicklung gestartet, d.h. bei Code-Änderungen wird der Server automatisch
neu gestartet. `bun start` startet den Appserver ohne Watch-Modus.

Beim Starten des Appservers wird außerdem mit _Prisma_ die DB-Verbindung
aufgebaut. Der Benutzername und das Passwort sind in der Datei
`src\config\db.ts` auf `admin` und `p` voreingestellt. Durch die Property
`db.populate` in `src\config\resources\app.toml` wird festgelegt, ob die
DB `buch` neu geladen wird.

---

## Tests aufrufen

Folgende Voraussetzungen müssen oder sollten erfüllt sein:

- Der DB-Server muss gestartet sein.
- Der Mailserver muss gestartet sein.
- Der Appserver muss gestartet sein.

Nun können die Tests in einer Shell aufgerufen werden:

```shell
    bun run test
```

**BEACHTE**: Wenn man `bun test` aufruft, werden die Tests mit dem Test Runner
von _Bun_ statt mit _Vitest_ ausgeführt, was zwangsläufig zu Fehlern führt, weil
in den Tests ein import von `vitest` und nicht von `bun:test` verwendet wird.

Bei der Fehlersuche ist es ratsam, nur eine einzelnen Testdatei oder sogar
geziehlt eine Test-Funktion aufzurufen, z.B.:

```shell
    # Filter für den Namen der Testdatei
    bun vitest GET-id

    # Test-Funktion an einer bestimmten Zeile in der Testdatei
    bun vitest test/integration/rest/GET-id.test.mts:45
```

Man kann auch nur die Unit-Tests, d.h. ohne gestartete Server, laufen lassen,
um schnelles Feedback zu bekommen:

```shell
    bun vitest --project unit
```

---

## Docker-Image und Docker Compose

### Minimales Basis-Image

Für ein minimales Basis-Image gibt es z.B. folgende Alternativen:

- _Hardened Image_ mit Debian 13
- _Debian Trixie slim_: Trixie ist der Codename für Debian 13
- _Alpine_
  - C-Bibliothek _musl_ statt von GNU
  - _ash_ als Shell
  - _apk_ ("Alpine Package Keeper") als Package-Manager

### Image erstellen

Durch eine Default-Datei `Dockerfile` kann man ein Docker-Image erstellen und
durch ein _Multi-stage Build_ optimieren. Eine weitverbreitete Namenskonvention
für ein Docker-Image ist `<registry-name>/<username>/<image-name>:<image-tag>`.
Ob das Dockerfile gemäß _Best Practices_ (https://docs.docker.com/develop/develop-images/dockerfile_best-practices)
erstellt wurde, kann man mit _Hadolint_ überprüfen.

```shell
    # Hardened Image mit Debian 13 (Trixie) slim
    Get-Content Dockerfile | docker run --rm --interactive hadolint/hadolint:v2.13.1-beta4-debian
    docker build bake

    # Debian Trixie slim
    Get-Content Dockerfile.trixie | docker run --rm --interactive hadolint/hadolint:v2.13.1-beta4-debian
    docker build bake trixie

    # Alpine
    Get-Content Dockerfile.alpine | docker run --rm --interactive hadolint/hadolint:v2.13.1-beta4-debian
    docker build bake alpine
```

### Image inspizieren

#### docker history

Mit dem Unterkommando `history` kann man ein Docker-Image und die einzelnen Layer
inspizieren:

```shell
    docker history juergenzimmermann/buch:2026.4.1-hardened
    docker history juergenzimmermann/buch:2026.4.1-trixie
    docker history juergenzimmermann/buch:2026.4.1-alpine
```

#### docker inspect

Mit dem Unterkommando `inspect` kann man die Metadaten, z.B. Labels, zu einem
Image inspizieren:

```shell
    docker inspect juergenzimmermann/buch:2026.4.1-hardened
    docker inspect juergenzimmermann/buch:2026.4.1-trixie
    docker inspect juergenzimmermann/buch:2026.4.1-alpine
```

#### docker sbom

Mit dem Unterkommando `sbom` (Software Bill of Materials) von `docker` kann man
inspizieren, welche Bestandteilen in einem Docker-Images enthalten sind, z.B.
npm-Packages oder Debian-Packages.

```shell
    docker sbom juergenzimmermann/buch:2026.4.1-hardened
    docker sbom juergenzimmermann/buch:2026.4.1-trixie
    docker sbom juergenzimmermann/buch:2026.4.1-alpine
```

### Docker Compose

Mit _Docker Compose_ und der Konfigurationsdatei `compose.yml` im Verzeichnis
`extras\compose` lässt sich der Container mit dem Basis-Image mit _Debian
Trixie (13) Slim_ folgendermaßen starten und später in einer weiteren
PowerShell herunterfahren.

```shell
    cd extras\compose\buch

    # Shell fuer buch-Server mit Trixie-Image zzgl. DB-Server und Mailserver
    docker compose up

    # Nur zur Fehlersuche: weitere Shell für bash/ash bei Trixie oder Alpine
    cd extras\compose\buch
    docker compose exec buch bash
        id
        env
        exit

    # 2 Shells fuerFehlersuche im Netzwerk:
    cd extras\compose\debug
    docker compose up

    docker compose exec busybox sh
        nslookup postgres
        exit

    # Shell: buch-Server einschl. DB-Server und Mailserver herunterfahren
    cd extras\compose\buch
    docker compose down
```

---

## Statische Codeanalyse und Formatierer

### ESLint

_ESLint_ wird durch `eslint.config.mts` konfiguriert und durch folgendes Skript
ausgeführt:

```shell
    bun run eslint
```

### Prettier

`Prettier` ist ein Formatierer, der durch `prettier.config.mts` konfiguriert und
durch folgendes Skript ausgeführt wird:

```shell
    bun run prettier
```

### SonarQube

Siehe `extras\compose\sonarqube\ReadMe.md`.

---

## Sicherheitslücken

### bun audit

Mit dem Unterkommando `audit` von _Bun_ kann man `npm_modules` auf Sicherheitslücken
analysieren. Wenn man - sinnvollerweise - nur die `dependencies` aus `package.json`
berücksichtigen möchte, ergänzt man die Option `-P` ("Production"):

```shell
    bun audit --prod
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
    bun dependency-check.mts
```

### Docker Scout

Mit dem Unterkommando `quickview` von _Scout_ kann man sich zunächst einen
groben Überblick verschaffen, wieviele Sicherheitslücken in den Bibliotheken im
Image enthalten sind:

```shell
    docker scout quickview juergenzimmermann/buch:2026.4.1-hardened
    docker scout quickview juergenzimmermann/buch:2026.4.1-trixie
    docker scout quickview juergenzimmermann/buch:2026.4.1-alpine
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
    docker scout cves juergenzimmermann/buch:2026.4.1-hardened
    docker scout cves --format only-packages juergenzimmermann/buch:2026.4.1-hardened
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

### Port bereits belegt?

Falls der Server nicht gestartet werden kann, weil z.B. der Port `3000` belegt ist,
kann man bei Windows in der Powershell zunächst die ID vom Betriebssystem-Prozess ermitteln,
der den Port belegt und danach diesen Prozess beenden:

```powershell
    netstat -ano | findstr ':3000'
    taskkill /F /PID <Prozess-ID>
```

Bei macOS:

```shell
    ps -af
    kill <Prozess-ID>
    # ggf.
    kill -9 <Prozess-ID>
```
