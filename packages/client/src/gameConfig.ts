import { Move } from '@rps/shared';

export const gameConfig = {
  title: 'Rock Paper Scissors',

  lobby: {
    namePlaceholder: 'Your name',
    matchIdPlaceholder: 'Match ID',
    createHeading: 'Create Match',
    joinHeading: 'Join Match',
    createButton: 'Create',
    joinButton: 'Join',
    copyButton: 'Copy',
    vsComputerButton: 'Play vs Computer',
    waitingHeading: 'Waiting for opponent...',
    waitingSubtext: 'Share this code with your opponent:',
    bestOfLabel: 'Best of',
    bestOfOptions: [5, 10, 15] as readonly number[],
  },

  game: {
    moveTimeoutMs: 10000,
    disconnectedBanner: 'Opponent disconnected — waiting for reconnect...',
    waitingForOpponent: (move: string) => `You chose ${move} — waiting for opponent...`,
    deciderRoundLabel: '⚔️ Tie breaker!',
  },

  result: {
    roundDraw: 'Draw!',
    roundWin: 'You win this round!',
    roundLose: 'You lose this round.',
    matchWin: 'You won the match!',
    matchLose: 'You lost the match.',
    forfeitNote: 'Opponent forfeited.',
    movesFallback: 'timeout',
    rematchButton: 'Next Round',
    leaveButton: 'Leave',
    backToLobbyButton: 'Back to Lobby',
  },

  player: {
    youTag: ' (you)',
    movedIndicator: 'Moved ✓',
  },

  moveLabels: {
    rock: 'Rock',
    paper: 'Paper',
    scissors: 'Scissors',
  } satisfies Record<Move, string>,

  moveEmojis: {
    rock: '✊',
    paper: '✋',
    scissors: '✌️',
  } satisfies Record<Move, string>,
} as const;
