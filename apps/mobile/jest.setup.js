jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-av/expo-image-picker touch native modules at import time that aren't
// available in the Jest sandbox — stub just enough surface for module load
// and for the containers that call them (real capture is device-only anyway).
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    RecordingOptionsPresets: { HIGH_QUALITY: {} },
    Recording: {
      createAsync: jest.fn().mockResolvedValue({
        recording: {
          stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
          getURI: jest.fn().mockReturnValue('mock://recording.m4a'),
        },
      }),
    },
  },
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

// react-native-maps ships native view managers that don't exist under Jest —
// stub MapView/Marker as plain pressable views so screens using the real map
// (iOS only, see GarageMapView.native.tsx) stay testable without a device.
jest.mock('react-native-maps', () => {
  const { forwardRef } = require('react');
  const { createElement } = require('react');
  const { TouchableOpacity, View } = require('react-native');

  const MockMapView = forwardRef(({ testID, style, children }, ref) =>
    createElement(View, { testID, style, ref }, children),
  );

  function MockMarker({ testID, title, onPress, children }) {
    return createElement(
      TouchableOpacity,
      { testID, accessibilityRole: 'button', accessibilityLabel: title, onPress },
      children,
    );
  }

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    PROVIDER_DEFAULT: 'default',
    PROVIDER_GOOGLE: 'google',
  };
});
