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

-- https://dev.mysql.com/doc/refman/9.3/en/create-user.html
-- https://dev.mysql.com/doc/refman/9.3/en/role-names.html
CREATE USER IF NOT EXISTS buch IDENTIFIED BY 'p';
GRANT USAGE ON *.* TO buch;

-- https://dev.mysql.com/doc/refman/9.3/en/create-database.html
-- https://dev.mysql.com/doc/refman/9.3/en/charset.html
-- SHOW CHARACTER SET;
CREATE DATABASE IF NOT EXISTS buch CHARACTER SET utf8;

GRANT ALL PRIVILEGES ON buch.* to buch;

-- https://dev.mysql.com/doc/refman/9.3/en/create-tablespace.html
-- .idb-Datei innerhalb vom "data"-Verzeichnis
CREATE TABLESPACE `buchspace` ADD DATAFILE 'buchspace.ibd' ENGINE=INNODB;
