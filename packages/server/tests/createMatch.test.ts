import { describe, it, expect } from 'vitest';
import { WAITING, PVP, COMPUTER } from '@rps/shared';
import type { Player } from '@rps/shared';
import type { Match } from '../src/models/Match.interface';
import { createMatch, playerIndex } from '../src/models/createMatch';

const player: Player = { id: 'p1', name: 'Alice', socketId: 's1' };

describe('createMatch', () => {
  it('creates a match in WAITING state with one player', () => {
    const match = createMatch('m-1', player);

    expect(match.id).toBe('m-1');
    expect(match.state).toBe(WAITING);
    expect(match.players[0]).toEqual(player);
    expect(match.players[1]).toBeNull();
  });

  it('initializes scores to [0, 0]', () => {
    const match = createMatch('m-1', player);
    expect(match.scores).toEqual([0, 0]);
  });

  it('initializes moves to [null, null]', () => {
    const match = createMatch('m-1', player);
    expect(match.moves).toEqual([null, null]);
  });

  it('initializes empty rounds', () => {
    const match = createMatch('m-1', player);
    expect(match.rounds).toEqual([]);
  });

  it('initializes rematchRequested to [false, false]', () => {
    const match = createMatch('m-1', player);
    expect(match.rematchRequested).toEqual([false, false]);
  });

  it('initializes nullable fields to null', () => {
    const match = createMatch('m-1', player);
    expect(match.timeoutAt).toBeNull();
    expect(match.disconnectedPlayer).toBeNull();
    expect(match.winner).toBeNull();
  });

  it('defaults mode to PVP', () => {
    const match = createMatch('m-1', player);
    expect(match.mode).toBe(PVP);
  });

  it('accepts explicit mode', () => {
    const match = createMatch('m-1', player, COMPUTER);
    expect(match.mode).toBe(COMPUTER);
  });
});

describe('playerIndex', () => {
  const match: Match = {
    id: 'm-1',
    mode: PVP,
    players: [
      { id: 'p1', name: 'Alice', socketId: 's1' },
      { id: 'p2', name: 'Bob', socketId: 's2' },
    ],
    state: WAITING,
    rounds: [],
    scores: [0, 0],
    moves: [null, null],
    timeoutAt: null,
    disconnectedPlayer: null,
    rematchRequested: [false, false],
    winner: null,
  };

  it('returns 0 for player 1', () => {
    expect(playerIndex(match, 'p1')).toBe(0);
  });

  it('returns 1 for player 2', () => {
    expect(playerIndex(match, 'p2')).toBe(1);
  });

  it('throws for unknown player', () => {
    expect(() => playerIndex(match, 'unknown')).toThrow('Player not in match');
  });

  it('throws when player 2 is null and queried', () => {
    const waitingMatch: Match = { ...match, players: [match.players[0], null] };
    expect(() => playerIndex(waitingMatch, 'p2')).toThrow('Player not in match');
  });
});
