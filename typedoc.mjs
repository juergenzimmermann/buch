// https://typedoc.org/documents/Options.html
/* global module */
/** @type {import('typedoc').TypeDocOptions} */
const config = {
    out: '.extras/doc/api',
    entryPoints: ['src'],
    entryPointStrategy: 'expand',
    excludePrivate: true,
    favicon: 'favicon.ico',
    validation: {
        invalidLink: true,
    },
    // https://shiki.matsu.io/languages
};

export default config;
