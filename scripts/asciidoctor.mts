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

import { Registry, convert, getVersion } from '@asciidoctor/core';
import { join } from 'node:path';
// https://github.com/eshepelyuk/asciidoctor-plantuml.js ist deprecated
import kroki from 'asciidoctor-kroki';
import url from 'node:url';

console.log(`Asciidoctor.js ${getVersion()}`);

kroki.register(new Registry());

const options = {
    safe: 'safe',
    attributes: { linkcss: true },
    base_dir: 'extras/doc',
    to_dir: 'html',
    mkdirs: true,
};
convert(join('extras', 'doc', 'projekthandbuch.adoc'), options);

const basedir = url.fileURLToPath(new URL('.', import.meta.url));
console.log(`HTML-Datei ${join(basedir, '..', 'extras', 'doc', 'html', 'projekthandbuch.html')}`);

// https://asciidoctor.github.io/asciidoctor.js/master
// const htmlString = asciidoctor.convert(
//     fs.readFileSync(join('extras', 'doc', 'projekthandbuch.adoc')),
//     { safe: 'safe', attributes: { linkcss: true }, base_dir: 'doc' },
// );
// const htmlFile = join('extras', 'doc', 'projekthandbuch.html');
// fs.writeFileSync(htmlFile, htmlString);

// console.log(`HTML-Datei ${join(__dirname, '..', htmlFile)}`);
