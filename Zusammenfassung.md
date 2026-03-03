# Zusammenfassung

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

[Juergen Zimmermann](mailto:Juergen.Zimmermann@HS-Karlsruhe.de)

GPL v3

## Entwicklungsumgebung

- Konfig-Dateien, Verzeichnisse
- bun mit package.json einschl. dependencies, devDependencies und scripts
- node_modules
- ES2015+, TypeScript einschl. .d.ts sowie tsconfig.json
- ESLint mit eslint.config.mts
- Prettier mit prettier.config.mts
- Git
- VS Code
- SonarQube
- Dockerfile
- Docker Compose
- Projektdokumentation mit AsciiDoctor mit PlantUML

## Bun und Hono

- REST durch Hono
- Router und Handler
  - HTTP-Methoden
  - Pfad-Parameter
  - Query-Parameter
  - Problem Details
  - Middleware
- Request und Response
  - Header und Body
  - Statuscodes
  - Location
  - If-Non-Match
  - If-Match
  - ETag
- Watch-Modus
- Validierung durch zod
- ORM durch Prisma (für PostgreSQL)
  - Schema
  - Code-Generierung
  - flexible WHERE-Klauseln
  - Fetch-Join: untergeordnete JSON-Daten mitlesen
  - Transaktionen
  - Lost Updates
- CSV-Dateien in die DB laden
- Mailing
- Integration mit Keycloak durch jose
- Middleware für Rollen
- File Upload und Download
- Logging mit Pino
- GraphQL durch Yoga
  - schema-first
  - Schema mit Types, Query und Mutation
  - Resolver mit Handler
- .env, config/resources, reguläre Ausdrücke mit /.../
- Error
- Token mit POST und application/x-www-form-urlencoded (oder GraphQL-Mutation)
- Tests mit Vitest und Fetch-API für Integrationstests
- Lasttests mit k6
- Monitoring mit Prometheus und Grafana

## Features von JavaScript und TypeScript

| Feature                                       | ECMAScript | TypeScript |
| --------------------------------------------- | ---------- | ---------- |
| import, export                                | 2015       |            |
| import type                                   |            | X          |
| Deklaration durch name: Typ                   |            | X          |
| const und let (statt var)                     | 2015       |            |
| Type Inference                                |            | X          |
| === und !==                                   | 1          |            |
| Destructuring für JSON-Objekte und -Arrays    | 2015       |            |
| Shorthand Properties                          | 2015       |            |
| Rest (und Spread) Properties für JSON-Objekte | 2018       |            |
| (Rest und Spread Properties für JSON-Arrays)  | 2015       |            |
| Optional Chaining ?.                          | 2020       |            |
| Nullish Coalescing ??                         | 2020       |            |
| Template Strings                              | 2015       |            |
| Trailing Comma                                | 2017       |            |
| Arrow Function                                | 2015       |            |
| Klasse                                        | 2015       |            |
| Type                                          |            | X          |
| Omit                                          |            | X          |
| Pick                                          |            | X          |
| Interface                                     |            | X          |
| #                                             | 2020       |            |
| private, protected                            |            | X          |
| readonly                                      |            | X          |
| for await                                     | 2018       |            |
| Promise                                       | 2015       |            |
| async und await                               | 2017       |            |
| Top-Level await                               | 2020       |            |
| IIFE                                          | 1          |            |

## Docker

- Dockerfile
- Docker Compose
