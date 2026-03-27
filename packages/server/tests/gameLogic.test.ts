import { describe, it, expect } from 'vitest';
import { ROCK, PAPER, SCISSORS } from '@rps/shared';
import type { Move } from '@rps/shared';
import { resolveRound } from '../src/game/gameLogic';

describe('resolveRound', () => {
  describe('decisive outcomes', () => {
    const cases: [Move, Move, number][] = [
      [ROCK, SCISSORS, 0],
      [SCISSORS, PAPER, 0],
      [PAPER, ROCK, 0],
      [SCISSORS, ROCK, 1],
      [PAPER, SCISSORS, 1],
      [ROCK, PAPER, 1],
    ];

    it.each(cases)('%s vs %s → player %i wins', (m1, m2, expected) => {
      const result = resolveRound(m1, m2);
      expect(result.winner).toBe(expected);
      expect(result.moves).toEqual([m1, m2]);
    });
  });

  describe('draws', () => {
    const draws: Move[] = [ROCK, PAPER, SCISSORS];

    it.each(draws)('%s vs %s → draw', (move) => {
      const result = resolveRound(move, move);
      expect(result.winner).toBeNull();
      expect(result.moves).toEqual([move, move]);
    });
  });

  describe('null moves (timeout)', () => {
    it('both null → draw', () => {
      const result = resolveRound(null, null);
      expect(result.winner).toBeNull();
      expect(result.moves).toEqual([null, null]);
    });

    it('player 1 moved, player 2 null → player 1 wins', () => {
      const result = resolveRound(ROCK, null);
      expect(result.winner).toBe(0);
      expect(result.moves).toEqual([ROCK, null]);
    });

    it('player 1 null, player 2 moved → player 2 wins', () => {
      const result = resolveRound(null, PAPER);
      expect(result.winner).toBe(1);
      expect(result.moves).toEqual([null, PAPER]);
    });
  });

  describe('return shape', () => {
    it('always returns { moves, winner }', () => {
      const result = resolveRound(ROCK, PAPER);
      expect(result).toHaveProperty('moves');
      expect(result).toHaveProperty('winner');
      expect(Object.keys(result)).toHaveLength(2);
    });
  });
});
