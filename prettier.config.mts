// Copyright (C) 2018 - current Juergen Zimmermann, Florian Rusch
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

// https://prettier.io/docs/configuration

import { type Config } from 'prettier';

const config: Config = {
    // https://prettier.io/blog/2025/06/23/3.6.0#javascript
    // OXC = A fast JavaScript and TypeScript parser in Rust https://oxc.rs
    plugins: ['@prettier/plugin-oxc'],

    // https://github.com/prettier/prettier/issues/4102
    // https://github.com/prettier/prettier/pull/7466
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    overrides: [
        {
            files: ['*.ts', '*.mts', '*.js', '*.mjs', '*.cjs'],
            options: {
                tabWidth: 4,
            },
        },
        {
            files: ['*.yml', '*.yaml'],
            options: {
                singleQuote: false,
            },
        },
    ],
};

export default config;
