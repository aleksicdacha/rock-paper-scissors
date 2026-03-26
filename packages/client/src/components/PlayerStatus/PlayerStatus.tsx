import { PlayerStatusProps } from './PlayerStatusProps.interface';
import { gameConfig } from '../../gameConfig';

export const PlayerStatus = ({ name, score, moved, isYou }: PlayerStatusProps) => {
  return (
    <div className={`flex-1 flex flex-col items-center gap-2 rounded-2xl px-4 py-4 transition-all ${
      isYou
        ? 'bg-indigo-900/30 border-2 border-indigo-700/50 shadow-lg shadow-indigo-500/10'
        : 'bg-gray-800/50 border-2 border-gray-700/30'
    }`}>
      <span className="font-semibold text-sm truncate max-w-28">
        {name}{isYou ? gameConfig.player.youTag : ''}
      </span>
      <span className="text-3xl font-black tabular-nums">{score}</span>
      <span className={`text-xs font-medium transition-all h-4 ${moved ? 'text-emerald-400' : 'text-transparent'}`}>
        {gameConfig.player.movedIndicator}
      </span>
    </div>
  );
};
