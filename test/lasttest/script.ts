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

// BEACHTE:
// http_req_failed bezieht sich auf Statuscodes zwischen 4xx und 5xx
// https://github.com/grafana/k6-learn/blob/main/Modules/II-k6-Foundations/03-Understanding-k6-results.md#error-rate

import http from 'k6/http';
import { check, sleep } from 'k6';
import { type Options } from 'k6/options';
import { BuchDTO } from '../../src/buch/controller/buchDTO.ts';
import { generateISBN } from './isbn_generate.ts';

const baseUrl = 'https://localhost:3000';
const restUrl = `${baseUrl}/rest`;
const graphqlUrl = `${baseUrl}/graphql`;
const tokenUrl = `${baseUrl}/auth/token`;
const dbPopulateUrl = `${baseUrl}/dev/db_populate`;

const ids = [1, 20, 30, 40, 50, 60, 70, 80, 90];
const titelArray = ['a', 'l', 't', 'i', 'p'];
const titelNichtVorhanden = ['qqq', 'xxx', 'yyy', 'zzz'];
const isbns = [
    '978-3-897-22583-1',
    '978-3-827-31552-6',
    '978-0-201-63361-0',
    '978-0-007-09732-6',
    '978-3-824-40481-0',
    '978-3-540-43081-0',
];
const schlagwoerter = ['javascript', 'typescript', 'java', 'python'];
const neuesBuch: Omit<BuchDTO, 'preis' | 'rabatt'> & {
    preis: number;
    rabatt: number;
} = {
    isbn: 'TBD',
    rating: 1,
    art: 'HARDCOVER',
    preis: 111.11,
    rabatt: 0.011,
    lieferbar: true,
    datum: '2025-02-28',
    homepage: 'https://post.rest',
    schlagwoerter: [],
    titel: {
        titel: 'Titelk6',
        untertitel: 'untertitelk6',
    },
    abbildungen: [
        {
            beschriftung: 'Abb. 1: k6',
            contentType: 'img/png',
        },
    ],
};

const tlsDir = '../../src/config/resources/tls';
const cert = open(`${tlsDir}/certificate.crt`);
const key = open(`${tlsDir}/key.pem`);

// https://grafana.com/docs/k6/latest/using-k6/test-lifecycle
export function setup() {
    const tokenHeaders: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    const body = 'username=admin&password=p';
    const tokenResponse = http.post<'text'>(tokenUrl, body, {
        headers: tokenHeaders,
    });
    let token: string;
    if (tokenResponse.status === 200) {
        token = JSON.parse(tokenResponse.body).access_token;
        console.log(`token=${token}`);
    } else {
        throw new Error(
            `setup fuer adminToken: status=${tokenResponse.status}, body=${tokenResponse.body}`,
        );
    }

    const headers = { Authorization: `Bearer ${token}` };
    const res = http.post(dbPopulateUrl, undefined, { headers });
    if (res.status === 200) {
        console.log('DB neu geladen');
    } else {
        throw new Error(
            `setup fuer db_populate: status=${res.status}, body=${res.body}`,
        );
    }
}

const rampUpDuration = '5s';
const steadyDuration = '22s';
const rampDownDuration = '3s';

export const options: Options = {
    batchPerHost: 50,
    // httpDebug: 'headers',

    scenarios: {
        get_id: {
            exec: 'getById',
            executor: 'ramping-vus', // "Ramp up" zu Beginn und "Ramp down" am Ende des Testintervalls
            stages: [
                { target: 2, duration: rampUpDuration }, // "traffic ramp-up": schrittweise von 0 auf 2 User in 5 Sek
                { target: 2, duration: steadyDuration }, // 2 User fuer den eigentlichen Lasttest
                { target: 0, duration: rampDownDuration }, // "ramp-down": schrittweise auf 0 User
            ],
        },
        get_id_not_modified: {
            exec: 'getByIdNotModified',
            executor: 'ramping-vus', // "Ramp up" zu Beginn und "Ramp down" am Ende des Testintervalls
            stages: [
                { target: 5, duration: rampUpDuration },
                { target: 5, duration: steadyDuration },
                { target: 0, duration: rampDownDuration },
            ],
        },
        get_titel: {
            exec: 'getByTitel',
            executor: 'ramping-vus',
            stages: [
                { target: 20, duration: rampUpDuration },
                { target: 20, duration: '22s' },
                { target: 0, duration: rampDownDuration },
            ],
        },
        get_isbn: {
            exec: 'getByISBN',
            executor: 'ramping-vus',
            stages: [
                { target: 10, duration: rampUpDuration },
                { target: 10, duration: '22s' },
                { target: 0, duration: rampDownDuration },
            ],
        },
        get_schlagwort: {
            exec: 'getBySchlagwort',
            executor: 'ramping-vus',
            stages: [
                { target: 15, duration: rampUpDuration },
                { target: 15, duration: '22s' },
                { target: 0, duration: rampDownDuration },
            ],
        },
        post_buch: {
            exec: 'postBuch',
            executor: 'ramping-vus',
            stages: [
                { target: 3, duration: rampUpDuration },
                { target: 3, duration: '22s' },
                { target: 0, duration: rampDownDuration },
            ],
        },
        query_buch: {
            exec: 'queryBuch',
            executor: 'ramping-vus',
            stages: [
                { target: 3, duration: rampUpDuration },
                { target: 3, duration: '22s' },
                { target: 0, duration: rampDownDuration },
            ],
        },
        query_buecher: {
            exec: 'queryBuecher',
            executor: 'ramping-vus',
            stages: [
                { target: 5, duration: rampUpDuration },
                { target: 5, duration: '22s' },
                { target: 0, duration: rampDownDuration },
            ],
        },
        query_buecher_nicht_vorhanden: {
            exec: 'queryBuecherNichtVorhanden',
            executor: 'ramping-vus',
            stages: [
                { target: 2, duration: rampUpDuration },
                { target: 2, duration: '22s' },
                { target: 0, duration: rampDownDuration },
            ],
        },

        // Scenarios mit 404 NOT_FOUND -> http_req_failed
        // https://community.grafana.com/t/http-req-failed-reporting-passes-as-failures/94807/3
        get_titel_nicht_vorhanden: {
            exec: 'getByTitelNichtVorhanden',
            executor: 'ramping-vus',
            stages: [
                { target: 3, duration: rampUpDuration },
                { target: 3, duration: '22s' },
                { target: 0, duration: rampDownDuration },
            ],
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
    // alternativ: https://jslib.k6.io und https://grafana.com/docs/k6/latest/javascript-api/jslib/utils
    const id = ids[Math.floor(Math.random() * ids.length)]; // zwischen 0 und 1
    const res = http.get(`${restUrl}/${id}`);

    check(res, {
        'GET id: OK': (r) => r.status === 200,
        'GET id: application/json': (r) =>
            r.headers['Content-Type'].startsWith('application/json'),
    });
    sleep(1); // Denkzeit simulieren
}

// GET /rest/<id> mit If-None-Match
export function getByIdNotModified() {
    // https://stackoverflow.com/questions/4550505/getting-a-random-value-from-a-javascript-array
    const id = ids[Math.floor(Math.random() * ids.length)]; // zwischen 0 und 1
    const headers: Record<string, string> = {
        'If-None-Match': '"0"',
    };
    const res = http.get(`${restUrl}/${id}`, { headers });

    check(res, {
        'GET id: NOT_MODIFIED': (r) => r.status === 304,
    });
    sleep(1);
}

// GET /rest?title=<value>
export function getByTitel() {
    const titel = titelArray[Math.floor(Math.random() * titelArray.length)];
    const res = http.get(`${restUrl}?titel=${titel}`);

    check(res, {
        'GET titel: OK': (r) => r.status === 200,
        'GET titel: application/json': (r) =>
            r.headers['Content-Type'].startsWith('application/json'),
    });
    sleep(1);
}

// 404 GET /rest?title=<value>
// Statuscodes mit 4xx und 5xx fuehren zu http_req_failed
// https://grafana.com/docs/k6/latest/using-k6/metrics/create-custom-metrics
// https://grafana.com/docs/k6/latest/javascript-api/k6-metrics/counter
export function getByTitelNichtVorhanden() {
    const titel =
        titelNichtVorhanden[
            Math.floor(Math.random() * titelNichtVorhanden.length)
        ];
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
        'GET isbn: application/json': (r) =>
            r.headers['Content-Type'].startsWith('application/json'),
    });
    sleep(1);
}

// GET /rest?<schlagwort>=true
export function getBySchlagwort() {
    const schlagwort =
        schlagwoerter[Math.floor(Math.random() * schlagwoerter.length)];
    const res = http.get(`${restUrl}?${schlagwort}=true`);

    check(res, {
        'GET schlagwort: OK': (r) => r.status === 200,
        'GET schlagwort: application/json': (r) =>
            r.headers['Content-Type'].startsWith('application/json'),
    });
    sleep(1);
}

// POST /rest
export function postBuch() {
    const schlagwort =
        schlagwoerter[Math.floor(Math.random() * schlagwoerter.length)];
    const buch = { ...neuesBuch };
    buch.isbn = generateISBN();
    buch.schlagwoerter = [schlagwort.toUpperCase()];

    const tokenHeaders: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    const body = 'username=admin&password=p';
    const tokenResponse = http.post<'text'>(tokenUrl, body, {
        headers: tokenHeaders,
    });
    check(tokenResponse, { 'POST /auth/token: OK': (r) => r.status === 200 });
    const token = JSON.parse(tokenResponse.body).access_token;

    const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    const res = http.post(restUrl, JSON.stringify(buch), { headers });
    check(res, {
        'POST "buch": Created': (r) => r.status === 201,
        // 'POST "buch": location': (r) => r.headers.location.startsWith(restUrl),
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
        'Query "buch": application/json': (r) =>
            r.headers['Content-Type'].startsWith('application/json'),
    });
    sleep(1);
}

// POST /graphql query "buecher"
export function queryBuecher() {
    const titel = titelArray[Math.floor(Math.random() * titelArray.length)];
    const body = {
        query: `
            {
                buecher(suchparameter: {
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
        'Query "buecher": application/json': (r) =>
            r.headers['Content-Type'].startsWith('application/json'),
    });
    sleep(1);
}

// POST /graphql query "buecher" nicht gefunden
export function queryBuecherNichtVorhanden() {
    const body = {
        query: `
            {
                buecher(suchparameter: {
                    titel: "NICHT_VORHANDEN"
                }) {
                    schlagwoerter
                }
            }
        `,
    };
    const headers = { 'Content-Type': 'application/json' };

    const res = http.post(graphqlUrl, JSON.stringify(body), { headers });

    check(res, {
        'Query "buecher (nicht vorhanden)": OK': (r) => r.status === 200,
    });
    sleep(1);
}
