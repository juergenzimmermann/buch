# Hinweise zur Migration von PostgreSQL

<!--
  Copyright (C) 2026 - present Juergen Zimmermann, Hochschule Karlsruhe

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

- [Dump des PostgreSQL-Clusters](#dump-des-postgresql-clusters)
- [Vorbereitung des neuen PostgreSQL-Clusters](#vorbereitung-des-neuen-postgresql-clusters)
  - [Leeren Tablespace anlegen](#leeren-tablespace-anlegen)
  - [TLS initialisieren](#tls-initialisieren)
- [Importieren des Dumps in den neuen PostgreSQL-Cluster](#importieren-des-dumps-in-den-neuen-postgresql-cluster)

## Dump des PostgreSQL-Clusters

Zunächst wird in einer Shell der PostgreSQL-Container mit dem alten Image gestartet.

In einer zweiten Shell wird dann ein Dump des Clusters (mit Schemas, Tablespaces,
User usw.) erstellt, als lokales SQL-Skript `cluster_dump.sql` gesichert und abschließend
der Container mit dem alten Image wieder heruntergefahren:

```shell
    docker compose exec --no-tty postgres pg_dumpall -v -U postgres -f /tmp/cluster_dump.sql
    docker compose cp postgres:/tmp/cluster_dump.sql ./cluster_dump.sql
    docker compose down
```

## Vorbereitung des neuen PostgreSQL-Clusters

### Leeren Tablespace anlegen

Zunächst müssen die Named Volumes `pg_data` und `pg_tablespace` für die Datenbanken und
Tablespaces gelöscht und danach neu erzeugt werden:

```shell
    docker volume rm pg_data
    docker volume rm pg_tablespace
    docker volume create pg_data
    docker volume create pg_tablespace
```

Danach wird das neue Image verwendet, um den Tablespace mit den korrekten Zugriffsrechten anzulegen:
docker run -v pg_tablespace:/tablespace --rm -it -u 0 --entrypoint '' postgres:19rc1-trixie /bin/bash

```shell
    mkdir /tablespace/buch
    chown -R postgres:postgres /tablespace
    exit
```

### TLS initialisieren

Jetzt wird PostgreSQL mit dem neuen Image für _TLS_ vorbereitet.

Dazu muss in `compose.yml` temporär der Schlüssel `command: ...` mit den
nachfolgenden Zeilen für die Listenelemente auskommentiert werden. Außerdem
muss beim Volume `pg_init` die Option `:ro` (read-only) entfernt werden.
Desweiteren muss die Zeile mit dem Schlüssel `user` auskommentiert und bei der Zeile mit
`cap_add` der Kommentar entfernt werden. Danach wird der PostgreSQL-Server als
_Docker-Container_ gestartet.

```shell
    # in der 1. Shell
    docker compose up
```

Jetzt werden für TLS die Dateien mit dem privaten Schlüssel und dem Zertifikat aus dem
Volume `pg_init` in die PostgreSQL-Installationkopiert und die Zugriffsrechte angepasst.
Abschließend wird der Container (noch ohne TLS) wieder heruntergefahren.

```shell
    docker compose exec postgres bash
        cd /var/lib/postgresql/19/docker
        chmod 777 .
        chmod 444 /init/tls/server.*
        cp /init/tls/* .
        chown postgres:postgres server.*
        chmod 400 server.*
        chmod 700 .
        exit
    docker compose down
```

Nachdem der PostgreSQL-Container heruntergefahren ist, macht man die obigen
Änderungen wieder rückgängig:

- Kommentar beim Schlüssel `command` wieder entfernen
- Beim Volume `pg_init` die Option `:ro` wieder hinzufügen
- Kommentar beim Schlüssel `user` wieder entfernen
- den Schlüssel `cap_add` wieder auskommentieren

## Importieren des Dumps in den neuen PostgreSQL-Cluster

In der ersten Shell wird der PostgreSQL-Server mit dem neuen Image und mit TLS gestartet:

```shell
    docker compose up
```

In der zweiten Shell wird der Dump in den neuen PostgreSQL-Cluster importiert:

```shell
    docker compose cp ./cluster_dump.sql postgres:/tmp/cluster_dump.sql
    docker compose exec --no-tty postgres psql --no-psqlrc -U postgres -d postgres -f /tmp/cluster_dump.sql
```

Abschließend kann man die Datenbanken, User und Tablespaces im neuen PostgreSQL-Cluster
inspizieren:

```shell
    docker compose exec --no-tty postgres psql --no-psqlrc -U postgres -d postgres -c "\l+"
    docker compose exec --no-tty postgres psql --no-psqlrc -U postgres -d postgres -c "\du+"
    docker compose exec --no-tty postgres psql --no-psqlrc -U postgres -d postgres -c "\db+"
```
