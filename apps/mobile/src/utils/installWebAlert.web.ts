import { Alert, AlertButton } from 'react-native';

/**
 * react-native-web ships Alert.alert as a no-op, so on the web build every error
 * message in the app (failed save, duplicate email, booking error…) was swallowed
 * silently. Back it with the browser's own dialogs so the existing call sites
 * work unchanged. Native builds resolve installWebAlert.ts instead (no-op).
 */
Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
  const text = [title, message].filter(Boolean).join('\n\n');

  if (buttons && buttons.length > 1) {
    const confirmed = window.confirm(text);
    const chosen = confirmed
      ? buttons.find((button) => button.style !== 'cancel')
      : buttons.find((button) => button.style === 'cancel');
    chosen?.onPress?.();
    return;
  }

  window.alert(text);
  buttons?.[0]?.onPress?.();
};
