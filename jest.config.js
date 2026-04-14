module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^react-native-mmkv$': '<rootDir>/__mocks__/react-native-mmkv.js',
    '^react-native-vision-camera$': '<rootDir>/__mocks__/react-native-vision-camera.js',
    '^react-native-image-picker$': '<rootDir>/__mocks__/react-native-image-picker.js',
    '^react-native-maps$': '<rootDir>/__mocks__/react-native-maps.js',
    '^@react-native-community/netinfo$': '<rootDir>/__mocks__/react-native-netinfo.js',
    '^@react-native-community/geolocation$': '<rootDir>/__mocks__/react-native-geolocation.js',
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|react-native|@react-navigation|nativewind|react-native-css-interop|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-url-polyfill|zustand|react-native-mmkv|react-native-nitro-modules)/)',
  ],
};
