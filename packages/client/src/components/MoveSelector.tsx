import { MoveSelectorProps } from '../interfaces/MoveSelectorProps.interface';
import { MOVES } from '../consts';

export const MoveSelector = ({ onSelect, disabled }: MoveSelectorProps) => {
  return (
    <div>
      {MOVES.map((move) => (
        <button key={move} onClick={() => onSelect(move)} disabled={disabled}>
          {move.charAt(0).toUpperCase() + move.slice(1)}
        </button>
      ))}
    </div>
  );
};
