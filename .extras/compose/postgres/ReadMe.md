# Hinweise zur Installation und Konfiguration von PostgreSQL

<!--
  Copyright (C) 2023 - present Juergen Zimmermann, Hochschule Karlsruhe

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

[Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)

## Inhalt

- [Installation ohne TLS](#installation-ohne-tls)
- [Konfiguration für Tablespace und TLS](#konfiguration-für-tablespace-und-tls)
- [Datenbank, Datenbank-User, Schema und Tabellen anlegen](#datenbank-datenbank-user-schema-und-tabellen-anlegen)
- [Optional: TLS für den PostgreSQL-Server mit OpenSSL überprüfen](#optional-tls-für-den-postgresql-server-mit-openssl-überprüfen)
- [Optional: pgAdmin](#optional-pgadmin)

## Installation ohne TLS

In der Datei `.extras\compose\postgres\compose.yml` muss man folgende Zeilen
auskommentieren:

- Den Schlüssel `command:` und die nachfolgenden Listenelemente mit führendem `-`,
  damit der PostgreSQL-Server zunächst ohne TLS gestartet wird.
- Bei den Zeilen mit den Listenelementen unterhalb vom Schlüssel `volumes:`
  jeweils die Zeilen mit dem Schlüssel `read_only:` damit die Zugriffsrechte für
  den privaten Schlüssel und das Zertifikat später gesetzt werden können:
  - bei `key.pem` und
  - bei `certificate.crt`
- Die Zeile mit dem Schlüssel `user:`, damit der PostgreSQL-Server implizit mit
  dem Linux-User `root` gestartet wird.

Außerdem muss man in derselben Datei `.extras\compose\postgres\compose.yml` in
der Zeile mit `#cap_add: [...]` den Kommentar entfernen.

Nun startet man in einer PowerShell den PostgreSQL-Server:

```powershell
    cd .extras\compose\postgres
    docker compose up
```

## Konfiguration für Tablespace und TLS

Für das _Volume Mounting_ in `.extras\compose\postgres\compose.yml` muss man in
Windows das Verzeichnis `C:/Zimmermann/volumes/postgres/tablespace/buch` anlegen
oder geeignet anpassen. Danach werden _Owner_, _Group_ und eingeschränkte
Zugriffsrechte im (Linux-) Docker Container in einer 2. PowerShell gesetzt:

```powershell
   cd .extras\compose\postgres
   docker compose exec db bash
      chown postgres:postgres /var/lib/postgresql/tablespace
      chown postgres:postgres /var/lib/postgresql/tablespace/buch
      chown postgres:postgres /var/lib/postgresql/key.pem
      chown postgres:postgres /var/lib/postgresql/certificate.crt
      chmod 400 /var/lib/postgresql/key.pem
      chmod 400 /var/lib/postgresql/certificate.crt
      exit
   docker compose down
```

Nachdem der Docker Container heruntergefahren ist, werden in `compose.yml` die
zuvor gesetzten Kommentare wieder entfernen, d.h.

- Beim Schlüssel `command:` und den nachfolgenden Listenelementen, damit der
  PostgreSQL-Server mit TLS gestartet wird.
- Bei den Zeilen mit den Listenelementen unterhalb vom Schlüssel `volumes:`
  jeweils bei Zeilen mit dem Schlüssel `read_only:`, weil inzwischen die
  Zugriffsrechte gesetzt bzw. eingeschränkt sind:
  - bei `key.pem` und
  - bei `certificate.crt`
- Bei der Zeile mit dem Schlüssel `user:`, damit der PostgreSQL-Server als
  normaler Linux-User `postgres` gestartet wird.

Außerdem muss man in derselben Datei `.extras\compose\postgres\compose.yml` die
Zeile mit `cap_add: [...]` wieder auskommentieren.

Jetzt läuft der DB-Server mit folgender Konfiguration:

- Rechnername `localhost` aus Windows-Sicht
- Default-Port `5432` bei _PostgreSQL_
- Datenbankname `buch`
- Administrations-User `postgres` bei _PostgreSQL_
- Passwort `p` für diesen Administrations-User

## Datenbank, Datenbank-User, Schema und Tabellen anlegen

In der 1. PowerShell startet man wieder den DB-Server als Docker Container, und
zwar jetzt mit TLS:

```powershell
    docker compose up
```

In der 2. PowerShell werden die beiden SQL-Skripte ausgeführt, um zunächst eine
neue DB `buch` mit dem DB-User `buch`anzulegen. Mit dem 2. Skript wird das
Schema `buch` mit dem DB-User `buch` als _Owner_ angelegt:

```powershell
   docker compose exec db bash
      psql --dbname=postgres --username=postgres --file=/sql/create-db-buch.sql
      psql --dbname=buch --username=buch --file=/sql/create-schema-buch.sql
      psql --dbname=buch --username=buch --file=/sql/create-table.sql
      psql --dbname=buch --username=postgres --file=/sql/copy-csv.sql
      exit
    docker compose down
```

Die SQL-Skripte liegen z.B. im Windows-Verzeichnis `C:\Zimmermann\volumes\postgres\sql`
und sind durch _Volume Mount_ in `compose.yml` im PostgreSQL-Server als
Linux-Verzeichnis `/sql` verfügbar.

_Kopien_ der SQL-Skripte `create-db-buch.sql` und `create-schema-buch.sql` sind
im Projekt-Verzeichnis `.extras\compose\postgres\sql`, damit man den SQL-Editor
der IDE nutzen kann. Eventuelle Änderungen müssen auf jeden Fall in
`C:\Zimmermann\volumes\postgres\sql` gemacht werden, z.B. durch Kopieren der Dateien.
Kopien der CSV-Dateien für Testdaten sind im Projekt-Verzeichnis `.extras\compose\postgres\csv`
und die Originale in `C:\Zimmermann\volumes\postgres\csv`. Diese SQL-Skripte und
CSV-Dateien können ausschließlich vom DB-Administrator `postgres` benutzt werden,
und zwar Server-seitig.

Die _Original_-Skripte `create-table.sql` und `copy-csv.sql` sind im Projekt-Verzeichnis
`src\config\resources\postgresql`. Dort werden sie später für den _Nest_-basierten
Appserver benötigt.

## Optional: TLS für den PostgreSQL-Server mit OpenSSL überprüfen

Jetzt kann man bei Bedarf noch die TLS-Konfiguration für den PostgreSQL-Server
überprüfen. Dazu muss der PostgreSQL-Server natürlich gestartet sein (s.o.).
In einer PowerShell startet man einen Docker Container mit dem Image
`nicolaka/netshoot`, der dasselbe virtuelle Netzwerk nutzt wie der PostgreSQL-Server:

```powershell
   cd .extras\compose\debug
   docker compose up
```

In einer weiteren Powershell startet man eine `bash` für diesen Docker Container,
um darin mit `openssl` eine TLS-Verbindung über das virtuelle Netzwerk mit dem
PostgreSQL-Server aufzubauen.

```powershell
   cd .extras\compose\debug
   docker compose exec netshoot bash
       openssl s_client -tls1_3 -trace postgres:5432
       exit
   docker compose down
```

Die Ausgabe vom Kommando `openssl` zeigt u.a. folgendes an:

- das selbst-signierte Zertifikat
- S(ubject)
- CN (Common Name)
- OU (Organizational Unit)
- O(rganization)
- L(ocation)
- ST(ate)
- C(ountry)

## Optional: pgAdmin

Zur Administration von _PostgreSQL_ kann als Alternative zur Erweiterung
_PostgreSQL_ für VS Code auch _pgAdmin_ verwendet werden. pgAdmin ist durch
Docker Compose (siehe `.extras\compose\pgadmin`) über ein virtuelles Netzwerk mit
dem Docker-Container des DB-Servers verbunden. Deshalb muss beim Verbinden mit
dem DB-Server der virtuelle Rechnername `postgres` statt `localhost` verwendet
werden. pgAdmin kann man mit einem Webbrowser und der URL `http://localhost:8888`
aufrufen. Die Emailadresse `pgadmin@acme.com` und das Passwort `p` sind beim
Schlüssel `environment` in `.extras\compose\pgadmin\compose.yml` voreingestellt.

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
