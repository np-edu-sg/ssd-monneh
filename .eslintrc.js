/**
 * @type {import('@types/eslint').Linter.BaseConfig}
 */
module.exports = {
    extends: [
        '@remix-run/eslint-config',
        '@remix-run/eslint-config/node',
        '@remix-run/eslint-config/jest-testing-library',
        'prettier',
    ],
    rules: {
        'react/jsx-curly-brace-presence': [
            1,
            { props: 'always', propElementValues: 'always' },
        ],
    },
}
