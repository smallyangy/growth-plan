import pluginVue from 'eslint-plugin-vue';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
// import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';
import vueEslintParser from 'vue-eslint-parser';

export default [
    // 基础配置
    {
        ignores: [
            'node_modules/',
            'dist/',
            'build/',
            '*.log',
            '*.d.ts',
            'src/utils/tools/navToMini.ts',
        ],
    },

    // 样式规则
    // stylistic.configs.customize({
    //     indent: 4,
    //     quotes: 'single',
    //     semi: true,
    //     jsx: true,
    // }),

    // TypeScript 配置
    // 修改TypeScript配置部分
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.vue', '**/*.d.ts'],
        languageOptions: {
            parser: vueEslintParser, // 使用vue-eslint-parser作为主解析器
            parserOptions: {
                parser: tsParser,
                project: './tsconfig.json',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                    tsx: true,
                },
                extraFileExtensions: ['.vue'],
            },
            globals: {
                // 添加 uni-app 全局函数
                onLaunch: 'readonly',
                onShow: 'readonly',
                onHide: 'readonly',
                onError: 'readonly',
                onUniNViewMessage: 'readonly',
                onPageNotFound: 'readonly',
                onUnhandledRejection: 'readonly',
                onThemeChange: 'readonly',
                uni: 'readonly',
                wx: 'readonly',
                getApp: 'readonly',
                getCurrentPages: 'readonly',
                TMap: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescriptEslint,
        },
        rules: {
            ...typescriptEslint.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
    },

    // Vue 配置
    ...pluginVue.configs['flat/recommended'],

    // Prettier 配置
    eslintConfigPrettier,
    {
        plugins: {
            prettier: pluginPrettier,
        },
        rules: {
            'prettier/prettier': 'error',
        },
    },
    // Stylistic 配置
    // {
    //     plugins: {
    //         '@stylistic': stylistic,
    //     },
    //     rules: {
    //         '@stylistic/indent': 'off', // 关闭 stylistic 的缩进规则，让 prettier 来处理
    //     },
    // },

    // 自定义规则
    {
        rules: {
            'vue/multi-word-component-names': 'off',
            semi: ['error', 'always'],
            'vue/html-indent': ['error', 4],
            // indent: ['error', 4],
            'comma-dangle': ['error', 'always-multiline'],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            // 'space-before-function-paren': ['error', 'never'],
            'vue/require-explicit-emits': 'off',
            'vue/attribute-hyphenation': 'off',
            'vue/v-on-event-hyphenation': 'off',
            'vue/no-deprecated-destroyed-lifecycle': 'off',
        },
    },
];
