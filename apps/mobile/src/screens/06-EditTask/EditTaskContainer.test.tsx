import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { EditTaskContainer } from './EditTaskContainer';
import * as maintenanceApiModule from '../../services/maintenance';

jest.mock('../../services/maintenance');
const maintenance = jest.mocked(maintenanceApiModule);

const TASK = {
  id: 't1',
  vehicleId: 'v1',
  name: "Vidange d'huile",
  description: null,
  intervalKm: 8000,
  intervalMonths: 6,
  priority: 'normal',
  isRecurring: true,
  editedByUser: false,
  notesForGarage: null,
  groupWithTaskId: null,
  status: 'upcoming',
  estimatedCostMinCents: null,
  estimatedCostMaxCents: null,
  projection: null,
} as maintenanceApiModule.MaintenanceTask;

function renderContainer(props: Partial<React.ComponentProps<typeof EditTaskContainer>> = {}) {
  return renderWithProviders(
    <EditTaskContainer task={TASK} vehicleId="v1" onBack={jest.fn()} onDeleted={jest.fn()} onSaved={jest.fn()} {...props} />,
    { withNavigationContainer: false },
  );
}

describe('EditTaskContainer: find a garage', () => {
  beforeEach(() => {
    maintenance.updateTask.mockReset(); // not jest.resetAllMocks(): it would also wipe React Native's own test mocks (Switch)
    maintenance.updateTask.mockResolvedValue(TASK);
  });

  it('saves the notes first, then opens the garage search for this item', async () => {
    const onFindGarage = jest.fn();
    await renderContainer({ onFindGarage });

    await fireEvent.changeText(screen.getByTestId('input-notes'), 'Huile 0W-20');
    await fireEvent.press(screen.getByTestId('find-garage-button'));

    await waitFor(() => expect(onFindGarage).toHaveBeenCalledWith(TASK, 'v1'));
    expect(maintenance.updateTask).toHaveBeenCalledTimes(1);
    expect(maintenance.updateTask.mock.calls[0][0]).toBe('t1');
    expect(maintenance.updateTask.mock.calls[0][1]).toMatchObject({ notesForGarage: 'Huile 0W-20' });
  });

  it('stays on the item and says so when saving fails', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    maintenance.updateTask.mockRejectedValue(new Error('Serveur indisponible'));
    const onFindGarage = jest.fn();
    await renderContainer({ onFindGarage });

    await fireEvent.press(screen.getByTestId('find-garage-button'));

    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(onFindGarage).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  it('still leaves the screen after a normal save', async () => {
    const onSaved = jest.fn();
    await renderContainer({ onSaved });

    await fireEvent.press(screen.getByTestId('save-task-button'));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });
});
