import { PlayerStatusProps } from '../interfaces/PlayerStatusProps.interface';

export const PlayerStatus = ({ name, score, moved, isYou }: PlayerStatusProps) => {
  return (
    <div>
      <span>{name}{isYou ? ' (you)' : ''}</span>
      <span> — {score} pts</span>
      {moved && <span> ✓</span>}
    </div>
  );
};
