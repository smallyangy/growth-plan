// Stylelint配置文件
module.exports = {
    extends: [
        'stylelint-config-standard',
        'stylelint-config-recommended-scss',
        'stylelint-config-prettier-scss',
    ],
    plugins: ['stylelint-scss', '@stylistic/stylelint-plugin'],
    rules: {
        'unit-allowed-list': ['em', 'rem', '%', 's', 'rpx', 'vw', 'vh', 'ms', 'deg', 'fr', 'turn'],
        'unit-no-unknown': [
            true,
            {
                ignoreUnits: ['rpx'],
            },
        ],
        'at-rule-no-unknown': null,
        'scss/at-rule-no-unknown': true,
        'declaration-block-no-duplicate-custom-properties': true,
        'selector-not-notation': 'complex',
        'media-feature-range-notation': 'context',
        'alpha-value-notation': 'number',
        'hue-degree-notation': 'angle',
        'selector-pseudo-class-no-unknown': [
            true,
            {
                ignorePseudoClasses: ['deep'],
            },
        ],
        '@stylistic/indentation': [
            4,
            {
                baseIndentLevel: 1,
            },
        ],
    },
    // 为不同类型的文件设置不同的customSyntax
    overrides: [
        {
            files: ['src/**/*.{vue,html}'],
            customSyntax: 'postcss-html',
        },
        {
            files: ['src/**/*.scss'],
            customSyntax: 'postcss-scss',
        },
        {
            files: ['src/**/*.css'],
            customSyntax: 'postcss',
        },
    ],
};
