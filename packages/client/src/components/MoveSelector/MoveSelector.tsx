import { type ReactNode } from 'react';
import { FaRegHandRock, FaRegHandPaper, FaRegHandScissors } from 'react-icons/fa';
import { Move } from '@rps/shared';
import { MoveSelectorProps } from './MoveSelectorProps.interface';
import { MOVES } from './MoveSelector.consts';
import { gameConfig } from '../../gameConfig';

const MOVE_ICON: Record<Move, ReactNode> = {
  rock: <FaRegHandRock className="text-5xl" />,
  paper: <FaRegHandPaper className="text-5xl" />,
  scissors: <FaRegHandScissors className="text-5xl" />,
};

export const MoveSelector = ({ onSelect, disabled }: MoveSelectorProps) => {
  return (
    <div className="flex justify-center gap-5">
      {MOVES.map((move) => (
        <button
          key={move}
          onClick={() => onSelect(move)}
          disabled={disabled}
          className="group flex flex-col items-center gap-3 bg-gray-800/70 hover:bg-indigo-600 disabled:bg-gray-800/30 disabled:text-gray-600 border-2 border-gray-700/50 hover:border-indigo-400 disabled:border-gray-800/30 px-7 py-5 rounded-2xl font-medium transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95"
        >
          {MOVE_ICON[move]}
          <span className="text-sm font-semibold tracking-wide group-hover:text-white">{gameConfig.moveLabels[move]}</span>
        </button>
      ))}
    </div>
  );
};
