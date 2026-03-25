import { Move } from '@rps/shared';

interface MoveSelectorProps {
  onSelect: (move: Move) => void;
  disabled: boolean;
}

export const MoveSelector = ({ onSelect, disabled }: MoveSelectorProps) => {
  return (
    <div>
      <button onClick={() => onSelect('rock')} disabled={disabled}>Rock</button>
      <button onClick={() => onSelect('paper')} disabled={disabled}>Paper</button>
      <button onClick={() => onSelect('scissors')} disabled={disabled}>Scissors</button>
    </div>
  );
};
