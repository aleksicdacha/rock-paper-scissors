import crypto from 'node:crypto';
import { Player, WAITING, ENDED } from '@rps/shared';
import { config } from '../../config';
import { Match } from '../../models/Match.interface';
import { GameService } from '../GameService/GameService.interface';
import { MatchStore } from '../../store/MatchStore.interface';
import { createMatch, playerIndex } from '../../models/createMatch';

export class MatchService {
  private disconnectTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly store: MatchStore,
    private readonly gameService: GameService,
  ) {}

  async get(matchId: string): Promise<Match | undefined> {
    return this.store.get(matchId);
  }

  async getAll(): Promise<Match[]> {
    return this.store.all();
  }

  async create(player: Player): Promise<Match> {
    const matchId = crypto.randomUUID();
    const match = createMatch(matchId, player);
    await this.store.set(matchId, match);
    return match;
  }

  async join(matchId: string, player: Player): Promise<Match> {
    const match = await this.getOrThrow(matchId);
    if (match.state !== WAITING) throw new Error('Match is not waiting for players');
    if (match.players[0].id === player.id) throw new Error('Cannot join your own match');

    match.players[1] = player;
    await this.store.set(matchId, match);
    return this.gameService.startRound(matchId);
  }

  async leave(matchId: string, playerId: string): Promise<Match> {
    const match = await this.getOrThrow(matchId);
    this.clearDisconnectTimer(matchId);

    if (match.state === WAITING) {
      await this.store.delete(matchId);
      match.state = ENDED;
      return match;
    }

    return this.gameService.forfeit(matchId, playerId);
  }

  async disconnect(matchId: string, playerId: string): Promise<Match | null> {
    const match = await this.store.get(matchId);
    if (!match) return null;

    if (match.state === WAITING) {
      await this.store.delete(matchId);
      return null;
    }

    match.disconnectedPlayer = playerId;
    await this.store.set(matchId, match);
    this.startDisconnectTimer(matchId, playerId);
    return match;
  }

  async reconnect(matchId: string, playerId: string, socketId: string): Promise<Match> {
    const match = await this.getOrThrow(matchId);
    if (match.disconnectedPlayer !== playerId) throw new Error('Player is not disconnected');

    const idx = playerIndex(match, playerId);
    match.players[idx]!.socketId = socketId;
    match.disconnectedPlayer = null;

    this.clearDisconnectTimer(matchId);
    await this.store.set(matchId, match);
    return match;
  }

  private startDisconnectTimer(matchId: string, playerId: string): void {
    this.clearDisconnectTimer(matchId);
    const timer = setTimeout(() => this.onDisconnectTimeout(matchId, playerId), config.timer.reconnectTimeoutMs);
    this.disconnectTimers.set(matchId, timer);
  }

  private async onDisconnectTimeout(matchId: string, playerId: string): Promise<void> {
    this.disconnectTimers.delete(matchId);
    const match = await this.store.get(matchId);
    if (!match || match.state === ENDED) return;

    await this.gameService.forfeit(matchId, playerId);
  }

  private clearDisconnectTimer(matchId: string): void {
    const timer = this.disconnectTimers.get(matchId);
    if (!timer) return;
    clearTimeout(timer);
    this.disconnectTimers.delete(matchId);
  }

  private async getOrThrow(matchId: string): Promise<Match> {
    const match = await this.store.get(matchId);
    if (!match) throw new Error('Match not found');
    return match;
  }
}
