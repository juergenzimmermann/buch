// Copyright (C) 2025 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import process from 'node:process';
import { defineConfig } from 'vitest/config';

if (process.env['NODE_TLS_REJECT_UNAUTHORIZED'] !== '0') {
    console.error();
    console.error(
        '>>> ABBRUCH: Umgebungsvariable NODE_TLS_REJECT_UNAUTHORIZED nicht auf "0" gesetzt <<<',
    );
    console.error();
    process.exit(-1);
}

// https://vitest.dev/config
export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    // https://vitest.dev/config/name.html
                    name: 'unit',

                    // https://vitest.dev/config/include.html
                    include: ['src/*/service/*.test.mts'],

                    // https://vitest.dev/config/bail.html
                    bail: 1,

                    // https://vitest.dev/config/testtimeout.html
                    testTimeout: 1_000,

                    // https://vitest.dev/config/globals.html
                    // globals: false,

                    // https://vitest.dev/config/environment.html
                    // environment: 'node',

                    // https://vitest.dev/config/maxconcurrency.html
                    // maxConcurrency: 5,
                },
            },
            {
                test: {
                    name: 'integration',
                    include: [
                        'test/integration/*.test.mts',
                        'test/integration/*/*.test.mts',
                    ],

                    // https://vitest.dev/config/globalsetup.html
                    globalSetup: './test/integration/setup.global.mts',

                    testTimeout: 2_000,
                },
            },
        ],

        // https://vitest.dev/config/ui.html
        ui: true,
        // IPv4 mit Port 3001 statt 51204
        // https://vitest.dev/config/api.html
        // Kommando "netsh interface ipv4 show excludedportrange protocol=tcp"
        // -> u.a. WSL2, Docker Desktop, Windows Netzwerk-Stack
        api: 3001,

        // https://vitest.dev/config/bail.html
        bail: 1,
        // https://vitest.dev/config/slowtestthreshold.html
        // slowTestThreshold: 300,
    },
});
