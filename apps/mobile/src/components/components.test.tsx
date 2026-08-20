import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../theme';
import { Button } from './Button';
import { Card } from './Card';
import { Field } from './Field';
import { Tag } from './Tag';
import { ScreenHeader } from './ScreenHeader';

describe('design system components', () => {
  it('Button fires onPress and shows its label', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <Button label="CONTINUER" onPress={onPress} testID="cta" />
      </ThemeProvider>,
    );
    expect(screen.getByText('CONTINUER')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('cta'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Button does not fire onPress while loading', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <Button label="CONTINUER" onPress={onPress} loading testID="cta" />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByTestId('cta'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('Card renders its children', async () => {
    await render(
      <ThemeProvider>
        <Card>
          <Field label="COURRIEL" value="marc.lavoie@courriel.ca" />
        </Card>
      </ThemeProvider>,
    );
    expect(screen.getByText('COURRIEL')).toBeTruthy();
    expect(screen.getByDisplayValue('marc.lavoie@courriel.ca')).toBeTruthy();
  });

  it('Tag renders its label', async () => {
    await render(
      <ThemeProvider>
        <Tag label="VIDANGE DANS 9 J" />
      </ThemeProvider>,
    );
    expect(screen.getByText('VIDANGE DANS 9 J')).toBeTruthy();
  });

  it('ScreenHeader renders eyebrow and title', async () => {
    await render(
      <ThemeProvider>
        <ScreenHeader eyebrow="TOYOTA RAV4 2021" title="Calendrier d'entretien" />
      </ThemeProvider>,
    );
    expect(screen.getByText('TOYOTA RAV4 2021')).toBeTruthy();
    expect(screen.getByText("Calendrier d'entretien")).toBeTruthy();
  });

  it('ScreenHeader shows a back link only when onBack is provided', async () => {
    const onBack = jest.fn();
    const { rerender } = await render(
      <ThemeProvider>
        <ScreenHeader title="Historique" />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId('screen-back-button')).toBeNull();

    await rerender(
      <ThemeProvider>
        <ScreenHeader title="Historique" onBack={onBack} />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByTestId('screen-back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
