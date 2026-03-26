import { ErrorPayload } from '@rps/shared';

export interface LobbyViewProps {
  isWaiting: boolean;
  matchId: string | null;
  error: ErrorPayload | null;
  bestOf: number;
  onBestOfChange: (value: number) => void;
  onCreate: (name: string) => void;
  onPlayComputer: (name: string) => void;
  onJoin: (matchId: string, name: string) => void;
  onCopy: () => void;
}
