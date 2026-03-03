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

// Yoga wird auch bei Elysia genutzt: https://elysiajs.com/plugins/graphql-yoga

// Die Integration vom Apollo Server in Hono ist aufwaendig:
// https://www.oluwasetemi.dev/blog/building-apollo-server-hono-integration

import { createSchema, createYoga } from 'graphql-yoga';
import { Hono } from 'hono';
import { getLogger } from '../../logger/logger.mts';
import {
    createHandler,
    deleteHandler,
    tokenHandler,
    updateHandler,
} from './mutation-handler.mts';
import { buchHandler, buecherHandler } from './query-handler.mts';
import { roleRequired } from './role-required.mts';
import {
    type BuchNeuInput,
    type BuchUpdateInput,
    ID,
    type SuchParameterInput,
    typeDefs,
} from './types.mts';

const logger = getLogger('query-handler', 'file');
type GraphqlContext = {
    request: Request;
};

// -----------------------------------------------------------------------------
// R e s o l v e r   p a s s e n d   z u m   G r a p h Q L   S c h e m a
// -----------------------------------------------------------------------------
const resolvers = {
    Query: {
        buch: (_: unknown, { id }: { id: ID }) => buchHandler(id),
        buecher: (_: unknown, { input }: { input?: SuchParameterInput }) =>
            buecherHandler(input),
    },
    Mutation: {
        create: async (
            _: unknown,
            { input }: { input: BuchNeuInput },
            { request }: GraphqlContext,
        ) => {
            await roleRequired(request, 'admin', 'user');
            return createHandler(input);
        },
        update: async (
            _: unknown,
            { input }: { input: BuchUpdateInput },
            { request }: GraphqlContext,
        ) => {
            await roleRequired(request, 'admin', 'user');
            return updateHandler(input);
        },
        delete: async (
            _: unknown,
            { id }: { id: ID },
            { request }: GraphqlContext,
        ) => {
            await roleRequired(request, 'admin');
            return deleteHandler(id);
        },
        token: (
            _: unknown,
            { username, password }: { username: string; password: string },
        ) => tokenHandler({ username, password }),
    },
};

// -----------------------------------------------------------------------------
// Y o g a   S e r v e r   m i t   S c h e m a   e i n s c h l.  R e s o l v e r
// -----------------------------------------------------------------------------
const yogaServer = createYoga({
    schema: createSchema({ typeDefs, resolvers }),
});

// -----------------------------------------------------------------------------
// H o n o   A p p   m i t   Y o g a   S e r v e r
// -----------------------------------------------------------------------------
export const app = new Hono();

app.post('/graphql', async (c) => {
    logger.debug('/graphql');
    const { raw } = c.req;
    const { body } = raw;

    // https://github.com/orgs/honojs/discussions/1063#discussioncomment-9121474
    const response = await yogaServer.fetch(raw, { body });

    return c.newResponse(response.body, response);
});

export const graphqlApp = app;
