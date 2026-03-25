import { PlayerStatusProps } from '../interfaces/PlayerStatusProps.interface';

export const PlayerStatus = ({ name, score, moved, isYou }: PlayerStatusProps) => {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-lg px-4 py-3 ${isYou ? 'bg-indigo-900/30 border border-indigo-800' : 'bg-gray-800 border border-gray-700'}`}>
      <span className="font-medium text-sm truncate max-w-30">
        {name}{isYou ? ' (you)' : ''}
      </span>
      <span className="text-2xl font-bold">{score}</span>
      {moved && <span className="text-emerald-400 text-xs">Moved ✓</span>}
    </div>
  );
};
