// Copyright (C) 2026 - current Juergen Zimmermann
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

import { defineConfig } from 'oxlint';

// https://oxc.rs/docs/guide/usage/linter/config-file-reference

/* oxlint-disable max-lines */
// oxlint-disable-next-line import/no-default-export
export default defineConfig({
    // https://oxc.rs/docs/guide/usage/linter/plugins.html#supported-plugins
    // default: eslint, typescript, unicorn, oxc
    plugins: ['import', 'node', 'promise'],

    // https://oxc.rs/docs/guide/usage/linter/js-plugins
    jsPlugins: [
        '@stylistic/eslint-plugin',

        // 'eslint-plugin-regexp',
        // 'eslint-plugin-sonarjs',
        // 'eslint-plugin-no-secrets',
        // 'eslint-plugin-security',
    ],

    // https://oxc.rs/docs/guide/usage/linter/cli#allowing-denying-multiple-lints
    // https://oxc.rs/docs/guide/usage/linter/config-file-reference.html#categories
    categories: {
        correctness: 'error',
        suspicious: 'error',
        pedantic: 'error',
        perf: 'error',
        style: 'error',
        restriction: 'error',
    },

    // https://oxc.rs/docs/guide/usage/linter/config-file-reference.html#env
    env: {
        es2026: true,
        node: true,
    },

    // https://oxc.rs/docs/guide/usage/linter/config-file-reference.html#options
    options: {
        denyWarnings: true,
        reportUnusedDisableDirectives: 'error',
        // erfordert das Package oxlint-tsgolint
        typeAware: true,
        // erfordert das Package oxlint-tsgolint
        typeCheck: true,
    },

    // https://oxc.rs/docs/guide/usage/linter/config-file-reference.html#settings
    settings: {
        // https://oxc.rs/docs/guide/usage/linter/config-file-reference.html#settings-vitest
        // https://github.com/vitest-dev/eslint-plugin-vitest
        vitest: {
            typecheck: true,
        },
    },

    // https://oxc.rs/docs/guide/usage/linter/rules.html
    rules: {
        // https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin#supported-rules
        // https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin/docs/rules
        // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/recommended-type-checked.ts
        // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/stylistic-type-checked.ts
        'typescript/array-type': ['error', { default: 'array' }],
        'typescript/consistent-type-definitions': ['error', 'type'],
        'typescript/consistent-type-exports': 'error',
        'typescript/consistent-type-imports': 'error',
        'typescript/default-param-last': 'error',
        'typescript/explicit-function-return-type': 'off',
        'typescript/explicit-member-accessibility': 'off',
        'typescript/explicit-module-boundary-types': 'off',
        'typescript/no-base-to-string': [
            'error',
            {
                ignoredTypeNames: ['RegExp', 'boolean'],
            },
        ],
        'typescript/no-confusing-void-expression': [
            'error',
            {
                ignoreArrowShorthand: true,
            },
        ],
        //'typescript/no-deprecated': 'error',
        'typescript/no-dupe-class-members': 'error',
        'typescript/no-empty-function': [
            'error',
            {
                allow: ['arrowFunctions'],
            },
        ],
        'typescript/no-explicit-any': 'off',
        'typescript/no-floating-promises': [
            'error',
            {
                ignoreIIFE: true,
            },
        ],
        'typescript/no-loop-func': 'error',
        'typescript/no-shadow': 'error',
        'typescript/no-unnecessary-qualifier': 'error',
        'typescript/no-unnecessary-type-conversion': 'error',
        'typescript/no-unsafe-member-access': 'off',
        'typescript/no-unused-vars': [
            'off',
            {
                ignoreRestSiblings: true,
            },
        ],
        'typescript/no-use-before-define': [
            'error',
            {
                functions: false,
                classes: false,
                typedefs: false,
            },
        ],
        'typescript/no-useless-empty-export': 'error',
        'typescript/non-nullable-type-assertion-style': 'error',
        'typescript/prefer-enum-initializers': 'error',
        'typescript/prefer-find': 'error',
        'typescript/prefer-includes': 'error',
        'typescript/prefer-readonly': 'error',
        'typescript/prefer-regexp-exec': 'error',
        'typescript/require-await': 'error',
        'typescript/restrict-template-expressions': [
            'error',
            {
                allowNumber: true,
                allowBoolean: true,
                allowNullish: true,
            },
        ],
        'typescript/strict-boolean-expressions': 'error',
        'typescript/switch-exhaustiveness-check': [
            'error',
            {
                considerDefaultExhaustiveForUnions: true,
                requireDefaultForNonUnion: true,
            },
        ],
        // 'typescript/member-ordering': 'error',
        // 'typescript/method-signature-style': 'error',
        // 'typescript/naming-convention': [
        //     'error',
        //     {
        //         selector: 'default',
        //         format: ['camelCase'],
        //     },
        //     {
        //         selector: 'variable',
        //         format: ['camelCase', 'UPPER_CASE'],
        //     },
        //     {
        //         selector: 'parameter',
        //         format: ['camelCase'],
        //         leadingUnderscore: 'allow',
        //     },
        //     {
        //         selector: 'classProperty',
        //         modifiers: ['static', 'readonly'],
        //         format: ['UPPER_CASE'],
        //         leadingUnderscore: 'allowDouble',
        //     },
        //     {
        //         selector: 'objectLiteralProperty',
        //         format: ['camelCase'],
        //         leadingUnderscore: 'allow',
        //     },
        //     {
        //         selector: 'typeLike',
        //         format: ['PascalCase'],
        //     },
        // ],
        // 'typescript/no-invalid-this': 'error',
        // 'typescript/no-unused-private-class-members': 'error',
        // 'typescript/prefer-destructuring': 'error',

        'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
        // https://typescript-eslint.io/troubleshooting/typed-linting/performance#eslint-plugin-import
        'import/default': 'off',
        'import/extensions': 'off',
        'import/exports-last': 'off',
        'import/first': 'error',
        'import/group-exports': 'off',
        // https://typescript-eslint.io/troubleshooting/typed-linting/performance#eslint-plugin-import
        'import/named': 'off',
        // https://typescript-eslint.io/troubleshooting/typed-linting/performance#eslint-plugin-import
        'import/namespace': 'off',
        'import/no-absolute-path': 'error',
        'import/no-commonjs': 'error',
        'import/no-default-export': 'error',
        'import/no-dynamic-require': 'error',
        'import/no-empty-named-blocks': 'error',
        'import/no-mutable-exports': 'error',
        // https://typescript-eslint.io/troubleshooting/typed-linting/performance#eslint-plugin-import
        'import/no-named-as-default-member': 'off',
        'import/no-named-default': 'error',
        'import/no-named-export': 'off',
        'import/no-namespace': 'error',
        'import/no-self-import': 'error',
        'import/no-unassigned-import': 'error',
        'import/no-relative-parent-imports': 'off',
        'import/prefer-default-export': 'off',
        // 'import/enforce-node-protocol-usage': ['error', 'always'],
        // 'import/newline-after-import': 'error',
        // 'import/no-extraneous-dependencies': 'error',
        // 'import/no-useless-path-segments': 'error',

        'node/global-require': 'error',
        'node/handle-callback-err': 'error',
        'node/no-new-require': 'error',
        'node/no-path-concat': 'error',
        'node/no-process-env': 'error',
        // 'node/callback-return': ['error', ['next']],
        // 'node/exports-style': 'error',
        // 'node/no-callback-literal': 'error',
        // 'node/no-mixed-requires': 'error',
        // 'node/no-sync': [
        //     'error',
        //     {
        //         allowAtRootLevel: true,
        //     },
        // ],
        // 'node/prefer-global/buffer': 'error',
        // 'node/prefer-global/console': 'error',
        // 'node/prefer-global/process': ['error', 'never'],
        // 'node/prefer-global/text-decoder': 'error',
        // 'node/prefer-global/text-encoder': 'error',
        // 'node/prefer-global/url': 'error',
        // 'node/prefer-global/url-search-params': 'error',
        // 'node/prefer-promises/dns': 'error',
        // 'node/prefer-promises/fs': 'error',

        // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/configs/recommended.js
        'unicorn/catch-error-name': [
            'error',
            {
                name: 'err',
            },
        ],
        'unicorn/custom-error-definition': 'error',
        'unicorn/filename-case': 'off',
        'unicorn/no-array-for-each': 'off',
        'unicorn/no-process-exit': 'off',
        'unicorn/prefer-array-flat-map': 'error',
        'unicorn/prefer-string-replace-all': 'error',
        // 'unicorn/no-keyword-prefix': 'error',
        // 'unicorn/no-unused-properties': 'error',
        // 'unicorn/string-content': 'error',

        'promise/no-multiple-resolved': 'error',
        'promise/prefer-catch': 'error',

        // https://eslint.org/docs/rules
        // https://eslint.org/docs/rules/arrow-body-style
        'arrow-body-style': [
            'error',
            'as-needed',
            { requireReturnForObjectLiteral: true },
        ],
        'block-scoped-var': 'error',
        'capitalized-comments': 'off',
        // https://eslint.org/docs/rules/curly
        curly: ['error', 'all'],
        'default-case-last': 'error',
        'default-param-last': 'error',
        // siehe typescript/dot-notation
        'dot-notation': 'off',
        eqeqeq: 'error',
        'func-name-matching': 'error',
        'func-names': ['error', 'never'],
        'func-style': 'error',
        'grouped-accessor-pairs': 'error',
        // Variable "c" fuer Typ "Context" in Hono
        'id-length': ['error', { exceptionPatterns: ['c', 'i', 'T', '_'] }],
        'init-declarations': 'off',
        'logical-assignment-operators': 'error',
        'max-classes-per-file': 'error',
        'max-depth': 'error',
        'max-lines': 'error',
        'max-lines-per-function': [
            'error',
            {
                max: 60,
            },
        ],
        'max-nested-callbacks': [
            'error',
            {
                max: 4,
            },
        ],
        'max-params': 'error',
        'max-statements': [
            'error',
            {
                max: 25,
            },
        ],
        'no-alert': 'error',
        'no-array-constructor': 'error',
        'no-bitwise': 'error',
        'no-console': 'off',
        'no-constructor-return': 'error',
        'no-continue': 'error',
        'no-duplicate-imports': 'error',
        'no-else-return': 'error',
        'no-empty-function': 'error',
        'no-eq-null': 'error',
        'no-eval': 'error',
        'no-extend-native': 'error',
        'no-extra-bind': 'error',
        'no-extra-label': 'error',
        'no-implicit-coercion': 'error',
        'no-implied-eval': 'error',
        'no-inline-comments': 'off',
        'no-label-var': 'error',
        'no-labels': 'error',
        'no-lone-blocks': 'error',
        'no-lonely-if': 'error',
        'no-loop-func': 'error',
        'no-magic-numbers': [
            'error',
            {
                ignoreReadonlyClassProperties: true,
                ignoreArrayIndexes: true,
                enforceConst: true,
                ignore: [
                    0, 1, -1, 200, 201, 204, 304, 401, 403, 404, 406, 412, 422,
                    428, 500,
                ],
            },
        ],
        'no-multi-assign': 'error',
        'no-negated-condition': 'error',
        'no-nested-ternary': 'error',
        'no-new': 'error',
        'no-new-func': 'error',
        'no-new-wrappers': 'error',
        'no-nodejs-modules': 'off',
        'no-object-constructor': 'error',
        'no-param-reassign': 'error',
        'no-plusplus': 'off',
        'no-promise-executor-return': 'error',
        'no-proto': 'error',
        'no-redeclare': 'off',
        'no-restricted-imports': 'error',
        'no-restricted-properties': 'error',
        'no-return-assign': 'error',
        'no-script-url': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-shadow': 'error',
        'no-template-curly-in-string': 'error',
        'no-ternary': 'off',
        'no-throw-literal': 'error',
        'no-underscore-dangle': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-unneeded-ternary': 'error',
        'no-unused-vars': 'error',
        'no-use-before-define': [
            'error',
            {
                functions: false,
                classes: false,
            },
        ],
        'no-useless-call': 'error',
        'no-useless-computed-key': 'error',
        'no-useless-concat': 'error',
        'no-useless-constructor': 'error',
        'no-useless-return': 'error',
        'no-void': 'error',
        'no-warning-comments': 'off',
        'object-shorthand': 'error',
        'operator-assignment': 'error',
        'prefer-exponentiation-operator': 'error',
        'prefer-numeric-literals': 'error',
        'prefer-object-has-own': 'error',
        'prefer-object-spread': 'error',
        'prefer-promise-reject-errors': 'error',
        'prefer-rest-params': 'error',
        'prefer-template': 'error',
        'preserve-caught-error': 'error',
        radix: 'error',
        'require-unicode-regexp': 'error',
        'sort-keys': 'off',
        'symbol-description': 'error',
        yoda: ['error', 'never'],

        // camelcase: 'error',
        // 'consistent-this': 'error',
        // 'no-implicit-globals': 'error',
        // 'no-restricted-syntax': ['error', 'SequenceExpression'],
        // 'no-undef-init': 'error',
        // 'no-unreachable-loop': 'error',
        // 'one-var': ['error', 'never'],
        // 'prefer-arrow-callback': 'error',
        // 'prefer-regex-literals': [
        //     'error',
        //     {
        //         disallowRedundantWrapping: true,
        //     },
        // ],
        // 'require-atomic-updates': 'error',
        // strict: 'error',

        '@stylistic/arrow-parens': ['error', 'always'],
        '@stylistic/brace-style': ['error', '1tbs'],
        '@stylistic/curly-newline': 'error',
        '@stylistic/indent': 'off',
        '@stylistic/indent-binary-ops': 'off',
        '@stylistic/member-delimiter-style': [
            'error',
            {
                multiline: { delimiter: 'semi' },
            },
        ],
        '@stylistic/multiline-comment-style': ['error', 'separate-lines'],
        '@stylistic/operator-linebreak': 'off',
        '@stylistic/quote-props': ['error', 'as-needed'],
        '@stylistic/semi': ['error', 'always'],

        // 'regexp/prefer-regexp-exec': 'error',
    },

    overrides: [
        {
            files: [
                'src/*/service/**/*.test.mts',
                'test/integration/*/*.test.mts',
            ],

            plugins: ['vitest', 'import'],
            rules: {
                'vitest/consistent-test-it': [
                    'error',
                    { withinDescribe: 'test' },
                ],
                'vitest/max-expects': 'off',
                'vitest/no-conditional-in-test': 'off',
                'vitest/no-hooks': [
                    'error',
                    { allow: ['beforeAll', 'beforeEach'] },
                ],
                'vitest/no-importing-vitest-globals': 'off',
                'vitest/prefer-called-times': 'off',
                'vitest/prefer-expect-assertions': [
                    'error',
                    {
                        onlyFunctionsWithExpectInLoop: true,
                    },
                ],
                'vitest/prefer-lowercase-title': 'off',
                'vitest/prefer-to-be-truthy': 'off',
                'vitest/require-test-timeout': 'off',
                'vitest/warn-todo': 'off',
            },
        },
    ],
});
