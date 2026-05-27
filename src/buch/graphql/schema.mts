// Copyright (C) 2026 - present Juergen Zimmermann, Hochschule Karlsruhe
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

// -----------------------------------------------------------------------------
// G r a p h Q L   S c h e m a
// -----------------------------------------------------------------------------
export const typeDefs = /* GraphQL */ `
    "Bücherdaten lesen"
    type Query {
        buch(id: ID!): Buch!
        buecher(input: SuchParameterInput): [Buch!]!
    }

    "Bücher neu anlegen, aktualisieren oder löschen"
    type Mutation {
        create(input: BuchNeuInput!): CreatePayload!
        update(input: BuchUpdateInput!): UpdatePayload
        delete(id: ID!): DeletePayload
        token(username: String!, password: String!): TokenPayload # Mutation, wenn z.B. der Login-Zeitpunkt gespeichert wird
    }

    "Datenschema zu einem Buch, das gelesen wird"
    type Buch {
        id: ID!
        version: Int!
        isbn: String!
        rating: Int!
        art: Buchart
        preis: Float!
        rabatt: Float!
        lieferbar: Boolean!
        datum: String
        homepage: String
        schlagwoerter: [String!]!
        titel: Titel!
    }

    "Daten zum Titel eines Buches"
    type Titel {
        titel: String!
        untertitel: String
    }

    "Generierte ID bei erfolgreichem Neuanlegen"
    type CreatePayload {
        id: ID!
    }

    "Neue Versionsnummer als Resultat bei erfolgreichem Aktualisieren"
    type UpdatePayload {
        version: Int
    }

    "Flag, ob das Loeschen durchgefuehrt wurde"
    type DeletePayload {
        success: Boolean
    }

    "Access- und Refresh-Token einschliesslich Ablauf-Zeitstempel"
    type TokenPayload {
        access_token: String!
        expires_in: Int!
        refresh_token: String!
        refresh_expires_in: Int!
    }

    "Suchparameter für Bücher"
    input SuchParameterInput {
        titel: String
        isbn: String
        rating: Int
        art: Buchart
        lieferbar: Boolean
    }

    "Daten für ein neues Buch"
    input BuchNeuInput {
        isbn: String!
        rating: Int!
        preis: Float!
        rabatt: Float!
        lieferbar: Boolean!
        art: Buchart
        datum: String
        homepage: String
        schlagwoerter: [String!]!
        titel: TitelInput!
        abbildungen: [AbbildungInput!]
    }

    "Daten zum Titel eines neuen Buches"
    input TitelInput {
        titel: String!
        untertitel: String
    }

    "Daten zu den Abbildungen eines Buches"
    input AbbildungInput {
        beschriftung: String!
        contentType: String!
    }

    "Daten für ein zu änderndes Buch"
    input BuchUpdateInput {
        id: ID!
        version: Int!
        isbn: String
        rating: Int
        art: Buchart
        preis: Float
        rabatt: Float
        lieferbar: Boolean
        datum: String
        homepage: String
        schlagwoerter: [String]
    }

    enum Buchart {
        EPUB
        HARDCOVER
        PAPERBACK
    }
`;
