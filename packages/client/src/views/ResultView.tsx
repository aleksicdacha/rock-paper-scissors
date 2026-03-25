import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/SocketService';
import { PHASE_FINISHED } from '../consts';

export const ResultView = () => {
  const { phase, matchId, players, scores, lastResult, forfeitWinner, reset } =
    useGameStore();

  const playerId = socketService.playerId;
  const playerIndex = players?.[0]?.id === playerId ? 0 : 1;
  const opponentIndex = playerIndex === 0 ? 1 : 0;

  const handleRematch = () => {
    if (matchId) socketService.requestRematch(matchId);
  };

  const handleLeave = () => {
    if (matchId) socketService.leaveMatch(matchId);
    reset();
  };

  const roundMoves = lastResult?.round.moves;
  const yourMove = roundMoves?.[playerIndex] ?? 'timeout';
  const theirMove = roundMoves?.[opponentIndex] ?? 'timeout';

  const roundWinnerId = lastResult?.winner;
  const roundLabel =
    roundWinnerId === null
      ? 'Draw!'
      : roundWinnerId === playerId
        ? 'You win this round!'
        : 'You lose this round.';

  if (phase === PHASE_FINISHED) {
    const isForfeit = !!forfeitWinner;
    const youWon = isForfeit
      ? forfeitWinner === playerId
      : lastResult?.winner === playerId;

    return (
      <div className="text-center space-y-6">
        <h2 className={`text-3xl font-bold ${youWon ? 'text-emerald-400' : 'text-red-400'}`}>
          {youWon ? 'You won the match!' : 'You lost the match.'}
        </h2>
        {isForfeit && <p className="text-gray-400">Opponent forfeited.</p>}
        {!isForfeit && lastResult && (
          <p className="text-gray-300">
            You: <span className="font-medium">{yourMove}</span> — Opponent: <span className="font-medium">{theirMove}</span>
          </p>
        )}
        <p className="text-lg text-gray-300">
          Score: <span className="font-bold">{scores[playerIndex]}</span> – <span className="font-bold">{scores[opponentIndex]}</span>
        </p>
        <button
          onClick={handleLeave}
          className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <h2 className={`text-3xl font-bold ${
        roundWinnerId === null
          ? 'text-yellow-400'
          : roundWinnerId === playerId
            ? 'text-emerald-400'
            : 'text-red-400'
      }`}>
        {roundLabel}
      </h2>
      <p className="text-gray-300">
        You: <span className="font-medium">{yourMove}</span> — Opponent: <span className="font-medium">{theirMove}</span>
      </p>
      <p className="text-lg text-gray-300">
        Score: <span className="font-bold">{scores[playerIndex]}</span> – <span className="font-bold">{scores[opponentIndex]}</span>
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleRematch}
          className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Rematch
        </button>
        <button
          onClick={handleLeave}
          className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Leave
        </button>
      </div>
    </div>
  );
};
