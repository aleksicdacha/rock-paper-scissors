import { ResultViewProps } from './ResultViewProps.interface';
import { gameConfig } from '../../gameConfig';

export const ResultView = ({
  isFinished,
  youWon,
  isDraw,
  isForfeit,
  roundLabel,
  yourMove,
  theirMove,
  playerScore,
  opponentScore,
  onRematch,
  onLeave,
}: ResultViewProps) => {
  if (isFinished) {
    return (
      <div className="text-center space-y-6">
        <h2 className={`text-3xl font-bold ${youWon ? 'text-emerald-400' : 'text-red-400'}`}>
          {youWon ? gameConfig.result.matchWin : gameConfig.result.matchLose}
        </h2>
        {isForfeit && <p className="text-gray-400">{gameConfig.result.forfeitNote}</p>}
        {!isForfeit && (
          <p className="text-gray-300">
            You: <span className="font-medium">{yourMove}</span> — Opponent: <span className="font-medium">{theirMove}</span>
          </p>
        )}
        <p className="text-lg text-gray-300">
          Score: <span className="font-bold">{playerScore}</span> – <span className="font-bold">{opponentScore}</span>
        </p>
        <button
          onClick={onLeave}
          className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {gameConfig.result.backToLobbyButton}
        </button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <h2 className={`text-3xl font-bold ${
        isDraw
          ? 'text-yellow-400'
          : youWon
            ? 'text-emerald-400'
            : 'text-red-400'
      }`}>
        {roundLabel}
      </h2>
      <p className="text-gray-300">
        You: <span className="font-medium">{yourMove}</span> — Opponent: <span className="font-medium">{theirMove}</span>
      </p>
      <p className="text-lg text-gray-300">
        Score: <span className="font-bold">{playerScore}</span> – <span className="font-bold">{opponentScore}</span>
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={onRematch}
          className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {gameConfig.result.rematchButton}
        </button>
        <button
          onClick={onLeave}
          className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {gameConfig.result.leaveButton}
        </button>
      </div>
    </div>
  );
};
