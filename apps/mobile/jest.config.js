const jestExpoPreset = require('jest-expo/jest-preset');

module.exports = {
  ...jestExpoPreset,
  setupFiles: [...(jestExpoPreset.setupFiles || []), '<rootDir>/jest.setup.js'],
  transform: {
    ...jestExpoPreset.transform,
    '\\.mjs$': jestExpoPreset.transform['\\.[jt]sx?$'],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|lucide-react-native))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
};
