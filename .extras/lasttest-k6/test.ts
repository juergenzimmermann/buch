// Copyright (C) 2024 - present Juergen Zimmermann, Hochschule Karlsruhe
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

// Aufruf:   k6 run test.ts
//           durch "esbuild" werden Typen eliminiert, keine Typprüfung

// set $env:K6_WEB_DASHBOARD=true
// ggf. set $env:K6_WEB_DASHBOARD_PERIOD=10s
// http://localhost:5665

import http from 'k6/http';
import { check, sleep } from 'k6';
import { type Options } from 'k6/options';

// https://grafana.com/docs/k6/latest/using-k6/test-lifecycle
export function setup() {
    console.log('setup');
}

export const options: Options = {
    vus: 10,
    duration: '30s',

    // stages: [
    //     { duration: '30s', target: 10 }, // traffic ramp-up from 1 to 100 users over 5 minutes.
    //     { duration: '2m', target: 10 }, // stay at 100 users for 30 minutes
    //     { duration: '15s', target: 0 }, // ramp-down to 0 users
    // ],
  };

// HTTP-Requests mit Ueberpruefungen
export default function () {
    const res = http.get('https://localhost:3000/rest/1');

    check(res, { 'success read': (r) => r.status === 200 });

    sleep(0.3);
}
