import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ErrorBoundary } from './ErrorBoundary';

jest.mock('../services/auth-storage', () => ({ clearStoredToken: jest.fn().mockResolvedValue(undefined) }));
import { clearStoredToken } from '../services/auth-storage';

let shouldCrash = true;
function Crashy() {
  if (shouldCrash) throw new Error('boom: undefined is not an object');
  return <Text>all good</Text>;
}

describe('ErrorBoundary', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    shouldCrash = true;
    // React logs the caught error loudly; keep the test output readable.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('renders its children when nothing goes wrong', async () => {
    shouldCrash = false;
    await render(
      <ErrorBoundary>
        <Crashy />
      </ErrorBoundary>,
    );

    expect(screen.getByText('all good')).toBeTruthy();
    expect(screen.queryByTestId('error-boundary')).toBeNull();
  });

  it('shows the real error and a way out instead of a blank page', async () => {
    await render(
      <ErrorBoundary>
        <Crashy />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('error-boundary')).toBeTruthy();
    expect(screen.getByText(/boom: undefined is not an object/)).toBeTruthy();
    expect(screen.getByTestId('error-reload')).toBeTruthy();
    expect(screen.getByTestId('error-sign-out')).toBeTruthy();
  });

  it('lets the user retry once the problem is gone (native: re-renders the children)', async () => {
    await render(
      <ErrorBoundary>
        <Crashy />
      </ErrorBoundary>,
    );

    shouldCrash = false;
    await fireEvent.press(screen.getByTestId('error-reload'));

    expect(screen.getByText('all good')).toBeTruthy();
  });

  it('signs out (forgets the saved session) before reloading', async () => {
    await render(
      <ErrorBoundary>
        <Crashy />
      </ErrorBoundary>,
    );

    shouldCrash = false;
    await fireEvent.press(screen.getByTestId('error-sign-out'));

    expect(clearStoredToken).toHaveBeenCalledTimes(1);
  });
});
