import { MoveSelector } from '../components/MoveSelector';
import { CountdownTimer } from '../components/CountdownTimer';
import { PlayerStatus } from '../components/PlayerStatus';
import { GameViewProps } from '../interfaces/GameViewProps.interface';

export const GameView = ({
  playerName,
  playerScore,
  playerMoved,
  opponentName,
  opponentScore,
  opponentMoved,
  timeoutAt,
  selectedMove,
  opponentDisconnected,
  onMove,
}: GameViewProps) => {
  return (
    <div className="space-y-8">
      {opponentDisconnected && (
        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-sm text-center rounded-lg px-4 py-2 animate-pulse">
          Opponent disconnected — waiting for reconnect...
        </div>
      )}

      <div className="flex justify-between items-start">
        <PlayerStatus
          name={playerName}
          score={playerScore}
          moved={playerMoved}
          isYou
        />
        <PlayerStatus
          name={opponentName}
          score={opponentScore}
          moved={opponentMoved}
        />
      </div>

      <CountdownTimer timeoutAt={timeoutAt} />

      <MoveSelector onSelect={onMove} disabled={!!selectedMove} />

      {selectedMove && (
        <p className="text-center text-gray-400 text-sm animate-pulse">
          You chose {selectedMove} — waiting for opponent...
        </p>
      )}
    </div>
  );
};
