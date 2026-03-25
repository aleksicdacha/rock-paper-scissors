import { WAITING, PLAYING, RESOLVED, ENDED } from '@rps/shared';
import type { MatchState } from '@rps/shared';
import { Phase } from './GameStore.types';
import {
  PHASE_WAITING,
  PHASE_PLAYING,
  PHASE_RESOLVED,
  PHASE_FINISHED,
} from './GameStore.consts';

const PHASE_MAP = {
  [WAITING]: PHASE_WAITING,
  [PLAYING]: PHASE_PLAYING,
  [RESOLVED]: PHASE_RESOLVED,
  [ENDED]: PHASE_FINISHED,
} as const satisfies Record<string, Phase>;

export function phaseFromMatchState(state: MatchState, finished: boolean): Phase {
  if (finished) return PHASE_FINISHED;
  return PHASE_MAP[state];
}
