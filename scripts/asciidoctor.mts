#!/usr/bin/env node
// Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Aufruf:   node scripts/asciidoctor.mts

// https://github.com/asciidoctor/asciidoctor.js
// https://asciidoctor-docs.netlify.com
// https://asciidoctor.org

import { Extensions, convertFile, getVersion } from '@asciidoctor/core';
import { join } from 'node:path';
// https://github.com/eshepelyuk/asciidoctor-plantuml.js ist deprecated
import { register } from 'asciidoctor-kroki';
import url from 'node:url';

console.log(`Asciidoctor.js ${getVersion()}`);

const registry = Extensions.create();
register(registry);

const options = {
    safe: 'safe',
    attributes: { linkcss: true },
    base_dir: 'extras/doc',
    to_dir: 'html',
    mkdirs: true,
    extension_registry: registry,
};
await convertFile(join('extras', 'doc', 'projekthandbuch.adoc'), options);

const basedir = url.fileURLToPath(new URL('.', import.meta.url));
console.log(`HTML-Datei ${join(basedir, '..', 'extras', 'doc', 'html', 'projekthandbuch.html')}`);
