// Copyright (C) 2026 - current Juergen Zimmermann
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
// along with this program. If not, see <https://www.gnu.org/licenses/>.

// https://oxc.rs/docs/guide/usage/formatter/config.html
// https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html

import { defineConfig } from 'oxfmt';

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
    singleQuote: true,
    trailingComma: 'all',
    overrides: [
        {
            files: ['*.toml', '*.yml', '*.yaml'],
            options: {
                singleQuote: false,
            },
        },
    ],
    ignorePatterns: [
        '*.md',
        'src/config/resources/postgresql/*.sql',
        'src/config/resources/tls/*.crt',
        'src/config/resources/tls/*.pem',
    ],

    // von .editorconfig übernommen:
    // end_of_line -> endOfLine
    // indent_style -> useTabs
    // indent_size -> tabWidth
    // max_line_length -> printWidth
    // insert_final_newline -> insertFinalNewline

    // default:
    // sortPackageJson: true,
    // printWidth: 100,
});
