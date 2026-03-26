import { useEffect, useRef } from 'react';
import { Move } from '@rps/shared';
import { ResultViewProps } from './ResultViewProps.interface';
import { gameConfig } from '../../gameConfig';

const SAD_EMOJIS = ['😭', '💀', '😵', '👎', '😢'];
const HAPPY_EMOJIS = ['🎉', '🏆', '🥳', '🔥', '⭐'];

function EmojiRain({ emojis }: { emojis: readonly string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const spans: HTMLSpanElement[] = [];
    for (let i = 0; i < 20; i++) {
      const span = document.createElement('span');
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      span.style.cssText = `
        position: fixed; top: -40px; font-size: ${20 + Math.random() * 24}px;
        left: ${Math.random() * 100}vw; z-index: 50; pointer-events: none;
        animation: emoji-fall ${2 + Math.random() * 2}s linear ${Math.random() * 1}s forwards;
      `;
      container.appendChild(span);
      spans.push(span);
    }

    return () => { spans.forEach((e) => e.remove()); };
  }, [emojis]);

  return <div ref={containerRef} />;
}

const MoveDisplay = ({ move, label }: { move: string; label: string }) => {
  const m = move as Move;
  const emoji = gameConfig.moveEmojis[m];
  const moveName = gameConfig.moveLabels[m];

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      {emoji ? (
        <>
          <span className="text-5xl animate-[bounce-in_0.4s_ease-out]">{emoji}</span>
          <span className="text-sm text-gray-300 font-medium">{moveName}</span>
        </>
      ) : (
        <span className="text-lg text-gray-500 italic">{gameConfig.result.movesFallback}</span>
      )}
    </div>
  );
};

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
  const headingColor = isDraw ? 'text-yellow-400' : youWon ? 'text-emerald-400' : 'text-red-400';

  if (isFinished) {
    return (
      <div className="text-center space-y-6 animate-[fade-in_0.3s_ease-out]">
        {youWon && <EmojiRain emojis={HAPPY_EMOJIS} />}
        {!youWon && !isDraw && <EmojiRain emojis={SAD_EMOJIS} />}
        <h2 className={`text-4xl font-black ${headingColor} animate-[bounce-in_0.5s_ease-out]`}>
          {youWon ? gameConfig.result.matchWin : gameConfig.result.matchLose}
        </h2>

        {isForfeit && (
          <p className="text-gray-400 italic">{gameConfig.result.forfeitNote}</p>
        )}

        {!isForfeit && (
          <div className="flex items-center justify-center gap-8">
            <MoveDisplay move={yourMove} label="You" />
            <span className="text-2xl text-gray-600 font-black">VS</span>
            <MoveDisplay move={theirMove} label="Opponent" />
          </div>
        )}

        <div className="inline-flex items-baseline gap-3 bg-gray-800/60 backdrop-blur rounded-xl px-6 py-3 border border-gray-700/50">
          <span className="text-4xl font-black text-indigo-400">{playerScore}</span>
          <span className="text-xl text-gray-600">–</span>
          <span className="text-4xl font-black text-gray-400">{opponentScore}</span>
        </div>

        <div>
          <button
            onClick={onLeave}
            className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
          >
            {gameConfig.result.backToLobbyButton}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6 animate-[fade-in_0.3s_ease-out]">
      <h2 className={`text-4xl font-black ${headingColor} animate-[bounce-in_0.5s_ease-out]`}>
        {roundLabel}
      </h2>

      <div className="flex items-center justify-center gap-8">
        <MoveDisplay move={yourMove} label="You" />
        <span className="text-2xl text-gray-600 font-black">VS</span>
        <MoveDisplay move={theirMove} label="Opponent" />
      </div>

      <div className="inline-flex items-baseline gap-3 bg-gray-800/60 backdrop-blur rounded-xl px-6 py-3 border border-gray-700/50">
        <span className="text-4xl font-black text-indigo-400">{playerScore}</span>
        <span className="text-xl text-gray-600">–</span>
        <span className="text-4xl font-black text-gray-400">{opponentScore}</span>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onRematch}
          className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
        >
          {gameConfig.result.rematchButton}
        </button>
        <button
          onClick={onLeave}
          className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
        >
          {gameConfig.result.leaveButton}
        </button>
      </div>
    </div>
  );
};
