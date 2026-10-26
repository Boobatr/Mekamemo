import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { EditTaskScreen, EditableTask } from './EditTaskScreen';

const task: EditableTask = {
  id: 'task-oil-change',
  name: "Vidange d'huile + filtre",
  editedByUser: true,
  isRecurring: true,
  manufacturerIntervalKm: 8000,
  manufacturerIntervalMonths: 6,
  intervalKm: 7000,
  intervalMonths: 6,
  priority: 'normal',
  nextDueLabel: '17 août 2026 · 66 000 km',
  notesForGarage: 'Huile synthétique 0W-20.',
  groupWithTireRotation: true,
};

describe('EditTaskScreen', () => {
  it('renders the manufacturer note with the correct interval', async () => {
    await renderWithProviders(<EditTaskScreen task={task} />, { withNavigationContainer: false });

    expect(screen.getByText(/tous les 8 000 km ou 6 mois/)).toBeTruthy();
  });

  it('changes priority selection', async () => {
    await renderWithProviders(<EditTaskScreen task={task} />, { withNavigationContainer: false });

    await fireEvent.press(screen.getByTestId('priority-critical'));
    expect(screen.getByTestId('priority-critical').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#ffffff' })]),
    );
  });

  it('submits edited values on save', async () => {
    const onSave = jest.fn();
    await renderWithProviders(<EditTaskScreen task={task} onSave={onSave} />, {
      withNavigationContainer: false,
    });

    await fireEvent.changeText(screen.getByTestId('input-interval-km'), '6500');
    await fireEvent.press(screen.getByTestId('priority-critical'));
    await fireEvent.press(screen.getByTestId('save-task-button'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ intervalKm: 6500, priority: 'critical' }),
    );
  });

  it('calls onDelete with the task id', async () => {
    const onDelete = jest.fn();
    await renderWithProviders(<EditTaskScreen task={task} onDelete={onDelete} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('delete-task-button'));
    expect(onDelete).toHaveBeenCalledWith('task-oil-change');
  });

  describe('find a garage for this item', () => {
    it('is offered only where a garage search is possible', async () => {
      await renderWithProviders(<EditTaskScreen task={task} />, { withNavigationContainer: false });
      expect(screen.queryByTestId('find-garage-button')).toBeNull();

      await renderWithProviders(<EditTaskScreen task={task} onFindGarage={jest.fn()} />, { withNavigationContainer: false });
      expect(screen.getByText('Trouver un garage')).toBeTruthy();
    });

    it('hands over the notes as they are typed now, since they go into the email', async () => {
      const onFindGarage = jest.fn();
      await renderWithProviders(<EditTaskScreen task={task} onFindGarage={onFindGarage} />, { withNavigationContainer: false });

      await fireEvent.changeText(screen.getByTestId('input-notes'), 'Pneus d’hiver aussi, svp.');
      await fireEvent.press(screen.getByTestId('find-garage-button'));

      expect(onFindGarage).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-oil-change', notesForGarage: 'Pneus d’hiver aussi, svp.' }));
    });
  });
});
