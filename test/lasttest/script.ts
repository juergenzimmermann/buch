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

import http from 'k6/http';
// @ts-expect-error https://github.com/grafana/k6-jslib-testing
import { expect } from 'https://jslib.k6.io/k6-testing/0.6.1/index.js';
import { sleep } from 'k6';
import { type Options } from 'k6/options';
// @ts-expect-error k6 verwendet esbuild fuer "Type Stripping": import mit "".js" funktioniert nicht
import { BuchDTO } from '../../src/buch/controller/buch-dto.ts';
// @ts-expect-error k6 verwendet esbuild fuer "Type Stripping": import mit "".js" funktioniert nicht
import { generateISBN } from './isbn_generate.ts';

const baseUrl = 'https://localhost:3000';
const restUrl = `${baseUrl}/rest`;
const graphqlUrl = `${baseUrl}/graphql`;
const tokenUrl = `${baseUrl}/auth/token`;
const dbPopulateUrl = `${baseUrl}/dev/db_populate`;

const ids = [1, 20, 30, 40, 50, 60, 70, 80, 90];
const titelArray = ['a', 'l', 't', 'i', 'v'];
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
    datum: '2025-02-28T00:00:00Z',
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
    const response = http.get(`${restUrl}/${id}`);

    const { status, headers } = response;
    // expect ab k6 1.2.0
    // https://github.com/grafana/k6/releases/tag/v1.2.0
    // https://github.com/grafana/k6/issues/4067
    expect(status).toBe(200);
    expect(headers['Content-Type']).toContain('application/json');
    sleep(1); // Denkzeit simulieren
}

// GET /rest/<id> mit If-None-Match
export function getByIdNotModified() {
    // https://stackoverflow.com/questions/4550505/getting-a-random-value-from-a-javascript-array
    const id = ids[Math.floor(Math.random() * ids.length)]; // zwischen 0 und 1
    const headers: Record<string, string> = {
        'If-None-Match': '"0"',
    };
    const response = http.get(`${restUrl}/${id}`, { headers });

    expect(response.status).toBe(304);
    sleep(1);
}

// GET /rest?title=<value>
export function getByTitel() {
    const titel = titelArray[Math.floor(Math.random() * titelArray.length)];
    const response = http.get(`${restUrl}?titel=${titel}`);

    const { status, headers } = response;
    expect(status).toBe(200);
    expect(headers['Content-Type']).toContain('application/json');
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
    const response = http.get(`${restUrl}?titel=${titel}`);

    expect(response.status).toBe(404);
    sleep(1);
}

// GET /rest?isbn=<value>
export function getByISBN() {
    const isbn = isbns[Math.floor(Math.random() * isbns.length)];
    const response = http.get(`${restUrl}?isbn=${isbn}`);

    const { status, headers } = response;
    expect(status).toBe(200);
    expect(headers['Content-Type']).toContain('application/json');
    sleep(1);
}

// GET /rest?<schlagwort>=true
export function getBySchlagwort() {
    const schlagwort =
        schlagwoerter[Math.floor(Math.random() * schlagwoerter.length)];
    const response = http.get(`${restUrl}?${schlagwort}=true`);

    const { status, headers } = response;
    expect(status).toBe(200);
    expect(headers['Content-Type']).toContain('application/json');
    sleep(1);
}

// POST /rest
export function postBuch() {
    const schlagwort =
        schlagwoerter[Math.floor(Math.random() * schlagwoerter.length)];
    const buch = { ...neuesBuch };
    buch.isbn = generateISBN();
    buch.schlagwoerter = [schlagwort?.toUpperCase() ?? 'N/A'];

    const tokenHeaders: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    const body = 'username=admin&password=p';
    const tokenResponse = http.post<'text'>(tokenUrl, body, {
        headers: tokenHeaders,
    });
    expect(tokenResponse.status).toBe(200);
    const token = JSON.parse(tokenResponse.body).access_token;

    const requestHeaders = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    const response = http.post(restUrl, JSON.stringify(buch), {
        headers: requestHeaders,
    });

    const { status, headers } = response;
    expect(status).toBe(201);
    expect(headers['Location']).toContain(restUrl);
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
    const requestHeaders = { 'Content-Type': 'application/json' };

    const response = http.post(graphqlUrl, JSON.stringify(body), {
        headers: requestHeaders,
    });

    const { status, headers } = response;
    expect(status).toBe(200);
    expect(headers['Content-Type']).toContain('application/json');
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
    const requestHeaders = { 'Content-Type': 'application/json' };

    const response = http.post(graphqlUrl, JSON.stringify(body), {
        headers: requestHeaders,
    });

    const { status, headers } = response;
    expect(status).toBe(200);
    expect(headers['Content-Type']).toContain('application/json');
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

    const response = http.post(graphqlUrl, JSON.stringify(body), { headers });

    expect(response.status).toBe(200);
    sleep(1);
}
