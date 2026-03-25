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
      <div>
        <h2>{youWon ? 'You won the match!' : 'You lost the match.'}</h2>
        {isForfeit && <p>Opponent forfeited.</p>}
        {!isForfeit && lastResult && (
          <p>
            You: {yourMove} — Opponent: {theirMove}
          </p>
        )}
        <p>
          Score: {scores[playerIndex]} – {scores[opponentIndex]}
        </p>
        <button onClick={handleLeave}>Back to Lobby</button>
      </div>
    );
  }

  return (
    <div>
      <h2>{roundLabel}</h2>
      <p>
        You: {yourMove} — Opponent: {theirMove}
      </p>
      <p>
        Score: {scores[playerIndex]} – {scores[opponentIndex]}
      </p>

      <button onClick={handleRematch}>Rematch</button>
      <button onClick={handleLeave}>Leave</button>
    </div>
  );
};
