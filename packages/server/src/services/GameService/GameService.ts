import { Move, ENDED, PLAYING, RESOLVED } from '@rps/shared';
import { resolveRound } from '../../game/gameLogic';
import { Match } from '../../models/Match.interface';
import { MatchCallbacks } from '../../gateway/SocketGateway/MatchCallbacks.interface';
import { MatchStore } from '../../store/MatchStore.interface';
import { playerIndex } from '../../models/createMatch';

export class GameService {
  private moveTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly store: MatchStore,
    private readonly callbacks: MatchCallbacks,
  ) {}

  async startRound(matchId: string): Promise<Match> {
    const match = await this.getOrThrow(matchId);
    match.state = PLAYING;
    match.moves = [null, null];
    match.rematchRequested = [false, false];
    match.winner = null;
    match.timeoutAt = Date.now() + match.moveTimeoutMs;

    await this.store.set(matchId, match);
    this.startMoveTimer(match);
    return match;
  }

  async submitMove(matchId: string, playerId: string, move: Move): Promise<{ match: Match; resolved: boolean }> {
    const match = await this.getOrThrow(matchId);
    if (match.state !== PLAYING) throw new Error('Match is not in playing state');

    const idx = playerIndex(match, playerId);
    if (match.moves[idx] !== null) throw new Error('Move already submitted');

    match.moves[idx] = move;

    const bothMoved = match.moves[0] !== null && match.moves[1] !== null;
    if (bothMoved) {
      this.clearMoveTimer(matchId);
      resolveCurrentRound(match);
    }

    await this.store.set(matchId, match);
    return { match, resolved: bothMoved };
  }

  async requestRematch(matchId: string, playerId: string): Promise<{ match: Match; ready: boolean }> {
    const match = await this.getOrThrow(matchId);
    if (match.state !== RESOLVED) throw new Error('Match is not in resolved state');

    const idx = playerIndex(match, playerId);
    match.rematchRequested[idx] = true;

    const ready = match.rematchRequested[0] && match.rematchRequested[1];
    if (ready) {
      await this.store.set(matchId, match);
      return { match: await this.startRound(matchId), ready };
    }

    await this.store.set(matchId, match);
    return { match, ready };
  }

  async forfeit(matchId: string, loserId: string): Promise<Match> {
    const match = await this.getOrThrow(matchId);
    this.clearMoveTimer(matchId);

    const opponentIdx = playerIndex(match, loserId) === 0 ? 1 : 0;
    match.state = ENDED;
    match.winner = match.players[opponentIdx]!.id;
    match.timeoutAt = null;

    await this.store.set(matchId, match);
    return match;
  }

  clearMoveTimer(matchId: string): void {
    const timer = this.moveTimers.get(matchId);
    if (!timer) return;
    clearTimeout(timer);
    this.moveTimers.delete(matchId);
  }

  private startMoveTimer(match: Match): void {
    this.clearMoveTimer(match.id);
    const timer = setTimeout(() => this.onMoveTimeout(match.id), match.moveTimeoutMs);
    this.moveTimers.set(match.id, timer);
  }

  private async onMoveTimeout(matchId: string): Promise<void> {
    this.moveTimers.delete(matchId);
    const match = await this.store.get(matchId);
    if (!match || match.state !== PLAYING) return;

    resolveCurrentRound(match);
    await this.store.set(matchId, match);
    this.callbacks.onRoundResolved(matchId);
  }

  private async getOrThrow(matchId: string): Promise<Match> {
    const match = await this.store.get(matchId);
    if (!match) throw new Error('Match not found');
    return match;
  }
}

function resolveCurrentRound(match: Match): void {
  const round = resolveRound(match.moves[0], match.moves[1]);
  match.rounds.push(round);
  if (round.winner !== null) match.scores[round.winner] += 1;

  const [s0, s1] = match.scores;
  const majority = Math.ceil(match.bestOf / 2);

  const hasWinner = s0 >= majority || s1 >= majority;

  if (hasWinner) {
    const winnerIdx = s0 > s1 ? 0 : 1;
    match.state = ENDED;
    match.winner = match.players[winnerIdx]!.id;
  } else {
    match.state = RESOLVED;
  }

  match.moves = [null, null];
  match.timeoutAt = null;
}
