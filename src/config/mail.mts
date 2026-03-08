// Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
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

/**
 * Das Modul enthält die Konfiguration für den Mail-Client mit _nodemailer_.
 * @packageDocumentation
 */

import { type Options } from 'nodemailer/lib/smtp-transport/index.js';
import { getLogger } from '../logger/logger.mts';
import { config } from './app.mts';

const logger = getLogger('config/mail', 'file');
const { mail } = config;

const activated = mail?.activated === undefined || mail?.activated === true;

if (mail !== undefined) {
    if (mail.host !== undefined && typeof mail.host !== 'string') {
        throw new TypeError('Der konfigurierte Mailserver ist kein String');
    }
    if (mail.port !== undefined && typeof mail.port !== 'number') {
        throw new TypeError(
            'Der konfigurierte Port für den Mailserver ist keine Zahl',
        );
    }
}
// "Optional Chaining" und "Nullish Coalescing"
const host = (mail?.host as string | undefined) ?? 'mail';
const port = (mail?.port as number | undefined) ?? 25; // eslint-disable-line @typescript-eslint/no-magic-numbers
const useLogger = mail?.log === true;
const from =
    (mail?.from as string | undefined) ?? '"Joe Doe" <Joe.Doe@acme.com>';
const to = (mail?.to as string | undefined) ?? '"Foo Bar" <Foo.Bar@acme.com>';

/**
 * Konfiguration für den Mail-Client mit _nodemailer_.
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const options: Options = {
    host,
    port,
    secure: false,

    // Googlemail:
    // service: 'gmail',
    // auth: {
    //     user: 'Meine.Benutzerkennung@gmail.com',
    //     pass: 'mypassword'
    // }

    priority: 'normal',
    logger: useLogger,
} as const;

type MailConfig = {
    activated: boolean;
    options: Options;
    from: string;
    to: string;
};
export const mailConfig: MailConfig = {
    activated,
    options,
    from,
    to,
};

Object.freeze(options);
logger.debug('mailConfig = %o', mailConfig);
