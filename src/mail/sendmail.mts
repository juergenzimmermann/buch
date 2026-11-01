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
 * Das Modul besteht aus der asynchronen Funktion {@linkcode sendmail} für das
 * Verschicken von Emails.
 * @packageDocumentation
 */

import { type SMTPTransportOptions, type SendMailOptions, createTransport } from 'nodemailer';
import { getConfig } from '../config/config.mts';
import { getLogger } from '../logger/logger.mts';

/** Typdefinition für das Senden einer Email. */
export type SendMailParams = {
    /** Subject für die Email. */
    readonly subject: string;
    /** Body für die Email. */
    readonly body: string;
};

const logger = getLogger('sendmail', 'func');

const config = await getConfig();
const { enabled, from, host, port, to } = config.mail;

export const options: SMTPTransportOptions = {
    host,
    port,
    secure: false,

    // Googlemail:
    // service: 'gmail',
    // auth: {
    //     user: 'Meine.Benutzerkennung@gmail.com',
    //     pass: 'mypassword'
    // }

    logger: config.mail.logger,
} as const;

/**
 * Email mit Subject und Inhalt asynchron senden.
 * @param subject Subject vom Typ string.
 * @param body Inhalt vom Typ string.
 * @returns Promise mit void
 *
 * @author [Jürgen Zimmermann](mailto:Juergen.Zimmermann@h-ka.de)
 */
export const sendmail = async ({ subject, body }: SendMailParams) => {
    if (!enabled) {
        logger.warn('Mail deaktiviert');
        return;
    }

    const mailOptions: SendMailOptions = { from, to, subject, html: body };
    logger.debug('mailOptions=%o', mailOptions);

    try {
        await createTransport(options).sendMail(mailOptions); // NOSONAR
    } catch (err) {
        logger.warn('Fehler %o', err as object);
    }
};
