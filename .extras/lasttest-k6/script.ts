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

// Aufruf:   k6 run script.ts
//           durch "esbuild" werden Typen eliminiert, keine Typprüfung
//           http://localhost:5665

// BEACHTE:
// k6 ist weder Node noch ein Webbrowser, d.h. keine Unterstützung für
// z.B. die Node-Module "os" oder "fs" oder das "window"-Objekt

import http, { RefinedResponseBody, type ResponseType } from 'k6/http';
import { check, sleep } from 'k6';
import { type Options } from 'k6/options';

const baseUrl = 'https://localhost:3000';
const restUrl = `${baseUrl}/rest`;
const graphqlUrl = `${baseUrl}/graphql`;
const tokenUrl = `${baseUrl}/auth/token`;
const dbPopulateUrl = `${baseUrl}/dev/db_populate`;

const ids = [1, 20, 30, 40, 50, 60, 70, 80, 90];
const titelNichtVorhanden = ['qqq', 'xxx', 'yyy', 'zzz'];
const titelArray = ['a', 'l', 't', 'i', 'p'];
const isbns = [
    '978-3-897-22583-1',
    '978-3-827-31552-6',
    '978-0-201-63361-0',
    '978-0-007-09732-6',
    '978-3-824-40481-0',
    '978-3-540-43081-0',
]
const schlagwoerter = ['javascript', 'typescript', 'java', 'python'];

let token: string;
const tlsDir = '../../src/config/resources/tls';
const cert = open(`${tlsDir}/certificate.crt`);
const key = open(`${tlsDir}/key.pem`);

// https://grafana.com/docs/k6/latest/using-k6/test-lifecycle
export function setup() {
    let headers: { [name: string]: string } = { 'Content-Type': 'application/x-www-form-urlencoded' };
    const body = 'username=admin&password=p';
    let response = http.post(tokenUrl, body, { headers });
    token = JSON.parse(response.body as string).access_token;
    console.log(`token=${token}`);

    headers = { Authorization: `Bearer ${token}` };
    response = http.post(dbPopulateUrl, undefined, { headers });
    if (response.status === 200) {
        console.log('DB neu geladen');
    }
}

export const options: Options = {
    batchPerHost: 50,
    // httpDebug: 'headers',

    scenarios: {
        get_id: {
            executor: 'ramping-vus', // "Ramp up" zu Beginn und "Ramp down" am Ende des Testintervalls
            // executor: 'constant-arrival-rate', // Fixe Anzahl von Requests waehrend des Testintervalls
            startVUs: 0, // "virtual user": simulierte, konkurierende User
            stages: [
                { duration: '5s', target: 5 }, // "traffic ramp-up": von 0 auf 15 User in 5 Sek
                { duration: '20s', target: 5 }, // 15 User für 20 Sek
                { duration: '5s', target: 0 }, // "ramp-down" auf 0 User
            ],
            exec: 'getById',
        },
        get_titel: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '5s', target: 20 },
                { duration: '20s', target: 20 },
                { duration: '5s', target: 0 },
            ],
            exec: 'getByTitel',
        },
        get_isbn: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '5s', target: 10 },
                { duration: '20s', target: 10 },
                { duration: '5s', target: 0 },
            ],
            exec: 'getByISBN',
        },
        get_schlagwort: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '5s', target: 15 },
                { duration: '20s', target: 15 },
                { duration: '5s', target: 0 },
            ],
            exec: 'getBySchlagwort',
        },
        query_buch: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '5s', target: 3 },
                { duration: '20s', target: 3 },
                { duration: '5s', target: 0 },
            ],
            exec: 'queryBuch',
        },
        query_buecher: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '5s', target: 5 },
                { duration: '20s', target: 5 },
                { duration: '5s', target: 0 },
            ],
            exec: 'queryBuecher',
        },
        query_buecher_nicht_vorhanden: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '5s', target: 2 },
                { duration: '20s', target: 2 },
                { duration: '5s', target: 2 },
            ],
            exec: 'queryBuecherNichtVorhanden',
        },

        // Scenarios mit 404 NOT_FOUND -> http_req_failed
        // https://community.grafana.com/t/http-req-failed-reporting-passes-as-failures/94807/3
        get_titel_nicht_vorhanden: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '5s', target: 3 },
                { duration: '20s', target: 3 },
                { duration: '5s', target: 0 },
            ],
            exec: 'getByTitelNichtVorhanden',
        },
    },

    // https://grafana.com/docs/k6/latest/using-k6/protocols/ssl-tls/ssl-tls-client-certificates
    tlsAuth: [
        {
            cert,
            key,
        },
    ],
    tlsVersion: http.TLS_1_3, // DevSkim: ignore DS440000
    insecureSkipTLSVerify: true,
};

// HTTP-Requests mit Ueberpruefungen

// GET /rest/<id>
export function getById() {
    // https://stackoverflow.com/questions/4550505/getting-a-random-value-from-a-javascript-array
    const id = ids[Math.floor(Math.random() * ids.length)]; // zwischen 0 und 1
    const res = http.get(`${restUrl}/${id}`);

    check(res, {
        'GET id: OK': (r) => r.status === 200,
        'GET id: application/json': (r) => r.headers['Content-Type'].startsWith('application/json'),
    });
    sleep(1);
}

// GET /rest?title=<value>
export function getByTitel() {
    const titel = titelArray[Math.floor(Math.random() * titelArray.length)];
    const res = http.get(`${restUrl}?titel=${titel}`);

    check(res, {
        'GET titel: OK': (r) => r.status === 200,
        'GET titel: application/json': (r) => r.headers['Content-Type'].startsWith('application/json'),
     });
    sleep(1);
}

// 404 GET /rest?title=<value>
// Statuscodes mit 4xx und 5xx fuehren zu http_req_failed
// https://grafana.com/docs/k6/latest/using-k6/metrics/create-custom-metrics
// https://grafana.com/docs/k6/latest/javascript-api/k6-metrics/counter
export function getByTitelNichtVorhanden() {
    const titel = titelNichtVorhanden[Math.floor(Math.random() * titelNichtVorhanden.length)];
    const res = http.get(`${restUrl}?titel=${titel}`);

    check(res, { 'GET titel: NOT_FOUND': (r) => r.status === 404 });
    sleep(1);
}

// GET /rest?isbn=<value>
export function getByISBN() {
    const isbn = isbns[Math.floor(Math.random() * isbns.length)];
    const res = http.get(`${restUrl}?isbn=${isbn}`);

    check(res, {
        'GET isbn: OK': (r) => r.status === 200,
        'GET isbn: application/json': (r) => r.headers['Content-Type'].startsWith('application/json'),
     });
    sleep(1);
}

// GET /rest?<schlagwort>=true
export function getBySchlagwort() {
    const schlagwort = schlagwoerter[Math.floor(Math.random() * schlagwoerter.length)];
    const res = http.get(`${restUrl}?${schlagwort}=true`);

    check(res, {
        'GET schlagwort: OK': (r) => r.status === 200,
        'GET schlagwort: application/json': (r) => r.headers['Content-Type'].startsWith('application/json'),
     });
    sleep(1);
}

// POST /graphql query "buch"
export function queryBuch() {
    const id = ids[Math.floor(Math.random() * ids.length)];
    const body = {
        query: `
            {
                buch(id: "${id}") {
                    version
                    isbn
                    rating
                    art
                    preis
                    lieferbar
                    datum
                    homepage
                    schlagwoerter
                    titel {
                        titel
                    }
                    rabatt(short: true)
                }
            }
        `,
    };
    const headers = { 'Content-Type': 'application/json' };

    const res = http.post(graphqlUrl, JSON.stringify(body), { headers });

    check(res, {
        'Query "buch": OK': (r) => r.status === 200,
        'Query "buch": application/json': (r) => r.headers['Content-Type'].startsWith('application/json'),
     });
    sleep(1);
}

// POST /graphql query "buecher"
export function queryBuecher() {
    const titel = titelArray[Math.floor(Math.random() * titelArray.length)];
    const body = {
        query: `
            {
                buecher(suchkriterien: {
                    titel: "${titel}"
                }) {
                    art
                    schlagwoerter
                    titel {
                        titel
                    }
                }
            }
        `,
    };
    const headers = { 'Content-Type': 'application/json' };

    const res = http.post(graphqlUrl, JSON.stringify(body), { headers });

    check(res, {
        'Query "buecher": OK': (r) => r.status === 200,
        'Query "buecher": application/json': (r) => r.headers['Content-Type'].startsWith('application/json'),
     });
    sleep(1);
}

// POST /graphql query "buecher" nicht gefunden
export function queryBuecherNichtVorhanden() {
    const body = {
        query: `
            {
                buecher(suchkriterien: {
                    titel: "NICHT_VORHANDEN"
                }) {
                    schlagwoerter
                }
            }
        `,
    };
    const headers = { 'Content-Type': 'application/json' };

    const res = http.post(graphqlUrl, JSON.stringify(body), { headers });

    check(res, { 'Query "buecher (nicht vorhanden)": OK': (r) => r.status === 200 });
    sleep(1);
}
