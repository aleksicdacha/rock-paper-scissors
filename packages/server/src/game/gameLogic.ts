import { Move, RoundResult, WINS_OVER } from '@rps/shared';

function determineWinner(move1: Move | null, move2: Move | null): number | null {
  if (move1 === move2) return null;
  if (move1 === null) return 1;
  if (move2 === null) return 0;
  return WINS_OVER[move1] === move2 ? 0 : 1;
}

export function resolveRound(move1: Move | null, move2: Move | null): RoundResult {
  const winner = determineWinner(move1, move2);
  return { moves: [move1, move2], winner };
}
