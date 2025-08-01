# Hinweise zu Keycloak als "Identity Management and Access" System

<!--
  Copyright (C) 2024 - present Juergen Zimmermann, Hochschule Karlsruhe

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
> VS Code leicht gelesen werden.

## Inhalt

- [JWT](#jwt)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [Inspektion der H2-Datenbank](#inspektion-der-h2-datenbank)

## JWT

Ein _JWT_ (= JSON Web Token) ist ein codiertes JSON-Objekt, das Informationen zu
einem authentifizierten Benutzer enthält. Ein JWT kann verfiziert werden, da er
digital signiert ist. Mit der URL `https://jwt.io` kann ein JWT in seine Bestandteile
decodiert werden:

- Algorithm
- Payload
- Signature

## Installation

_Keycloak_ wird als Docker Container gestartet, wofür das Verzeichnis
`C:\Zimmermann\volumes\keycloak` vorhanden sein und ggf. angelegt werden muss:

```powershell
    cd .extras\compose\keycloak
    docker compose up
```

In `compose.yml` sind unterhalb von `environment:` der temporäre Administrator
mit Benutzername und Passwort konfiguriert, und zwar Benutzername `tmp` und
Passwort `p`.

Außerdem sind die Umgebungsvariablen für die beiden Dateien für den privatem
Schlüssel und das Zertifikat gesetzt, so dass Keycloak wahlweise über
`https://localhost:8843` oder `http://localhost:8880` aufgerufen werden kann.

## Konfiguration

Nachdem Keycloak als Container gestartet ist, sind folgende umfangreiche
Konfigurationsschritte _sorgfältig_ durchzuführen, nachdem man in einem
Webbrowser `https://localhost:8843` oder `http://localhost:8880` aufgerufen hat:

```text
    Username    tmp
    Password    p
        siehe .env in extras\compose\keycloak

    Menüpunkt "Users"
        Button <Add user> anklicken
            Username    admin
            Email       admin@acme.com
            Last name   admin
            <Create> anklicken
        Tab "Credentials" anklicken
            Button <Set password> anklicken
                Password                p
                Password confirmation   p
                Temporary               Off
                Button <Save> anklicken
                Button <Save password> anklicken
        Tab "Role mapping" anklicken
            Button <Assign role> anklicken
                Drop-Down-Menü "Filter by realm roles" auswählen
                Checkbox "admin" anklicken
                Button <Assign> anklicken
        Drop-Down-Menü in der rechten oberen Ecke
            "Sign-Out" anklicken

    Einloggen
        Username    admin
        Password    p

    Menüpunkt "Manage realms" anklicken
        Button <Create realm> anklicken
            Realm name      nest
            <Create> anklicken

    Menüpunkt "Clients"
        <Create client> anklicken
        Client ID   nest-client
        Name        Nest Client
        <Next> anklicken
            "Capability config"
                Client authentication       On
                Authorization               Off
                Authentication Flow         Standard flow                   Haken setzen
                                            Direct access grants            Haken setzen
        <Next> anklicken
            Root URL                https://localhost:3000
            Valid redirect URIs     *
            Web origins             +
        <Save> anklicken

        nest-client
            Tab "Roles"
                <Create Role> anklicken
                Role name       admin
                <Save> anklicken
            Breadcrumb "Client details" anklicken
            Tab "Roles"
                <Create Role> anklicken
                Role name       user
                <Save> anklicken

    # https://www.keycloak.org/docs/latest/server_admin/index.html#assigning-permissions-using-roles-and-groups
    Menüpunkt "Users"
        <Add user> anklicken
            Required User Actions:      Überprüfen, dass nichts ausgewählt ist
            Username                    admin
            Email                       admin@acme.com
            First name                  Nest
            Last name                   Admin
            <Create> anklicken
            Tab "Credentials"
                <Set password> anklicken
                    "p" eingeben und wiederholen
                    "Temporary" auf "Off" setzen
                    <Save> anklicken
                    <Save password> anklicken
            Tab "Role Mapping"
                <Assign Role> anklicken
                    "Filter by clients" auswählen
                        "nest-client admin"     Haken setzen     (ggf. blättern)
                        <Assign> anklicken
            Tab "Details"
                Required user actions       Überprüfen, dass nichts ausgewählt ist
                <Save> anklicken
        <Add user> anklicken
            Required User Actions:      Überprüfen, dass nichts ausgewählt ist
            Username                    user
            Email                       user@acme.com
            First name                  Nest
            Last name                   User
            <Create> anklicken
            Tab "Credentials"
                <Set password> anklicken
                    "p" eingeben und wiederholen
                    "Temporary" auf "Off" setzen
                    <Save> anklicken
                    <Save password> anklicken
            Tab "Role Mapping"
                <Assign Role> anklicken
                    "Filter by clients" auswählen
                        "nest-client user"     Haken setzen     (ggf. blättern)
                        <Assign> anklicken
            Tab "Details"
                Required user actions       Überprüfen, dass nichts ausgewählt ist
                <Save> anklicken
        Breadcrumb "Users" anklicken
            WICHTIG: "admin" und "user" mit der jeweiligen Emailadresse sind aufgelistet

    Menüpunkt "Realm settings"
        Tab "Sessions"
            # Refresh Token: siehe https://stackoverflow.com/questions/52040265/how-to-specify-refresh-tokens-lifespan-in-keycloak
            SSO Session Idle                                1 Hours
            <Save> anklicken
        Tab "Tokens"
            Access Tokens
                Access Token Lifespan                       30 Minutes
                Access Token Lifespan For Implicit Flow     30 Minutes
                <Save> anklicken
```

Mit der URL `https://localhost:8843/realms/nest/.well-known/openid-configuration`
kann man in einem Webbrowser die Konfiguration als JSON-Datensatz erhalten.

## Client Secret

Im Wurzelverzeichnis des Projekts in der Datei `.env` muss man die
Umgebungsvariable `CLIENT_SECRET` auf folgenden Wert aus _Keycloak_ setzen
und ebenso in `.extras\compose\buch\.env`:

- Menüpunkt `Clients`
- `nest-client` aus der Liste beim voreingestellten Tab `Clients list` auswählen
- Tab `Credentials` anklicken
- Die Zeichenkette beim Label `Client Secret` kopieren und in der Datei `.env`
  bei der Umgebungsvariablen `CLIENT_SECRET` als Wert eintragen.

Diese Zeichenkette muss man auch in Postman als Wert für die dortige
Umgebungsvariable `client_secret` eintragen.

## Inspektion der H2-Datenbank

Im Development-Modus verwaltet Keycloak seine Daten in einer H2-Datenbank. Um
die _H2 Console_ als DB-Browser zu starten, lädt man zunächst die JAR-Datei
von `https://repo.maven.apache.org/maven2/com/h2database/h2/2.3.230/h2-2.3.230.jar`.
herunter und speichert sie z.B. im Verzeichnis `.extras\compose\keycloak`.

Mit dem Kommando `java -jar h2-2.3.230.jar` startet man nun die H2 Console, wobei
ein Webbrowser gestartet wird. Dort gibt man folgende Werte ein:

- JDBC URL: `jdbc:h2:tcp://localhost/C:/Zimmermann/volumes/keycloak/h2/keycloakdb`
- Benutzername: ``
- Passwort: ``

Danach kann man z.B. die Tabellen `USER_ENTITY` und `USER_ROLE_MAPPING` inspizieren.

**VORSICHT: AUF KEINEN FALL IRGENDEINE TABELLE EDITIEREN, WEIL MAN SONST
KEYCLOAK NEU AUFSETZEN MUSS!**
