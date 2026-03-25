import { Move } from '@rps/shared';
import { useGameStore } from '../store/gameStore';
import { GameViewProps } from '../interfaces/GameViewProps.interface';
import { SocketService } from '../interfaces/SocketService.interface';

export function useGame(socket: SocketService): GameViewProps {
  const { matchId, players, scores, timeoutAt, moved, selectedMove, opponentDisconnected } =
    useGameStore();

  const playerId = socket.playerId;
  const playerIndex = players?.[0]?.id === playerId ? 0 : 1;
  const opponentIndex = playerIndex === 0 ? 1 : 0;

  const onMove = (move: Move) => {
    if (!matchId || selectedMove) return;
    useGameStore.getState().selectMove(move);
    socket.sendMove(matchId, move);
  };

  return {
    playerName: players?.[playerIndex]?.name ?? '',
    playerScore: scores[playerIndex],
    playerMoved: moved[playerIndex],
    opponentName: players?.[opponentIndex]?.name ?? '',
    opponentScore: scores[opponentIndex],
    opponentMoved: moved[opponentIndex],
    timeoutAt,
    selectedMove,
    opponentDisconnected,
    onMove,
  };
}
