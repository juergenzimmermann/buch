// @ts-check
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import jest from 'eslint-plugin-jest';
import nodePlugin from 'eslint-plugin-n';
import preferArrow from 'eslint-plugin-prefer-arrow';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import promise from 'eslint-plugin-promise';
import regexp from 'eslint-plugin-regexp';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// TODO https://github.com/gkouziik/eslint-plugin-security-node/issues/82 Maerz 2024

// https://typescript-eslint.io/packages/typescript-eslint#config
export default tseslint.config(
    // https://github.com/prettier/eslint-plugin-prettier?tab=readme-ov-file#configuration-new-eslintconfigjs
    {
        files: ['src/*.ts', '__tests__/**/*.ts'],

        extends: [
            // https://eslint.org/docs/latest/rules
            // https://github.com/eslint/eslint/blob/main/packages/js/src/configs/eslint-recommended.js
            eslint.configs.recommended,
            ...tseslint.configs.strict,
            ...tseslint.configs.stylistic,
            // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/configs/recommended.js
            unicorn.configs['flat/recommended'],
            // https://github.com/SonarSource/eslint-plugin-sonarjs
            // https://github.com/SonarSource/eslint-plugin-sonarjs/blob/master/src/index.ts
            sonarjs.configs.recommended,
            // https://github.com/eslint-community/eslint-plugin-promise#rules
            nodePlugin.configs['flat/recommended'],
            // https://github.com/eslint-community/eslint-plugin-security?tab=readme-ov-file#flat-config-requires-eslint--v8230
            security.configs.recommended,
            // https://github.com/eslint-community/eslint-plugin-eslint-comments/blob/main/lib/configs/recommended.js
            comments.recommended,
            // https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/configs/recommended.ts
            regexp.configs['flat/recommended'],
            // https://github.com/eslint-community/eslint-plugin-promise#rules
            promise.configs['flat/recommended'],
            stylistic.configs['recommended-flat'],
            jest.configs['flat/recommended'],
            jest.configs['flat/style'],
        ],

        plugins: {
            'prefer-arrow': preferArrow,
        },

        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            parserOptions: {
                project: true,
                ecmaFeatures: {
                    impliedStrict: true,
                },
            },
            globals: {
                ...globals.node,
                ...jest.environments.globals.globals,
            },
        },

        rules: {
            // https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin#supported-rules
            // https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin/docs/rules
            // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/recommended-type-checked.ts
            // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/stylistic-type-checked.ts
            '@typescript-eslint/array-type': ['error', { default: 'array' }],
            '@typescript-eslint/ban-ts-comment': 'error',
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/consistent-type-exports': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/default-param-last': 'error',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-member-accessibility': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/member-ordering': 'error',
            '@typescript-eslint/method-signature-style': 'error',
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'default',
                    format: ['camelCase'],
                },
                {
                    selector: 'variable',
                    format: ['camelCase', 'UPPER_CASE'],
                },
                {
                    selector: 'parameter',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'classProperty',
                    modifiers: ['static', 'readonly'],
                    format: ['UPPER_CASE'],
                    leadingUnderscore: 'allowDouble',
                },
                {
                    selector: 'objectLiteralProperty',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
            ],
            '@typescript-eslint/no-base-to-string': [
                'error',
                {
                    ignoredTypeNames: ['RegExp', 'boolean'],
                },
            ],
            '@typescript-eslint/no-confusing-void-expression': [
                'error',
                {
                    ignoreArrowShorthand: true,
                },
            ],
            '@typescript-eslint/no-deprecated': 'error',
            '@typescript-eslint/no-dupe-class-members': 'error',
            '@typescript-eslint/no-dynamic-delete': 'error',
            '@typescript-eslint/no-empty-function': [
                'error',
                {
                    allow: ['arrowFunctions'],
                },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-floating-promises': [
                'error',
                {
                    ignoreIIFE: true,
                },
            ],
            '@typescript-eslint/no-invalid-this': 'error',
            '@typescript-eslint/no-invalid-void-type': 'error',
            '@typescript-eslint/no-loop-func': 'error',
            '@typescript-eslint/no-magic-numbers': [
                'error',
                {
                    ignoreReadonlyClassProperties: true,
                    ignoreArrayIndexes: true,
                    enforceConst: true,
                    ignore: [0, 1, -1],
                },
            ],
            '@typescript-eslint/no-meaningless-void-operator': 'error',
            '@typescript-eslint/no-misused-promises': [
                'error',
                {
                    checksVoidReturn: false,
                },
            ],
            '@typescript-eslint/no-mixed-enums': 'error',
            '@typescript-eslint/no-non-null-asserted-nullish-coalescing':
                'error',
            '@typescript-eslint/no-require-imports': 'error',
            '@typescript-eslint/no-shadow': 'error',
            '@typescript-eslint/no-unnecessary-boolean-literal-compare':
                'error',
            '@typescript-eslint/no-unnecessary-condition': [
                'error',
                {
                    allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: true,
                },
            ],
            '@typescript-eslint/no-unnecessary-parameter-property-assignment':
                'error',
            '@typescript-eslint/no-unnecessary-qualifier': 'error',
            '@typescript-eslint/no-unnecessary-type-arguments': 'error',
            '@typescript-eslint/no-unnecessary-type-parameters': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            //'@typescript-eslint/no-unsafe-type-assertion': 'error',
            '@typescript-eslint/no-unsafe-unary-minus': 'error',
            //'@typescript-eslint/no-untyped-public-signature': 'error',
            '@typescript-eslint/no-unused-vars': [
                'off',
                {
                    ignoreRestSiblings: true,
                },
            ],
            '@typescript-eslint/no-use-before-define': [
                'error',
                {
                    functions: false,
                    classes: false,
                    typedefs: false,
                },
            ],
            '@typescript-eslint/no-useless-constructor': 'error',
            '@typescript-eslint/no-useless-empty-export': 'error',
            //'@typescript-eslint/no-useless-template-expression': 'error',
            '@typescript-eslint/non-nullable-type-assertion-style': 'error',
            '@typescript-eslint/only-throw-error': 'error',
            '@typescript-eslint/prefer-destructuring': 'error',
            '@typescript-eslint/prefer-enum-initializers': 'error',
            '@typescript-eslint/prefer-find': 'error',
            '@typescript-eslint/prefer-includes': 'error',
            '@typescript-eslint/prefer-literal-enum-member': 'error',
            '@typescript-eslint/prefer-readonly': 'error',
            //'@typescript-eslint/prefer-readonly-parameter-types': ['error', {
            //    checkParameterProperties: true,
            //}],
            '@typescript-eslint/prefer-reduce-type-parameter': 'error',
            '@typescript-eslint/prefer-regexp-exec': 'error',
            '@typescript-eslint/prefer-return-this-type': 'error',
            '@typescript-eslint/require-array-sort-compare': 'error',
            '@typescript-eslint/restrict-plus-operands': [
                'error',
                {
                    skipCompoundAssignments: false,
                },
            ],
            '@typescript-eslint/restrict-template-expressions': [
                'error',
                {
                    allowNumber: true,
                    allowBoolean: true,
                    allowNullish: true,
                },
            ],
            '@typescript-eslint/return-await': 'error',
            '@typescript-eslint/strict-boolean-expressions': 'error',
            '@typescript-eslint/switch-exhaustiveness-check': [
                'error',
                {
                    allowDefaultCaseForExhaustiveSwitch: false,
                    requireDefaultForNonUnion: true,
                },
            ],
            '@typescript-eslint/unbound-method': [
                'error',
                {
                    ignoreStatic: true,
                },
            ],
            '@typescript-eslint/unified-signatures': 'error',

            // https://github.com/weiran-zsd/eslint-plugin-node/blob/master/lib/configs/_commons.js
            'n/callback-return': 'error',
            'n/exports-style': 'error',
            'n/file-extension-in-import': 'off',
            'n/global-require': 'error',
            'n/handle-callback-err': 'error',
            'n/no-callback-literal': 'error',
            'n/no-missing-import': 'off',
            'n/no-mixed-requires': 'error',
            'n/no-new-require': 'error',
            'n/no-path-concat': 'error',
            'n/no-process-env': 'error',
            'n/no-process-exit': 'error',
            'n/no-sync': [
                'error',
                {
                    allowAtRootLevel: true,
                },
            ],
            'n/prefer-global/buffer': 'error',
            'n/prefer-global/console': 'error',
            'n/prefer-global/process': ['error', 'never'],
            'n/prefer-global/text-decoder': 'error',
            'n/prefer-global/text-encoder': 'error',
            'n/prefer-global/url': 'error',
            'n/prefer-global/url-search-params': 'error',
            'n/prefer-promises/dns': 'error',
            'n/prefer-promises/fs': 'error',

            'prefer-arrow/prefer-arrow-functions': [
                'error',
                {
                    classPropertiesAllowed: false,
                },
            ],

            'regexp/no-extra-lookaround-assertions': 'error',
            'regexp/no-misleading-capturing-group': 'error',
            'regexp/no-missing-g-flag': 'error',
            'regexp/prefer-regexp-exec': 'error',

            // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/configs/recommended.js
            'unicorn/catch-error-name': [
                'error',
                {
                    name: 'err',
                },
            ],
            'unicorn/consistent-function-scoping': 'error',
            'unicorn/custom-error-definition': 'error',
            'unicorn/filename-case': 'off',
            'unicorn/no-array-for-each': 'off',
            'unicorn/no-keyword-prefix': 'error',
            'unicorn/no-negated-condition': 'error',
            'unicorn/no-nested-ternary': 'error',
            'unicorn/no-object-as-default-parameter': 'error',
            'unicorn/no-process-exit': 'off',
            'unicorn/no-static-only-class': 'error',
            'unicorn/no-unsafe-regex': 'error',
            'unicorn/no-unused-properties': 'error',
            'unicorn/numeric-separators-style': 'error',
            'unicorn/prefer-array-find': 'error',
            'unicorn/prefer-array-flat': 'error',
            'unicorn/prefer-flat-map': 'error',
            'unicorn/prefer-module': 'error',
            'unicorn/prefer-node-protocol': 'error',
            'unicorn/prefer-replace-all': 'error',
            'unicorn/prefer-switch': 'error',
            'unicorn/prevent-abbreviations': 'off',
            'unicorn/string-content': 'error',

            'sonarjs/fixme-tag': 'off',
            'sonarjs/todo-tag': 'off',

            'promise/no-multiple-resolved': 'error',
            'promise/prefer-catch': 'error',

            // https://eslint.org/docs/rules
            // https://github.com/prettier/eslint-config-prettier#arrow-body-style-and-prefer-arrow-callback
            // https://eslint.org/docs/rules/arrow-body-style
            'arrow-body-style': ['error', 'as-needed'],
            'block-scoped-var': 'error',
            camelcase: 'error',
            'consistent-this': 'error',
            // https://github.com/prettier/eslint-config-prettier#curly
            // https://eslint.org/docs/rules/curly
            curly: ['error', 'all'],
            'default-case-last': 'error',
            'default-param-last': 'error',
            // siehe @typescript-eslint/dot-notation
            'dot-notation': 'off',
            eqeqeq: 'error',
            'for-direction': 'error',
            'func-name-matching': 'error',
            'func-names': ['error', 'never'],
            'func-style': 'error',
            'getter-return': 'error',
            'grouped-accessor-pairs': 'error',
            'handle-callback-err': 'error',
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
            'no-buffer-constructor': 'error',
            'no-caller': 'error',
            'no-console': 'off',
            'no-constant-binary-expression': 'error',
            'no-constructor-return': 'error',
            'no-continue': 'error',
            'no-duplicate-imports': 'error',
            'no-else-return': 'error',
            'no-empty-function': 'error',
            'no-empty-static-block': 'error',
            'no-eq-null': 'error',
            'no-eval': 'error',
            'no-extend-native': 'error',
            'no-extra-bind': 'error',
            'no-extra-label': 'error',
            'no-implicit-coercion': 'error',
            'no-implicit-globals': 'error',
            'no-implied-eval': 'error',
            // siehe @typescript-eslint/no-invalid-this
            'no-invalid-this': 'off',
            'no-iterator': 'error',
            'no-label-var': 'error',
            'no-labels': 'error',
            'no-lone-blocks': 'error',
            'no-lonely-if': 'error',
            'no-loop-func': 'error',
            // siehe @typescript-eslint/no-loss-of-precision
            'no-loss-of-precision': 'off',
            // siehe @typescript-eslint/no-magic-numbers
            'no-magic-numbers': 'off',
            'no-multi-assign': 'error',
            'no-negated-condition': 'error',
            'no-nested-ternary': 'error',
            'no-new': 'error',
            'no-new-func': 'error',
            'no-new-native-nonconstructor': 'error',
            'no-new-object': 'error',
            'no-new-wrappers': 'error',
            'no-object-constructor': 'error',
            'no-param-reassign': 'error',
            'no-promise-executor-return': 'error',
            'no-proto': 'error',
            'no-redeclare': 'off',
            // siehe @typescript-eslint/no-restricted-imports
            'no-restricted-imports': 'off',
            'no-restricted-properties': 'error',
            // https://github.com/prettier/eslint-config-prettier#no-sequences
            'no-restricted-syntax': ['error', 'SequenceExpression'],
            'no-return-assign': 'error',
            // siehe @typescript-eslint/return-await
            'no-return-await': 'off',
            'no-script-url': 'error',
            'no-self-compare': 'error',
            'no-sequences': 'error',
            // siehe @typescript-eslint/no-shadow
            'no-shadow': 'off',
            'no-shadow-restricted-names': 'error',
            'no-template-curly-in-string': 'error',
            // siehe @typescript-eslint/only-throw-error
            'no-throw-literal': 'off',
            'no-undef-init': 'error',
            'no-underscore-dangle': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unneeded-ternary': 'error',
            'no-unreachable-loop': 'error',
            'no-unused-expressions': 'error',
            'no-unused-private-class-members': 'error',
            // siehe @typescript-eslint/no-unused-vars
            'no-unused-vars': 'off',
            'no-use-before-define': [
                'error',
                {
                    functions: false,
                    classes: false,
                },
            ],
            'no-useless-call': 'error',
            'no-useless-catch': 'error',
            'no-useless-computed-key': 'error',
            'no-useless-concat': 'error',
            'no-useless-constructor': 'error',
            'no-useless-rename': 'error',
            'no-useless-return': 'error',
            'no-void': 'error',
            'no-with': 'error',
            'object-shorthand': 'error',
            'one-var': ['error', 'never'],
            'operator-assignment': 'error',
            'prefer-arrow-callback': 'error',
            'prefer-exponentiation-operator': 'error',
            'prefer-numeric-literals': 'error',
            'prefer-object-has-own': 'error',
            'prefer-object-spread': 'error',
            'prefer-promise-reject-errors': 'error',
            'prefer-regex-literals': [
                'error',
                {
                    disallowRedundantWrapping: true,
                },
            ],
            'prefer-rest-params': 'error',
            'prefer-template': 'error',
            radix: 'error',
            'require-atomic-updates': 'error',
            // siehe @typescript-eslint/require-await
            'require-await': 'off',
            'require-unicode-regexp': 'error',
            // 'sort-imports': 'error',
            strict: 'error',
            'symbol-description': 'error',
            yoda: ['error', 'never'],

            // https://eslint.style/rules
            // https://eslint.style/guide/config-presets
            // https://github.com/eslint-stylistic/eslint-stylistic/blob/main/packages/eslint-plugin/configs/customize.ts
            ...stylistic.configs.customize({
                flat: false,
                indent: 4,
                jsx: false,
            }).rules,
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

            // https://github.com/jest-community/eslint-plugin-jest/blob/main/src/index.ts
            'jest/consistent-test-it': [
                'error',
                {
                    fn: 'test',
                    withinDescribe: 'test',
                },
            ],
            // 'jest/no-conditional-expect': 'off',
            'jest/no-conditional-in-test': 'error',
            'jest/no-duplicate-hooks': 'error',
            'jest/no-restricted-matchers': 'error',
            // 'jest/no-standalone-expect': 'off',
            'jest/no-test-return-statement': 'error',
            'jest/prefer-comparison-matcher': 'error',
            'jest/prefer-equality-matcher': 'error',
            'jest/prefer-expect-resolves': 'error',
            'jest/prefer-hooks-in-order': 'error',
            'jest/prefer-hooks-on-top': 'error',
            'jest/prefer-mock-promise-shorthand': 'error',
            'jest/prefer-snapshot-hint': 'error',
            'jest/prefer-todo': 'error',
            'jest/require-top-level-describe': 'error',
            // 'jest/valid-expect': 'off',
        },
    },

    // prettier ueberschreibt vorherige Konfigurationseinstellungen
    prettierRecommended,
);
