import { io, Socket } from 'socket.io-client';
import { ClientEvent, ServerEvent, Move } from '@rps/shared';
import { PLAYER_ID_KEY, SERVER_URL } from './SocketService.consts';

function getOrCreatePlayerId(): string {
  const existing = localStorage.getItem(PLAYER_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
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

  createMatch(playerName: string): void {
    this.socket?.emit(ClientEvent.MatchCreate, { playerName });
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
