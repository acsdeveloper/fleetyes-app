module.exports = {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
        'preval',
        'react-native-reanimated/plugin',
        '@babel/plugin-proposal-export-namespace-from',
        [
            '@tamagui/babel-plugin',
            {
                components: ['tamagui'],
                config: './tamagui.config.ts',
                importsWhitelist: ['constants.js', 'colors.js'],
                logTimings: true,
                disableExtraction: process.env.NODE_ENV === 'development',
                experimentalFlattenThemesOnNative: false,
            },
        ],
        [
            'module-resolver',
            {
                root: ['./src', './app'],
                extensions: ['.js', '.json'],
                alias: {
                    account: './src/features/Account',
                    auth: './src/features/Auth',
                    core: './src/features/Core',
                    exceptions: './src/features/Exceptions',
                    shared: './src/features/Shared',
                    ui: './src/interface',
                    components: './src/components',
                    assets: './assets',
                    app: './app',
                    storage: './src/utils/storage',
                    utils: './src/utils',
                },
            },
        ],
    ],
};
