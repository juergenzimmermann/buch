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

- [Docker Container vs. Installation auf dem Host-Rechner](#docker-container-vs-installation-auf-dem-host-rechner)
- [Named Volumes erstellen](#named-volumes-erstellen)
- [Named Volumes initialisieren](#named-volumes-initialisieren)
- [Installation ohne TLS](#installation-ohne-tls)
- [Datenbank, Datenbank-User, Schema, Tabellen und Daten anlegen](#datenbank-datenbank-user-schema-tabellen-und-daten-anlegen)
- [Ausgewählte Administrationskommandos für PostgreSQL](#ausgewählte-administrationskommandos-für-postgresql)
- [Optional: TLS für den PostgreSQL-Server mit OpenSSL überprüfen](#optional-tls-für-den-postgresql-server-mit-openssl-überprüfen)
- [Erweiterung PostgreSQL für VS Code](#erweiterung-postgresql-für-vs-code)
  - [Konfiguration](#konfiguration)
  - [DB-Schema visualisieren](#db-schema-visualisieren)
  - [Chat mit Copilot](#chat-mit-copilot)

## Docker Container vs. Installation auf dem Host-Rechner

Wenn _PostgreSQL_ bereits auf dem Host-Rechner installiert ist, dann läuft auch
ein Datenbank-Server i.a. auf dem Default-Port `5432`. In diesem Fall kann man
diesen - vermutlich ohne TLS - weiter benutzen oder aber man beendet den
ensprechenden Hintergrund-Prozess bzw. Dienst oder man deinstalliert
PostgreSQL komplett.

## Named Volumes erstellen

Zunächst werden _Named Volumes_ in Docker eingerichtet für

- die Datenbanken
- die Tablespaces
- SQL-Skripte zum Neuanlegen der DB und des Schemas
- Zertifikat und privater Schlüssel für TLS.

```shell
    docker volume create pg_data
    docker volume create pg_tablespace
    docker volume create pg_init
```

Für Details zu Volumes siehe https://docs.docker.com/engine/storage/volumes.

## Named Volumes initialisieren

Mit dem _Hardened Image_ für _PostgreSQL_ `dhi.io/postgres` wird ein Container
so gestartet, dass nur eine _Bash_ mit dem Linux-Superuser mit UID `0` läuft.
Es wird lediglich das Dateisystem vom PostgreSQL-Image einschließlich der Named Volumes
für Kopiervorgänge in die neu angelegten Named Volumes benötigt sowie die
Berechtigung zum Ändern vom Linux-Owner und von der Linux-Group (s.u.).
`dhi` steht übrigens für _Docker Hardened Image_.

```shell
    # Windows
    cd extras\compose\postgres
    docker run -v pg_init:/init -v pg_tablespace:/tablespace -v ./init:/tmp/init:ro `
      --rm -it -u 0 --entrypoint '' dhi.io/postgres:18.1-debian13 /bin/bash

    # macOS
    cd extras/compose/postgres
    docker run -v pg_init:/init -v pg_tablespace:/tablespace -v ./init:/tmp/init:ro \
    --rm -it -u 0 --entrypoint '' dhi.io/postgres:18.1-debian13 /bin/bash
```

Um die SQL-Skripte sowie Zertifikat und privater Schlüssel für TLS aus dem
Original-Verzeichnis `init\buch\sql` bzw. `init\buch\tls` in das Named Volume
`pg_init` kopieren zu können, wurde das lokale Verzeichnis `.\init` in `/tmp/init`
bereitgestellt. In der _bash_ werden deshalb die SQL-Skripte sowie Zertifikat und
privater Schlüssel aus dem Verzeichnis `/tmp/init` nach `/init` und deshalb in
das Named Volume `pg_init` kopiert. Danach wird das Verzeichnis `/tablespace/buch`
angelegt, welches im Named Volume `pg_tablespace` liegt. Jetzt wird bei den Dateien
der Owner und die Gruppe auf `postgres` gesetzt sowie die Zugriffsrechte auf Oktal
`400`, d.h. nur der Owner hat Leserechte.

```shell
    cp -r /tmp/init/* /init
    mkdir /tablespace/buch
    chown -R postgres:postgres /init /tablespace
    chmod 400 /init/*/sql/* /init/tls/*
    ls -lR /init
    ls -l /tablespace
    exit
```

## Installation ohne TLS

Für _TLS_ erwartet _PostgreSQL_ standardmäßig die Dateien `server.crt` und
`server.key` im Verzeichnis `/var/lib/postgresql/18/data`, was aber zu Beginn
der Installation leer sein muss. Deshalb wird der PostgreSQL-Server zunächst
ohne TLS gestartet, damit `/var/lib/postgresql/18/data` initialisiert wird.
Dazu muss in `compose.yml` temporär die Zeile `command: ...` auskommentiert
werden. Danach wird der PostgreSQL-Server mit dem _Hardened Image_ als
Docker-Container gestartet

```shell
    # in der 1. Shell
    docker compose up db
```

Nachdem in der ersten Shell der Server erfolgreich gestartet und initialisiert
ist, werden `server.crt` und `server.key` aus dem Named Volume `pg_init`, d.h.
aus dem Verzeichnis `/init/tls`, in das Verzeichnis `/var/lib/postgresql/18/data`
kopiert. Danach wird der Server bzw. Container wieder heruntergefahren, da er
noch ohne TLS läuft.

```shell
    # in der 2. Shell
    docker compose exec db bash -c 'cp /init/tls/* /var/lib/postgresql/18/data'
    docker compose down
```

## Datenbank, Datenbank-User, Schema, Tabellen und Daten anlegen

In der 1. Shell startet man wieder den DB-Server als Docker Container, und zwar
jetzt mit TLS:

```shell
    docker compose up
```

In der 2. Shell werden die beiden SQL-Skripte ausgeführt, um zunächst eine neue
DB `buch` mit dem DB-User `buch`anzulegen. Mit dem 2. Skript wird das Schema
`buch` mit dem DB-User `buch` als _Owner_ angelegt. Abschließend werden die
Tabellen angelegt und mit Testdaten aus den CSV-Dateien aus dem Verzeichnis
`/init/buch/csv` im Named Volume `pg_init` gefüllt.

```shell
    docker compose exec db bash
        psql --dbname=postgres --username=postgres --file=/init/buch/sql/create-db.sql
        psql --dbname=buch --username=buch --file=/init/buch/sql/create-schema.sql

        psql --dbname=buch --username=buch --file=/init/buch/sql/create-table.sql
        psql --dbname=buch --username=postgres --file=/init/buch/sql/copy-csv.sql
        exit
    docker compose down
```

Die SQL-Skripte `copy-csv.sql` und `create-table.sql` im Verzeichnis
`extras\compose\postgres\sql` sind Kopien der Original-Skripte aus dem Verzeichnis
`src\config\resources\postgresql`, wo sie später für den _Nest_-basierten
Appserver benötigt werden, d.h. eventuelle Änderungen müssen im Verzeichnis
`src\config\resources\postgresql` vorgenommen werden. Durch die Kopien kann aber
die Datenbank nach der Installation über das Named Volume mit Testdaten gefüllt
werden kann.

## Ausgewählte Administrationskommandos für PostgreSQL

Zunächst muss natürlich der PostgreSQL-Server gestartet sein:

```shell
    docker compose up
```

Danach kann man in einer zweiten Shell `psql`, d.h. das CLI von PostgreSQL, aufrufen:

```shell
    docker compose exec db bash -c 'psql --dbname=postgres --username=postgres'
        -- absoluter Dateiname fuer i.a. postgresql.conf
        SHOW config_file;

        -- absoluter Dateiname fuer i.a. pg_hba.conf ("host-based authentication")
        SHOW hba_file;

        -- Algorithmus zur Verschluesselung von Passwoertern, z.B. scram-sha-256 (siehe pg_hba.conf)
        -- SCRAM = Salted Challenge Response Authentication Mechanism
        -- https://www.rfc-editor.org/rfc/rfc7677
        -- https://www.rfc-editor.org/rfc/rfc9266
        SHOW password_encryption;

        -- Benutzernamen und verschluesselte Passwoerter
        SELECT rolname, rolpassword FROM pg_authid;

        -- Laeuft der Server mit TLS?
        SHOW ssl;

        -- Datei mit dem Zertifikat fuer TLS
        SHOW ssl_cert_file;

        -- Datei mit dem privaten Schluessel fuer TLS
        SHOW ssl_key_file;

        -- alle Einstellungen bzw. Konfigurationsparameter
        SELECT name, setting, source FROM pg_settings;

        -- psql beenden ("quit")
        \q
```

## Optional: TLS für den PostgreSQL-Server mit OpenSSL überprüfen

Jetzt kann man bei Bedarf noch die TLS-Konfiguration für den PostgreSQL-Server
überprüfen. Dazu muss der PostgreSQL-Server natürlich gestartet sein (s.o.).
In einer Shell startet man einen Docker Container mit dem Image `nicolaka/netshoot`,
der dasselbe virtuelle Netzwerk nutzt wie der PostgreSQL-Server:

```shell
    # Windows
    cd extras\compose\debug

    # macOS
   cd extras/compose/debug

   docker compose up
```

In einer weiteren Shell startet man eine `bash` für diesen Docker Container, um
darin mit `openssl` eine TLS-Verbindung über das virtuelle Netzwerk mit dem
PostgreSQL-Server aufzubauen.

```shell
   cd extras\compose\debug
   docker compose exec netshoot bash -c 'openssl s_client -tls1_3 -trace postgres:5432'
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

## Erweiterung PostgreSQL für VS Code

Für VS Code gibt übrigens auch folgende Erweiterungen:

- _SQL Server (mssql)_ von _Microsoft_ mit KI-Unterstützung durch Copilot
- _Oracle SQL Developer Extension for VS Code_ von _Oracle_ **ohne** KI-Unterstützung durch Copilot
- Für MySQL gibt es folgende Erweiterungen:
  - _MySQL_ von Jun Han: wird seit 2023 nicht mehr gepflegt bzw. weiterentwickelt
  - _MySQL_ von "Database Client" (?): **ohne** KI-Unterstützung durch Copilot

### Konfiguration

Mit der Erweiterung _PostgreSQL_ für VS Code kann man die Datenbank `buch` und
deren Daten verwalten. Man klickt man auf _+ Verbindung hinzufügen_
und gibt beim Karteireiter _Parameter_ folgende Werte ein:

- SERVER NAME: z.B. `localhost`
- USER NAME: `postgres` (siehe `compose.yml`)
- PASSWORD: `p` (siehe `compose.yml`)
- KENNWORT SPEICHERN: Haken setzen, damit man nicht immer das Passwort eingeben muss
- DATABASE NAME: `postgres` (das Data Dictionary)

Danacht klickt man auf den Button _Erweitert_, klappt das Menü _SSL_ auf und
gibt folgende Werte ein:

- SSL MODE: _require_ auswählen
- SSL CERTIFICATE FILENAME: im Verzeichnis `extras\compose\postgres\init\tls`
  die Datei `server.crt` auswählen
- SSL KEY FILENAME: im Verzeichnis `extras\compose\postgres\init\tls`
  die Datei `server.key` auswählen

Jetzt den modalen Dialog schließen, d.h. rechts oben auf _X_ klicken, und danach
den Button _Verbindung testen_ anklicken. Wenn dann im Button ein Haken erscheint,
kann man den anderen Button _Save & Connect_ anklicken, um die Verbindung zu speichern.
Im Untermenü _Databases_ von der Verbindung sieht man dann z.B. die Datenbank `buch`
mit dem gleichnamigen Schema `buch` und die Datenbank `postgres`.
Ebenso kann man man unter _Roles_ den DB-User `buch` und den Superuser `postgres`
sehen sowie bei _Tablespaces_ den Default-Tablespace `pg_default` und den
eigenen Tablespace.

### DB-Schema visualisieren

Im Kontextmenü für eine DB den Menüpunkt _Schema visualisieren_ anklicken.

### Chat mit Copilot

Voraussetzung ist, dass die DB geöffnet ist und z.B. eine einfache Query ausgeführt wurde.
Im Kontextmenü für eine DB den Menüpunkt _Mit dieser Datenbank chatten_ anklicken.
Danach im Chat-Fenster Fragen stellen und ggf. nachhaken, z.B.:

- Wie kann ich Bücher mit einem "a" im Titel selektieren?
- Ich möchte die Daten der Bücher und nicht den Untertitel.
- Jetzt fehlt aber der Buchtitel.
- Wie kann ich diese Daten als CSV exportieren?

**BEACHTE**:

- _Bücher_ mit deutschem Umlaut als Plural der DB-Tabelle `buch`.
- Es wird auch erkannt, dass `ILIKE` anstelle von `=` benutzt werden soll.
