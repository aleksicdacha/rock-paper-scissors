import { type ReactNode } from 'react';
import { FaRegHandRock, FaRegHandPaper, FaRegHandScissors } from 'react-icons/fa';
import { Move } from '@rps/shared';
import { MoveSelectorProps } from '../interfaces/MoveSelectorProps.interface';
import { MOVES } from '../consts';

const MOVE_ICON: Record<Move, ReactNode> = {
  rock: <FaRegHandRock className="text-3xl" />,
  paper: <FaRegHandPaper className="text-3xl" />,
  scissors: <FaRegHandScissors className="text-3xl" />,
};

const MOVE_LABEL: Record<Move, string> = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors',
};

export const MoveSelector = ({ onSelect, disabled }: MoveSelectorProps) => {
  return (
    <div className="flex justify-center gap-4">
      {MOVES.map((move) => (
        <button
          key={move}
          onClick={() => onSelect(move)}
          disabled={disabled}
          className="flex flex-col items-center gap-2 bg-gray-800 hover:bg-indigo-600 disabled:bg-gray-800/50 disabled:text-gray-600 border border-gray-700 hover:border-indigo-500 disabled:border-gray-800 px-6 py-4 rounded-xl font-medium transition-all"
        >
          {MOVE_ICON[move]}
          <span className="text-sm">{MOVE_LABEL[move]}</span>
        </button>
      ))}
    </div>
  );
};
