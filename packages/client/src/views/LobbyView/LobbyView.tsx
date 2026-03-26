import { useState } from 'react';
import { FaRegHandRock, FaRegHandPaper, FaRegHandScissors, FaUserFriends, FaRobot, FaSignInAlt } from 'react-icons/fa';
import { LobbyViewProps } from './LobbyViewProps.interface';
import { gameConfig } from '../../gameConfig';

export const LobbyView = ({ isWaiting, matchId, error, bestOf, onBestOfChange, onCreate, onPlayComputer, onJoin, onCopy }: LobbyViewProps) => {
  const [name, setName] = useState('');
  const [joinId, setJoinId] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
  };

  const handlePlayComputer = () => {
    if (!name.trim()) return;
    onPlayComputer(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !joinId.trim()) return;
    onJoin(joinId.trim(), name.trim());
  };

  if (isWaiting && matchId) {
    return (
      <div className="text-center space-y-8 animate-[fade-in_0.3s_ease-out]">
        <div className="space-y-2">
          <div className="flex justify-center gap-3 text-4xl animate-pulse">
            <FaRegHandRock className="text-indigo-400" />
            <FaRegHandPaper className="text-indigo-400" />
            <FaRegHandScissors className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold mt-4">{gameConfig.lobby.waitingHeading}</h2>
          <p className="text-gray-400 text-sm">{gameConfig.lobby.waitingSubtext}</p>
        </div>
        <div className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-2xl p-6 space-y-4">
          <code className="block text-2xl font-mono tracking-[0.3em] text-indigo-300 font-bold">
            {matchId}
          </code>
          <button
            onClick={onCopy}
            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          >
            {gameConfig.lobby.copyButton}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      <div className="text-center space-y-3">
        <div className="flex justify-center gap-4 text-5xl">
          <span>✊</span><span>✋</span><span>✌️</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          {gameConfig.title}
        </h1>
        <p className="text-gray-500 text-sm">Choose your weapon. Defeat your opponent.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-300 bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3 text-sm animate-[shake_0.5s_ease-in-out]">
          <span className="text-red-400 shrink-0">⚠</span>
          {error.message}
        </div>
      )}

      <div>
        <input
          placeholder={gameConfig.lobby.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-xl px-5 py-4 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="text-sm text-gray-400 font-medium">{gameConfig.lobby.bestOfLabel}</span>
        {gameConfig.lobby.bestOfOptions.map((n) => (
          <button
            key={n}
            onClick={() => onBestOfChange(n)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              bestOf === n
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:border-indigo-500/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="group relative bg-gray-800/60 backdrop-blur border border-gray-700/50 hover:border-indigo-500/50 disabled:border-gray-800 rounded-2xl p-5 text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
        >
          <FaUserFriends className="text-3xl mx-auto mb-3 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
          <span className="font-semibold text-sm">{gameConfig.lobby.createButton}</span>
          <p className="text-[11px] text-gray-500 mt-1">Invite a friend</p>
        </button>

        <button
          onClick={handlePlayComputer}
          disabled={!name.trim()}
          className="group relative bg-gray-800/60 backdrop-blur border border-gray-700/50 hover:border-amber-500/50 disabled:border-gray-800 rounded-2xl p-5 text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
        >
          <FaRobot className="text-3xl mx-auto mb-3 text-amber-400 group-hover:text-amber-300 transition-colors" />
          <span className="font-semibold text-sm">{gameConfig.lobby.vsComputerButton}</span>
          <p className="text-[11px] text-gray-500 mt-1">Practice solo</p>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800" /></div>
        <div className="relative flex justify-center"><span className="bg-gray-900 px-3 text-xs text-gray-600 uppercase tracking-widest">or join a match</span></div>
      </div>

      <div className="bg-gray-800/40 backdrop-blur border border-gray-700/30 rounded-2xl p-5 space-y-3">
        <input
          placeholder={gameConfig.lobby.matchIdPlaceholder}
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono"
        />
        <button
          onClick={handleJoin}
          disabled={!name.trim() || !joinId.trim()}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-3 rounded-xl font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:hover:scale-100"
        >
          <FaSignInAlt />
          {gameConfig.lobby.joinButton}
        </button>
      </div>
    </div>
  );
};
