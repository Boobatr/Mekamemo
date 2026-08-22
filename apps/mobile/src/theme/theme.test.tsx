import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { darkTheme, emberTheme, lightTheme } from './colors';

function Probe() {
  const { colors, mode, toggleMode } = useTheme();
  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Text testID="accent">{colors.accent}</Text>
      <Text testID="toggle" onPress={toggleMode}>
        toggle
      </Text>
    </>
  );
}

describe('ThemeProvider', () => {
  it('defaults to dark mode', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(getByTestId('mode').props.children).toBe('dark');
    expect(getByTestId('accent').props.children).toBe(darkTheme.accent);
  });

  it('cycles dark -> light -> ember -> dark', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await fireEvent.press(getByTestId('toggle'));
    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('light');
      expect(getByTestId('accent').props.children).toBe(lightTheme.accent);
    });

    await fireEvent.press(getByTestId('toggle'));
    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('ember');
      expect(getByTestId('accent').props.children).toBe(emberTheme.accent);
    });

    await fireEvent.press(getByTestId('toggle'));
    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('dark');
    });
  });

  it('keeps the same accent hue between dark and light modes, but ember stands apart', () => {
    expect(darkTheme.accent).toBe('#1d6ef5');
    expect(lightTheme.accent).toBe('#1d6ef5');
    expect(emberTheme.accent).not.toBe(darkTheme.accent);
  });

  it('provides exactly five hairline and accent-tint opacities per mode', () => {
    expect(darkTheme.hairlines).toHaveLength(5);
    expect(darkTheme.accentTints).toHaveLength(5);
    expect(lightTheme.hairlines).toHaveLength(5);
    expect(lightTheme.accentTints).toHaveLength(5);
    expect(emberTheme.hairlines).toHaveLength(5);
    expect(emberTheme.accentTints).toHaveLength(5);
  });
});
