import crypto from 'node:crypto';
import { Server, Socket } from 'socket.io';
import { ClientEvent, ServerEvent, Move, MatchMode, ErrorPayload, ENDED, PVP } from '@rps/shared';
import { GameService } from '../../services/GameService/GameService.interface';
import { BotService } from '../../services/BotService/BotService.interface';
import { MatchCallbacks } from './MatchCallbacks.interface';
import { MatchService } from '../../services/MatchService/MatchService.interface';
import { buildGameState, buildMatchResult } from '../../game/matchMappers';
import { config } from '../../config';
import { logger } from '../../logger';

export class SocketGateway implements MatchCallbacks {
  private socketsByPlayerId = new Map<string, string>();

  constructor(
    private readonly io: Server,
    private readonly matchService: MatchService,
    private readonly gameService: GameService,
    private readonly botService: BotService,
  ) {}

  registerHandlers(): void {
    this.io.on('connection', (socket) => {
      const playerId = (socket.handshake.auth.playerId as string) ?? crypto.randomUUID();
      this.socketsByPlayerId.set(playerId, socket.id);

      // Auto-rejoin match room if this player was disconnected mid-match
      void this.handleAutoReconnect(socket, playerId);

      socket.on(ClientEvent.MatchCreate, (data: { playerName: string; mode?: MatchMode; bestOf?: number; moveTimeoutMs?: number }) =>
        this.handleCreate(socket, playerId, data.playerName, data.mode, data.bestOf, data.moveTimeoutMs),
      );

      socket.on(ClientEvent.MatchJoin, (data: { matchId: string; playerName: string }) =>
        this.handleJoin(socket, playerId, data.matchId, data.playerName),
      );

      socket.on(ClientEvent.GameMove, (data: { matchId: string; move: Move }) =>
        this.handleMove(socket, playerId, data.matchId, data.move),
      );

      socket.on(ClientEvent.GameRematch, (data: { matchId: string }) =>
        this.handleRematch(socket, playerId, data.matchId),
      );

      socket.on(ClientEvent.MatchLeave, (data: { matchId: string }) =>
        this.handleLeave(socket, playerId, data.matchId),
      );

      socket.on('disconnect', () => this.handleDisconnect(playerId));
    });
  }

  async onRoundResolved(matchId: string): Promise<void> {
    const match = await this.matchService.get(matchId);
    if (!match) return;

    const round = match.rounds[match.rounds.length - 1];
    logger.info({ matchId, result: round?.winner ?? null }, 'match.resolved');
    this.io.to(matchId).emit(ServerEvent.GameResult, buildMatchResult(match));
    this.io.to(matchId).emit(ServerEvent.GameState, buildGameState(match));
  }

  async onForfeit(matchId: string): Promise<void> {
    const match = await this.matchService.get(matchId);
    if (!match || !match.winner) return;

    this.io.to(matchId).emit(ServerEvent.MatchForfeit, { winner: match.winner });
    logger.info({ matchId, winner: match.winner, reason: 'disconnect_timeout' }, 'match.forfeited');
  }

  private async handleCreate(socket: Socket, playerId: string, playerName: string, mode: MatchMode = PVP, bestOf = 3, moveTimeoutMs = 5000): Promise<void> {
    try {
      const match = await this.matchService.create({ id: playerId, name: playerName, socketId: socket.id }, mode, bestOf, moveTimeoutMs);
      socket.join(match.id);
      socket.emit(ServerEvent.MatchCreated, { matchId: match.id });
      logger.info({ matchId: match.id, playerName, mode }, 'match.created');

      const started = await this.botService.afterMatchCreated(match);
      if (started) {
        socket.emit(ServerEvent.GameState, buildGameState(started));
      }
    } catch (err) {
      this.emitError(socket, 'CREATE_FAILED', err);
    }
  }

  private async handleJoin(socket: Socket, playerId: string, matchId: string, playerName: string): Promise<void> {
    try {
      const existing = await this.matchService.get(matchId);

      if (existing?.disconnectedPlayer === playerId) {
        const match = await this.matchService.reconnect(matchId, playerId, socket.id);
        socket.join(matchId);
        socket.emit(ServerEvent.GameState, buildGameState(match));
        socket.to(matchId).emit(ServerEvent.PlayerReconnected, { playerName });
        return;
      }

      const match = await this.matchService.join(matchId, { id: playerId, name: playerName, socketId: socket.id });
      socket.join(matchId);
      this.io.to(matchId).emit(ServerEvent.MatchJoined, {
        matchId,
        players: match.players.map((p) => ({ id: p!.id, name: p!.name })),
      });
      this.io.to(matchId).emit(ServerEvent.GameState, buildGameState(match));
      logger.info(
        { matchId, players: match.players.map((p) => p!.name) },
        'match.started',
      );
    } catch (err) {
      this.emitError(socket, 'JOIN_FAILED', err);
    }
  }

  private async handleMove(socket: Socket, playerId: string, matchId: string, move: Move): Promise<void> {
    try {
      const { match, resolved } = await this.gameService.submitMove(matchId, playerId, move);
      logger.info({ matchId, playerId }, 'player.moved');
      this.io.to(matchId).emit(ServerEvent.GameState, buildGameState(match));
      if (resolved) {
        this.io.to(matchId).emit(ServerEvent.GameResult, buildMatchResult(match));
        const round = match.rounds[match.rounds.length - 1];
        logger.info(
          { matchId, result: round.winner, moves: match.moves },
          'match.resolved',
        );
      }
    } catch (err) {
      this.emitError(socket, 'MOVE_FAILED', err);
    }
  }

  private async handleRematch(socket: Socket, playerId: string, matchId: string): Promise<void> {
    try {
      const result = await this.gameService.requestRematch(matchId, playerId);
      const botResult = await this.botService.afterRematchRequested(matchId);
      const { match, ready } = botResult ?? result;

      if (ready) {
        this.io.to(matchId).emit(ServerEvent.GameRematchReady, { matchId });
        this.io.to(matchId).emit(ServerEvent.GameState, buildGameState(match));
      }
    } catch (err) {
      this.emitError(socket, 'REMATCH_FAILED', err);
    }
  }

  private async handleLeave(socket: Socket, playerId: string, matchId: string): Promise<void> {
    try {
      const before = await this.matchService.get(matchId);
      if (!before) {
        socket.leave(matchId);
        return;
      }
      const wasEnded = before.state === ENDED;
      const match = await this.matchService.leave(matchId, playerId);
      socket.leave(matchId);
      if (!wasEnded && match.state === ENDED && match.winner) {
        socket.to(matchId).emit(ServerEvent.MatchForfeit, { winner: match.winner });
        logger.info({ matchId, winner: match.winner, reason: 'leave' }, 'match.forfeited');
      }
    } catch (err) {
      this.emitError(socket, 'LEAVE_FAILED', err);
    }
  }

  private async handleAutoReconnect(socket: Socket, playerId: string): Promise<void> {
    const all = await this.matchService.getAll();
    const match = all.find((m) => m.disconnectedPlayer === playerId && m.state !== ENDED);
    if (!match) return;

    await this.matchService.reconnect(match.id, playerId, socket.id);
    socket.join(match.id);
    const playerName = match.players.find((p) => p?.id === playerId)?.name ?? 'Unknown';
    socket.emit(ServerEvent.GameState, buildGameState(match));
    socket.to(match.id).emit(ServerEvent.PlayerReconnected, { playerName });
  }

  private async handleDisconnect(playerId: string): Promise<void> {
    const socketId = this.socketsByPlayerId.get(playerId);
    if (!socketId) return;
    this.socketsByPlayerId.delete(playerId);

    const matches = await this.findMatchForPlayer(playerId);
    if (!matches) return;

    const match = await this.matchService.disconnect(matches.id, playerId);
    if (!match) return;

    const disconnectedPlayer = match.players.find((p) => p?.id === playerId);
    this.io.to(matches.id).emit(ServerEvent.PlayerDisconnected, {
      playerName: disconnectedPlayer?.name ?? 'Unknown',
      timeoutMs: config.timer.reconnectTimeoutMs,
    });
    logger.info({ matchId: matches.id, playerId, phase: match.state }, 'player.disconnected');
  }

  private async findMatchForPlayer(playerId: string): Promise<{ id: string } | null> {
    const all = await this.matchService.getAll();
    const match = all.find(
      (m) => m.state !== ENDED && m.players.some((p) => p?.id === playerId),
    );
    return match ? { id: match.id } : null;
  }

  private emitError(socket: Socket, code: string, err: unknown): void {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const payload: ErrorPayload = { code, message };
    socket.emit(ServerEvent.Error, payload);
    logger.error({ code, socketId: socket.id, message }, 'error');
  }
}
