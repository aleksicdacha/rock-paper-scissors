import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/SocketService';
import { MoveSelector } from '../components/MoveSelector';
import { CountdownTimer } from '../components/CountdownTimer';
import { PlayerStatus } from '../components/PlayerStatus';
import { Move } from '@rps/shared';

export const GameView = () => {
  const { matchId, players, scores, timeoutAt, moved, selectedMove, opponentDisconnected } =
    useGameStore();

  const playerId = socketService.playerId;
  const playerIndex = players?.[0]?.id === playerId ? 0 : 1;
  const opponentIndex = playerIndex === 0 ? 1 : 0;

  const handleMove = (move: Move) => {
    if (!matchId || selectedMove) return;
    useGameStore.getState().selectMove(move);
    socketService.sendMove(matchId, move);
  };

  return (
    <div>
      {opponentDisconnected && <p>Opponent disconnected — waiting for reconnect...</p>}

      <div>
        <PlayerStatus
          name={players?.[playerIndex]?.name ?? ''}
          score={scores[playerIndex]}
          moved={moved[playerIndex]}
          isYou
        />
        <PlayerStatus
          name={players?.[opponentIndex]?.name ?? ''}
          score={scores[opponentIndex]}
          moved={moved[opponentIndex]}
        />
      </div>

      <CountdownTimer timeoutAt={timeoutAt} />

      <MoveSelector onSelect={handleMove} disabled={!!selectedMove} />

      {selectedMove && <p>You chose {selectedMove} — waiting for opponent...</p>}
    </div>
  );
};
