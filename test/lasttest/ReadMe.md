# Hinweise zu Lasttests mit k6

[Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)

## k6 vs. Node und Webbrowser

_k6_ ist weder _Node_ noch ein _Webbrowser_, d.h. es gibt keine Unterstützung
für z.B.

- die Node-Module `os` oder `fs`
- das `window`-Objekt

## http_req_failed als Fehlerresultat

`http_req_failed` bezieht sich auf Statuscodes zwischen 4xx und 5xx. Details
siehe https://github.com/grafana/k6-learn/blob/main/Modules/II-k6-Foundations/03-Understanding-k6-results.md#error-rate.

## Start des zu testenden Applikationsservers

Der zu testende Applikationsserver einschließlich der Backend-Systeme muss
gestartet, z.B. als Docker Container:

```shell
    # Windows
    cd .extras\compose\buch

    # macOS:
    cd .extras/compose/buch

    docker compose up
```

## expect aus k6-jslib-testing

Um in den einzelnen Test-Funktionen die Funktion `expect` für Assertions zu nutzen,
wird sie von `https://github.com/grafana/k6-jslib-testing` in der Script-Datei
`script.ts` importiert.

## TypeScript durch esbuild

Das Skript für den Lasttest ist in der TypeScript-Datei `script.ts` implementiert.
Zur Laufzeit des Lasttests wird _esbuild_ von _k6_ genutzt, um die
TypeScript-Typen zu eliminieren ("Type Stripping"). Es findet also keine
Typprüfung statt. Details siehe https://esbuild.github.io/content-types/#typescript.

## Aufruf von k6

Um die Ergebnisse eines Lasttests durch zeitintensive Logausgaben in der
Konsole nicht zu verfälschen, sollten in der Datei `.extras\compose\buch\app.toml`
die Optionen `log.level` und  `log.pretty` auskommentiert werden. Außerdem ist
zu beachten, dass die Scenarios, bei denen bewusst der Statuscode 404 bzw.
NOT_FOUND erwartet wird, zu `http_req_failed` zugeordnet werden.

```shell
    # Windows
    cd test\lasttest

    # macOS:
    cd test/lasttest

    k6 run script.ts
```

## Visualisierung des Lasttests

Während der Lasttest läuft, kann in einem Webbrowser mit der URL `http://localhost:5665`
der Ablauf verfolgt werden.
