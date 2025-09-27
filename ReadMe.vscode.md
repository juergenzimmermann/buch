# Hinweise zu VS Code

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

> Mit Chrome und der Erweiterung _Markdown Viewer_ https://chromewebstore.google.com/detail/markdown-viewer/ckkdlimhmcjmikdlpkmbgfkaikojcbjk?hl=de&pli=1
> kann man Markdown-Dateien mit der Endung `.md` schön lesen.
> Für diese Erweiterung muss man die Option _Zugriff auf Datei-URLs zulassen_
> aktivieren.

## Installation

Visual Studio Code kann man von https://code.visualstudio.com/Download herunterladen.
Natürlich kann auch WebStorm, IntelliJ IDEA, Visual Studio oder ... benutzt werden.

## Erweiterungen

Die folgenden _Erweiterungen_ (Menüpunkt am linken Rand) sind empfehlenswert.
Bei _PostgreSQL_ empfiehlt sich die Erweiterung von _Microsoft_.

- Apollo GraphQL
- AsciiDoc
- Better Comments
- Docker
- DotENV
- EditorConfig for VS Code
- Error Lens
- ESLint
- German Language Pack for Visual Studio Code
- GitLens
- Git Graph
- Git History
- GraphQL: Language Feature Support
- JavaScript and TypeScript Nightly
- MarkdownLint
- Material Icon Theme
- PlantUML
- PostgreSQL
- Postman
- Prettier - Code formatter
- Pretty TypeScript Errors
- Rainbow CSV
- Todo Tree
- TypeScript Importer
- Version Lens
- Vitest
- YAML

Dazu ein KI-Werkzeug für _Code Completion_, _Chat_, evtl. _Agent Mode_. Beispiele:

- GitHub Copilot (siehe https://code.visualstudio.com/docs/copilot/setup und
  https://code.visualstudio.com/docs/copilot/getting-started)
- IntelliCode (siehe https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode)
- ChatGPT - EasyCode
- Tabnine AI Autocomplete

### Einstellungen

Man öffnet die Einstellungen über das Icon am linken Rand ganz unten und wählt den
Menüpunkt `Einstellungen` oder `Settings`. Danach im Suchfeld folgendes eingeben
und jeweils den Haken setzen:

- editor.foldingImportsByDefault
- eslint.enable
- typescript.inlayHints.variableTypes.enabled
- typescript.inlayHints.propertyDeclarationTypes.enabled
- typescript.inlayHints.parameterTypes.enabled
- typescript.inlayHints.functionLikeReturnTypes.enabled
