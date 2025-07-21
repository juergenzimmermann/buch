# Hinweise zur Installation und Konfiguration von PostgreSQL

[Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)

## Installation ohne TLS

In der Datei `.extras\compose\postgres\compose.yml` muss man folgende Zeilen
auskommentieren:

- Die Zeile mit dem Schlüssel `command:` und die nachfolgenden Listenelemente
  mit führendem `-`, damit der PostgreSQL-Server zunächst ohne TLS gestartet wird.
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
    docker compose up db
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

- In der Zeile mit dem Schlüssel `command:` und den nachfolgenden Listenelementen
  mit führendem `-`, damit der PostgreSQL-Server mit TLS gestartet wird.
- Bei den Zeilen mit den Listenelementen unterhalb vom Schlüssel `volumes:`
  jeweils bei Zeilen mit dem Schlüssel `read_only:`, weil inzwischen die Zugriffsrechte
  gesetzt bzw. eingeschränkt sind:
  - bei `key.pem` und
  - bei `certificate.crt`
- Bei der Zeile mit dem Schlüssel `user:`, damit der PostgreSQL-Server als normaler
  Linux-User `postgres` gestartet wird.

Außerdem muss man in derselben Datei `.extras\compose\postgres\compose.yml` die
Zeile mit `cap_add: [...]` wieder auskommentieren.

### Datenbank, Datenbank-User und Schema anlegen

In der 1. PowerShell startet man wieder den DB-Server als Docker Container, und
zwar jetzt mit TLS:

```powershell
    docker compose up db
```

In der 2. PowerShell werden die beiden SQL-Skripte ausgeführt, um zunächst eine
neue DB `buch` mit dem DB-User `buch`anzulegen. Mit dem 2. Skript wird das
Schema `buch` mit dem DB-User `buch` als _Owner_ angelegt:

```powershell
   docker compose exec db bash
      psql --dbname=postgres --username=postgres --file=/sql/create-db-buch.sql
      psql --dbname=buch --username=buch --file=/sql/create-schema-buch.sql
      exit
    docker compose down
```

Die beiden SQL-Skripte liegen z.B. im Windows-Verzeichnis `C:\Zimmermann\volumes\postgres\sql`
und sind durch _Volume Mount_ in `compose.yml` im PostgreSQL-Server als Linux-Verzeichnis
`/sql` verfügbar. Kopien der beiden SQL-Skripte sind im Projekt-Verzeichnis `.extras\db\postgres`.
Eventuelle Änderungen müssen auf jeden Fall in `C:\Zimmermann\volumes\postgres\sql`
gemacht werden.

### TLS für den PostgreSQL-Server mit OpenSSL überprüfen

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
