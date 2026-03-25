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
      <div>
        <h2>Waiting for opponent...</h2>
        <p>Share this code with your opponent:</p>
        <div>
          <code>{matchId}</code>
          <button onClick={handleCopy}>Copy</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Rock Paper Scissors</h1>

      {error && <p style={{ color: 'red' }}>{error.message}</p>}

      <div>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <h3>Create Match</h3>
        <button onClick={handleCreate} disabled={!name.trim()}>
          Create
        </button>
      </div>

      <div>
        <h3>Join Match</h3>
        <input
          placeholder="Match ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
        />
        <button onClick={handleJoin} disabled={!name.trim() || !joinId.trim()}>
          Join
        </button>
      </div>
    </div>
  );
};
