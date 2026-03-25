import { useState } from 'react';
import { LobbyViewProps } from './LobbyViewProps.interface';
import { gameConfig } from '../../gameConfig';

export const LobbyView = ({ isWaiting, matchId, error, onCreate, onJoin, onCopy }: LobbyViewProps) => {
  const [name, setName] = useState('');
  const [joinId, setJoinId] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !joinId.trim()) return;
    onJoin(joinId.trim(), name.trim());
  };

  if (isWaiting && matchId) {
    return (
      <div className="text-center space-y-6">
        <div className="animate-pulse">
          <h2 className="text-2xl font-semibold">{gameConfig.lobby.waitingHeading}</h2>
        </div>
        <p className="text-gray-400">{gameConfig.lobby.waitingSubtext}</p>
        <div className="flex items-center justify-center gap-3">
          <code className="bg-gray-800 px-4 py-2 rounded-lg text-lg font-mono tracking-wider">
            {matchId}
          </code>
          <button
            onClick={onCopy}
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {gameConfig.lobby.copyButton}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">{gameConfig.title}</h1>

      {error && (
        <p className="text-red-400 text-center text-sm bg-red-900/20 rounded-lg px-4 py-2">
          {error.message}
        </p>
      )}

      <div>
        <input
          placeholder={gameConfig.lobby.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">{gameConfig.lobby.createHeading}</h3>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            {gameConfig.lobby.createButton}
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">{gameConfig.lobby.joinHeading}</h3>
          <input
            placeholder={gameConfig.lobby.matchIdPlaceholder}
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={handleJoin}
            disabled={!name.trim() || !joinId.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            {gameConfig.lobby.joinButton}
          </button>
        </div>
      </div>
    </div>
  );
};
