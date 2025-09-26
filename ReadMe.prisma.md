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
> Visual Studio Code leicht gelesen werden.
>
> Näheres zu Markdown gibt es z.B. bei [Markdown Guide](https://www.markdownguide.org/)

## Voraussetzungen

### pnpm

_pnpm_ ist gemäß Installationsanleitung installiert

### Datenbank mit PostgreSQL

DB mit _PostgreSQL_ ist gemäß `.extras\compose\postgres\ReadMe.md` aufgesetzt.

### node_modules

Jetzt werden Softwarepakete für _Prisma_ und für die spätere Entwicklung mit
z.B. _Nest_ installiert.

```shell
    pnpm i
```

---

## Schema für ein neues Projekt

Für dieses Projektbeispiel **ÜBERSPRINGEN**, weil `prisma\schema.prisma` schon existiert.
Weiter mit [Code-Generierung für den DB-Client](#code-generierung-für-den-db-client).

### Initiales Schema erstellen

Zunächst muss man ein neues (Prisma-)Schema erstellen, d.h. im Verzeichnis `prisma`
wird die Datei `schema.prisma` angelegt:

```shell
    pnpx prisma init
```

### Models aus einer bestehenden DB generieren

Als nächstes müssen (Prisma-) Models aus der bestehenden DB generiert werden,
um später das OR-Mapping zu ermöglichen. Dazu muss der DB-Server mit einer
existierenden DB gestartet sein:

```powerhell
    cd .extras\compose\postgres
    docker compose up
```

Damit sich der Prisma-Client für die Generierung mit der DB verbinden kann,
muss die Umgebungsvariable `DATABASE_URL` in der Datei `.env` gesetzt sein, z.B.
`"postgresql://buch:p@localhost/buch?schema=buch&connection_limit=10&sslnegotiation=direct?sslcert=../src/config/resources/postgresql/certificate.cer"`.
Dadurch ist folgendes konfiguriert:

- Benutzername: `buch`
- Passwort: `p`
- DB-Host: `localhost`
- DB-Name: `buch`
- Schema: `buch`
- Größe des Verbindungs-Pools: max. `10` Verbindungen
- SSL: durch die Zertifikatsdatei `certificate.cer` im Verzeichnis `src\config\resources\postgresql`

Nun wird die Generierung durchgeführt, so dass die Datei `prisma\schema.prisma`
um die Models für das spätere OR-Mapping ergänzt wird:

```shell
    pnpx prisma db pull
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
    url      = env("DATABASE_URL")
    schemas  = ["buch"]
  }
```

---

## Code-Generierung für den DB-Client

Das (Prisma-) Schema enthält nun die exakten Abbildungsvorschriften für das
künftige OR-Mapping. Mit diesem Schema kann nun der Prisma-Client generiert
werden, der später für das OR-Mapping in TypeScript verwendet wird:

```shell
    pnpx prisma generate
```

---

## Einfaches Beispiel in TypeScript

Jetzt kann man mit TypeScript auf die DB zugreifen, z.B.:

```typescript
// src/beispiel.ts
// Aufruf:   node --env-file=.env src\beispiel.ts
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

```powershell
    node --env-file=.env src\beispiele.mts
    node --env-file=.env src\beispiele-write.mts
```

## Prisma Studio

Statt eines DB-Browsers, wie z.B. _pgAdmin_ oder die Erweiterung _PostgreSQL_
für VS Code, kann auch _Prisma Studio_ als DB-Werkzeug verwendet werden:

```shell
    pnpx prisma studio
```
