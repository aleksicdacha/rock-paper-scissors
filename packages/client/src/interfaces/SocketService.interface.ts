import { Move, ServerEvent } from '@rps/shared';

export interface SocketService {
  readonly playerId: string;
  connect(): unknown;
  disconnect(): void;
  createMatch(playerName: string): void;
  joinMatch(matchId: string, playerName: string): void;
  sendMove(matchId: string, move: Move): void;
  requestRematch(matchId: string): void;
  leaveMatch(matchId: string): void;
  on<T>(event: ServerEvent, handler: (data: T) => void): void;
  off(event: ServerEvent): void;
}
