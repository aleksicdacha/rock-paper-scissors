import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/SocketService';
import { PHASE_WAITING } from '../consts';

export const LobbyView = () => {
  const { phase, matchId, error } = useGameStore();
  const [name, setName] = useState('');
  const [joinId, setJoinId] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    socketService.createMatch(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !joinId.trim()) return;
    socketService.joinMatch(joinId.trim(), name.trim());
  };

  const handleCopy = () => {
    if (matchId) navigator.clipboard.writeText(matchId);
  };

  if (phase === PHASE_WAITING && matchId) {
    return (
      <div className="text-center space-y-6">
        <div className="animate-pulse">
          <h2 className="text-2xl font-semibold">Waiting for opponent...</h2>
        </div>
        <p className="text-gray-400">Share this code with your opponent:</p>
        <div className="flex items-center justify-center gap-3">
          <code className="bg-gray-800 px-4 py-2 rounded-lg text-lg font-mono tracking-wider">
            {matchId}
          </code>
          <button
            onClick={handleCopy}
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">Rock Paper Scissors</h1>

      {error && (
        <p className="text-red-400 text-center text-sm bg-red-900/20 rounded-lg px-4 py-2">
          {error.message}
        </p>
      )}

      <div>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Create Match</h3>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Create
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Join Match</h3>
          <input
            placeholder="Match ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={handleJoin}
            disabled={!name.trim() || !joinId.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
};
