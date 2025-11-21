import 'dotenv/config';
// https://www.prisma.io/docs/orm/reference/prisma-config-reference
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    // TODO Bei Prisma 7 entfernen
    engine: 'classic',
    datasource: {
        url: env('DATABASE_URL'),
    },
});
