# Hinweise zu MySQL

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

[Juergen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)

## Installation ohne TLS

In der Datei `.extras\compose\mysql\compose.yml` muss man folgende Zeilen
auskommentieren:

- Die Zeile mit dem Schlüssel `command:` und die nachfolgenden Listenelemente
  mit führendem `-`, damit der MySQL-Server zunächst ohne TLS gestartet wird.
- Unterhalb vom Schlüssel `volumes:` folgende komplette Listenelemente:
  - `server-key.pem`,
  - `server-cert.pem` und
  - `ca.pem`
- Die Zeile mit dem Schlüssel `user:`, damit der MySQL-Server implizit mit
  dem Linux-User `root` gestartet wird.

Nun startet man in einer PowerShell den MySQL-Server:

```powershell
    cd .extras\compose\mysql
    docker compose up db
```

In einer 2. Powershell startet man eine `bash` im Linux-Container von MySQL und
setzt das Passwort vom MySQL-Administrator `root` auf `p`.

```powershell
    cd .extras\compose\mysql
    docker compose exec db bash
        mysql
            ALTER USER 'root'@'localhost' IDENTIFIED BY 'p';
            UPDATE mysql.user SET host='%' WHERE user='root';
            exit
        exit
    docker compose down
```

## Konfiguration für TLS

In der Datei `.extras\compose\mysql\compose.yml` müssen jetzt die folgenden
Kommentare entfernt werden:

- bei den Listenelementen mit `server-key.pem`, `server-cert.pem` und `ca.pem`
  **BIS AUF** die Zeilen mit `read_only:`.
- beim Schlüssel `user:`, um den den Linux-User `mysql` wieder zu aktivieren.

Jetzt wird der MySQL-Server erneut als Docker-Container gestartet, und zwar mit
dem Linux-User `mysql`, allerdings noch ohne TLS:

```powershell
    docker compose up db
```

In der 2. PowerShell startet man eine `bash` im Docker-Container von MySQL und
setzt die Zugriffsrechte für TLS:

```powershell
    docker compose exec db bash
        cd /var/lib/mysql
        chmod 400 server-key.pem
        chmod 400 server-cert.pem
        chmod 400 ca.pem
        exit
     docker compose down
```

Nun entfernt man in `.extras\compose\mysql\compose.yml` die folgenden Kommentare

- in der Zeile mit `command:` und den nachfolgenden Listenelementen mit
  führendem `-`
- Unterhalb vom Schlüssel `volumes:` bei diesen Listenelementen jeweils bei `read_only:`
  - `server-key.pem`
  - `server-cert.pem`
  - `ca.pem`

### Datenbank und Datenbank-User anlegen

In der 1. PowerShell startet man wieder den DB-Server als Docker Container, und
zwar jetzt mit TLS:

```powershell
    docker compose up db
```

In der 2. PowerShell wird das SQL-Skripte ausgeführt, um zunächst eine
neue DB `buch` mit dem DB-User `buch`anzulegen.

```powershell
   docker compose exec db bash
      mysql --user=root --password=p < /sql/create-db-kunde.sql
      exit
    docker compose down
```

Das SQL-Skript liegt z.B. im Windows-Verzeichnis `C:\Zimmermann\volumes\mysql\sql`
und ist durch _Volume Mount_ in `compose.yml` im MySQL-Server als Linux-Verzeichnis
`/sql` verfügbar. Kopien der beiden SQL-Skripte sind im Projekt-Verzeichnis
`.extras\compose\mysql\sql`, damit man den SQL-Editor der IDE nutzen kann.
Eventuelle Änderungen müssen auf jeden Fall in `C:\Zimmermann\volumes\mysql\sql`
gemacht werden, z.B. durch Kopieren der Datei.

### Konfiguration für phpMyAdmin

In der Datei `extras\compose\mysql\compose.yml` muss man innerhalb vom Service
`phpmyadmin`beim Volume die Zeile mit `read_only:` auskommentieren. Danach startet
man den MySQL-Server und _phpMyAdmin_ jeweils als Docker Container.

```powershell
    docker compose up
```

In der 2. PowerShell startet man eine `bash` im Docker-Container von phpMyAdmin
und setzt die Zugriffsrechte für PHP-Skripte:

```powershell
    docker compose exec phpmyadmin bash
       cd /etc/phpmyadmin
       chmod 644 config.*.php
       exit
    docker compose down
```

Abschließend entfernt man in `compose.yml` beim Service _phpmyadmin_ und dessen
Volume den Kommentar beim Schlüssel `read_only:` wieder.

### TLS für den MySQL-Server überprüfen

Jetzt kann man bei Bedarf noch die TLS-Konfiguration für den MySQL-Server
überprüfen. Dazu muss der MySQL-Server natürlich gestartet sein (s.o.).

```powershell
   cd extras\compose\mysql
   docker compose exec db bash
       mysql -h mysql -u root -p --ssl-mode=REQUIRED
           SHOW SESSION STATUS LIKE 'Ssl_version';
           SHOW STATUS LIKE 'Ssl_cipher';
           quit
       exit
```

### CLI mysqlsh statt mysql?

`mysqlsh` ist **NICHT** im Docker-Image enthalten (siehe https://dev.mysql.com/doc/refman/9.4/en/mysql.html).
