import React from 'react';
import { AddGarageScreen } from './AddGarageScreen';
import { useAddGarage } from '../../hooks/useGarages';

interface AddGarageContainerProps {
  onOpenGarage: (garageId: string) => void;
  onBack?: () => void;
}

export function AddGarageContainer({ onOpenGarage, onBack }: AddGarageContainerProps) {
  const addGarage = useAddGarage();

  return <AddGarageScreen onBack={onBack} onOpenGarage={onOpenGarage} onSubmit={(input) => addGarage.mutateAsync(input)} />;
}
