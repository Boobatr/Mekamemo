import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { AiCalendarScreen } from './AiCalendarScreen';

describe('AiCalendarScreen', () => {
  it('lists every generated task with its due date', async () => {
    await renderWithProviders(<AiCalendarScreen />, { withNavigationContainer: false });

    expect(screen.getByText("Vidange d'huile + filtre")).toBeTruthy();
    expect(screen.getByText('Rotation des pneus')).toBeTruthy();
    expect(screen.getByText('Inspection des freins')).toBeTruthy();
  });

  it('opens a task on press', async () => {
    const onOpenTask = jest.fn();
    await renderWithProviders(<AiCalendarScreen onOpenTask={onOpenTask} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('task-row-task-oil-change'));
    expect(onOpenTask).toHaveBeenCalledWith('task-oil-change');
  });

  it('triggers booking from the toolbar', async () => {
    const onBook = jest.fn();
    await renderWithProviders(<AiCalendarScreen onBook={onBook} />, { withNavigationContainer: false });

    await fireEvent.press(screen.getByTestId('calendar-book-button'));
    expect(onBook).toHaveBeenCalledTimes(1);
  });
});
