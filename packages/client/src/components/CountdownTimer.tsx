interface CountdownTimerProps {
  timeoutAt: number | null;
}

export const CountdownTimer = ({ timeoutAt }: CountdownTimerProps) => {
  if (!timeoutAt) return null;
  const remaining = Math.max(0, Math.ceil((timeoutAt - Date.now()) / 1000));
  return <div>{remaining}s</div>;
};
