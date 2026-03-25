import { useGameStore } from '../store/gameStore';
import { PHASE_FINISHED } from '../consts';
import { ResultViewProps } from '../interfaces/ResultViewProps.interface';
import { SocketService } from '../interfaces/SocketService.interface';

export function useResult(socket: SocketService): ResultViewProps {
  const { phase, matchId, players, scores, lastResult, forfeitWinner, reset } =
    useGameStore();

  const playerId = socket.playerId;
  const playerIndex = players?.[0]?.id === playerId ? 0 : 1;
  const opponentIndex = playerIndex === 0 ? 1 : 0;

  const isFinished = phase === PHASE_FINISHED;
  const isForfeit = !!forfeitWinner;

  const roundMoves = lastResult?.round.moves;
  const yourMove = roundMoves?.[playerIndex] ?? 'timeout';
  const theirMove = roundMoves?.[opponentIndex] ?? 'timeout';

  const roundWinnerId = lastResult?.winner;
  const isDraw = roundWinnerId === null;
  const youWon = isForfeit
    ? forfeitWinner === playerId
    : roundWinnerId === playerId;

  const roundLabel = isDraw
    ? 'Draw!'
    : youWon
      ? 'You win this round!'
      : 'You lose this round.';

  const onRematch = () => {
    if (matchId) socket.requestRematch(matchId);
  };

  const onLeave = () => {
    if (matchId) socket.leaveMatch(matchId);
    reset();
  };

  return {
    isFinished,
    youWon,
    isDraw,
    isForfeit,
    roundLabel,
    yourMove,
    theirMove,
    playerScore: scores[playerIndex],
    opponentScore: scores[opponentIndex],
    onRematch,
    onLeave,
  };
}
