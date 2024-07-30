-- Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

-- (1) in extras\compose\backend\postgres\compose.yml
--        auskommentieren:
--           Zeile mit "command:" und nachfolgende Listenelemente mit führendem "-"
--              damit der MySQL-Server ohne TLS gestartet wird
--           bei den Listenelementen unterhalb von "volumes:" die Zeilen mit "read_only:" bei server-key.pem, server-cert.pem und ca.pem
--              damit die Zugriffsrechte fuer den privaten Schluessel und das Zertifikat nachfolgend gesetzt werden koennen
-- (2) PowerShell:
--     cd extras\compose\backend\mysql
--     docker compose up db
-- (3) 2. PowerShell:
--     cd extras\compose\backend\mysql
--     docker compose exec db bash
--        cd /var/lib/mysql
--        chmod 400 server-key.pem
--        chmod 400 server-cert.pem
--        chmod 400 ca.pem
--        chgrp mysql server-key.pem
--        chgrp mysql server-cert.pem
--        chgrp mysql ca.pem
--        exit
--     docker compose down
-- (4) PowerShell:
--     docker compose up
-- (5) 2. PowerShell:
--     docker compose exec db bash
--         mysql --user=root --password=p < /sql/create-db-buc.sql
--         exit
--     docker compose down

-- https://dev.mysql.com/doc/refman/9.0/en/mysql.html
--   mysqlsh ist *NICHT* im Docker-Image enthalten


-- https://dev.mysql.com/doc/refman/9.0/en/create-user.html
-- https://dev.mysql.com/doc/refman/9.0/en/role-names.html
CREATE USER IF NOT EXISTS buch IDENTIFIED BY 'p';
GRANT USAGE ON *.* TO buch;

-- https://dev.mysql.com/doc/refman/9.0/en/create-database.html
-- https://dev.mysql.com/doc/refman/9.0/en/charset.html
-- SHOW CHARACTER SET;
CREATE DATABASE IF NOT EXISTS buch CHARACTER SET utf8;

GRANT ALL PRIVILEGES ON buch.* to buch;

-- https://dev.mysql.com/doc/refman/9.0/en/create-tablespace.html
-- .idb-Datei innerhalb vom "data"-Verzeichnis
CREATE TABLESPACE `buchspace` ADD DATAFILE 'buchspace.ibd' ENGINE=INNODB;
