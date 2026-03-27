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
  round,
  bestOf,
  timeoutAt,
  selectedMove,
  opponentDisconnected,
  onMove,
}: GameViewProps) => {
  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {opponentDisconnected && (
        <div className="bg-yellow-900/20 border border-yellow-700/40 text-yellow-300 text-sm text-center rounded-xl px-4 py-3 animate-pulse">
          {gameConfig.game.disconnectedBanner}
        </div>
      )}

      <p className="text-center text-sm text-gray-500 font-medium">
        {round > bestOf ? gameConfig.game.deciderRoundLabel : `Round ${round} of ${bestOf}`}
      </p>

      <div className="flex items-center justify-between gap-4">
        <PlayerStatus name={playerName} score={playerScore} moved={playerMoved} isYou />
        <div className="flex flex-col items-center shrink-0">
          <span className="text-2xl font-black text-gray-600">VS</span>
        </div>
        <PlayerStatus name={opponentName} score={opponentScore} moved={opponentMoved} />
      </div>

      <CountdownTimer timeoutAt={timeoutAt} />

      {!selectedMove && (
        <div className="space-y-3 animate-[slide-up_0.4s_ease-out]">
          <p className="text-center text-gray-400 text-sm font-medium uppercase tracking-wide">Choose your weapon</p>
          <MoveSelector onSelect={onMove} disabled={!!selectedMove} />
        </div>
      )}

      {selectedMove && (
        <div className="text-center space-y-4 animate-[fade-in_0.3s_ease-out]">
          <div className="inline-flex items-center gap-2 bg-indigo-900/30 border border-indigo-700/30 rounded-xl px-5 py-3">
            <span className="text-2xl">{gameConfig.moveEmojis[selectedMove]}</span>
            <span className="text-indigo-300 font-medium">{gameConfig.moveLabels[selectedMove]}</span>
          </div>
          <p className="text-gray-500 text-sm animate-pulse">
            Waiting for opponent...
          </p>
        </div>
      )}
    </div>
  );
};
