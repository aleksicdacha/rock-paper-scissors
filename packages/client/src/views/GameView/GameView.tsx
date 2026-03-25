import { MoveSelector } from '../../components/MoveSelector/MoveSelector';
import { CountdownTimer } from '../../components/CountdownTimer/CountdownTimer';
import { PlayerStatus } from '../../components/PlayerStatus/PlayerStatus';
import { GameViewProps } from './GameViewProps.interface';
import { gameConfig } from '../../gameConfig';

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
          {gameConfig.game.disconnectedBanner}
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
          {gameConfig.game.waitingForOpponent(selectedMove)}
        </p>
      )}
    </div>
  );
};
