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

// https://www.prisma.io/blog/testing-series-2-xPhjjmIEsM

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        name: 'Unit',
        // default ist ['**\/*.{test,spec}.?(c|m)[jt]s?(x)']
        include: ['test/unit/**/*.test.mts'],
        globals: true,
        environment: 'node',
        testTimeout: 10_000,
        setupFiles: 'vitest.setup.ts',
        // https://vitest.dev/guide/coverage
        // https://vitest.dev/config/#coverage
        coverage: {
            include: ['src/buch/service/*'],
            // default ist ['text', 'html', 'clover', 'json']
            reporter: ['text', 'html'],
            // default ist 'v8'
            // provider: 'istanbul',
        },
    },
});
