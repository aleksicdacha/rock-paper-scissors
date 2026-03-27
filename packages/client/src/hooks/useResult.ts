import { useGameStore } from '../store/gameStore';
import { PHASE_FINISHED } from '../store/GameStore.consts';
import { gameConfig } from '../gameConfig';
import { ResultViewProps } from '../views/ResultView/ResultViewProps.interface';
import { SocketService } from '../services/SocketService/SocketService.interface';

export function useResult(socket: SocketService): ResultViewProps {
  const { phase, matchId, players, scores, lastResult, forfeitWinner, rematchRequested, reset } =
    useGameStore();

  const playerId = socket.playerId;
  const playerIndex = players?.[0]?.id === playerId ? 0 : 1;
  const opponentIndex = playerIndex === 0 ? 1 : 0;

  const isFinished = phase === PHASE_FINISHED;
  const isForfeit = !!forfeitWinner;

  const roundMoves = lastResult?.round.moves;
  const yourMove = roundMoves?.[playerIndex] ?? gameConfig.result.movesFallback;
  const theirMove = roundMoves?.[opponentIndex] ?? gameConfig.result.movesFallback;

  const roundWinnerId = lastResult?.winner;
  const isDraw = roundWinnerId === null;
  const youWon = isForfeit
    ? forfeitWinner === playerId
    : roundWinnerId === playerId;

  const roundLabel = isDraw
    ? gameConfig.result.roundDraw
    : youWon
      ? gameConfig.result.roundWin
      : gameConfig.result.roundLose;

  const onRematch = () => {
    if (matchId) {
      socket.requestRematch(matchId);
      useGameStore.setState({ rematchRequested: true });
    }
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
    rematchRequested,
    opponentName: players?.[opponentIndex]?.name ?? '',
    onRematch,
    onLeave,
  };
}
