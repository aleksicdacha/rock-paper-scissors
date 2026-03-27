import { io, Socket } from 'socket.io-client';
import { ClientEvent, MatchMode, ServerEvent, Move } from '@rps/shared';
import { PLAYER_ID_KEY, SERVER_URL } from './SocketService.consts';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (HTTP)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getOrCreatePlayerId(): string {
  const existing = localStorage.getItem(PLAYER_ID_KEY);
  if (existing) return existing;
  const id = generateId();
  localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
}

class SocketService {
  private socket: Socket | null = null;

  get playerId(): string {
    return getOrCreatePlayerId();
  }

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SERVER_URL, {
      auth: { playerId: this.playerId },
      transports: ['websocket'],
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  createMatch(playerName: string, mode?: MatchMode, bestOf?: number, moveTimeoutMs?: number): void {
    this.socket?.emit(ClientEvent.MatchCreate, { playerName, mode, bestOf, moveTimeoutMs });
  }

  joinMatch(matchId: string, playerName: string): void {
    this.socket?.emit(ClientEvent.MatchJoin, { matchId, playerName });
  }

  sendMove(matchId: string, move: Move): void {
    this.socket?.emit(ClientEvent.GameMove, { matchId, move });
  }

  requestRematch(matchId: string): void {
    this.socket?.emit(ClientEvent.GameRematch, { matchId });
  }

  leaveMatch(matchId: string): void {
    this.socket?.emit(ClientEvent.MatchLeave, { matchId });
  }

  on<T>(event: ServerEvent, handler: (data: T) => void): void {
    this.socket?.on(event, handler as never);
  }

  off(event: ServerEvent): void {
    this.socket?.off(event);
  }
}

export const socketService = new SocketService();
