# Empfohlene Vorgehensweise für das Lernen von Bun und Hono

> Copyright (C) 2026 - present Juergen Zimmermann, Hochschule Karlsruhe
>
> This program is free software: you can redistribute it and/or modify
> it under the terms of the GNU General Public License as published by
> the Free Software Foundation, either version 3 of the License, or
> (at your option) any later version.
>
> This program is distributed in the hope that it will be useful,
> but WITHOUT ANY WARRANTY; without even the implied warranty of
> MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
> GNU General Public License for more details.
>
> You should have received a copy of the GNU General Public License
> along with this program. If not, see <http://www.gnu.org/licenses/>.

## EINDRINGLICHE EMPFEHLUNG

- Schrittweise vorgehen, um die Komplexität zu reduzieren
- Iteratives Lernen: bei jedem Schritt die Funktionalität verstehen, bevor man weiter macht
- Am Projektende ein Code-Review durch _Codex_ und/oder _Copilot_ durchführen lassen

## Elementare Infrastruktur und einfacher Server

- VS Code mit Erweiterungen
- Bun installieren
- GET-Request durch Hono mit "Hello World" als JSON-Datensatz
- package.json für Bun mit dependencies, devDependencies und Skript für Serverstart durch Bun
- GET-Request von Webbrowser aufrufen
- Server mit TLS
- config mit TOML für HTTP- und HTTPS-Port sowie TLS (später: Logging, DB-Zugriff, Mail, Keycloak)

## Codeanalyse, Formatierung und Sicherheit

- ESLint
- Prettier
- SonarQube als Docker Container
- bun outdated
- bun audit
- OWASP Dependency Check

## Infrastruktur

- Verzeichnisstruktur, Schichtenarchitektur und DDD: Service auslagern, Hello -> Buch, container für manuelle DI mit Singletons
- Gruppierung und Aufteilung von Router
- Middleware für Antwortzeit ("response time") und Request
- Request- und Response-Body komprimieren mit "hono/compress" für GZip
- Security-Header (ähnlich wie Helmet für Express): z.B. STS, nosniff, ..., CORS
  - CSP (= Content Security Policy): nur bei HTML notwendig
  - Schutz vor XSS (= Cross-Site Scripting): nur bei HTML notwendig

## REST-Schnittstelle, DB-Zugriff, Validierung, Bruno und Testen

- Logging mit Pino
- Router mit Pfad- und Query-Parameter
- Statuscodes
- Header: Location, If-Non-Match, SPÄTER: If-Match, ETag
- OR-Mapping mit Prisma sowie DB-Server durch PostgreSQL mit "Hardened" Image
  (einschl. Fetch-Join, flexible WHERE-Klauseln, SPÄTER: Transaktionen, Lost Updates)
- Globale Fehlerbehandlung, z.B. 404, 412, 422, 428
- Optional: Typedoc mit Markdown-Syntax für API-Dokumentation
- POST-Request mit DTOs und Validierung durch zod
- Bruno
- DB neu laden mit CSV-Dateien
- Unit-Tests
- Integrationstests mit Vitest und fetch
- CI mit z.B. GitHub Actions

## Docker

- Dockerfile mit "Hardened" Image
- Docker Compose

## Weitere Funktionalitäten

- Mail mit nodemailer
- Keycloak-Integration durch jose
- Rollen durch Middleware
- PUT einschl. Vermeidung von "Lost Updates" sowie bedingte GET-Requests
- DELETE
- Health
- GraphQL durch Yoga (basiert auf graphql)
- File Upload und Download
- Lasttests mit k6
- AsciiDoc und PlantUML für Dokumentation
- Monitoring mit Prometheus und Grafana
