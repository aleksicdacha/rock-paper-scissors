import { Move } from '@rps/shared';

export interface MoveSelectorProps {
  onSelect: (move: Move) => void;
  disabled: boolean;
}
