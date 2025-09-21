// https://typedoc.org/documents/Options.html
/* global module */
/** @type {import('typedoc').TypeDocOptions} */
const config = {
    out: '.extras/doc/api',
    entryPoints: ['src'],
    entryPointStrategy: 'expand',
    excludePrivate: true,
    exclude: ['./src/generated/prisma/**/*.ts', 'tests/**/*.ts'],
    favicon: 'favicon.ico',
    validation: {
        invalidLink: true,
        notExported: false,
    },
    // https://shiki.matsu.io/languages
};

export default config;
