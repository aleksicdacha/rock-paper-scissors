import { useEffect, useState } from 'react';
import { CountdownTimerProps } from './CountdownTimerProps.interface';
import { TICK_INTERVAL } from './CountdownTimer.consts';
import { calcRemaining } from './calcRemaining';

export const CountdownTimer = ({ timeoutAt }: CountdownTimerProps) => {
  const [seconds, setSeconds] = useState(() =>
    timeoutAt ? calcRemaining(timeoutAt) : 0,
  );

  useEffect(() => {
    if (!timeoutAt) {
      setSeconds(0);
      return;
    }

    setSeconds(calcRemaining(timeoutAt));

    const id = setInterval(() => {
      const remaining = calcRemaining(timeoutAt);
      setSeconds(remaining);
      if (remaining <= 0) clearInterval(id);
    }, TICK_INTERVAL);

    return () => clearInterval(id);
  }, [timeoutAt]);

  if (!timeoutAt || seconds <= 0) return null;

  const isUrgent = seconds <= 3;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">Time left</span>
      <span className={`text-5xl font-black tabular-nums transition-colors ${
        isUrgent ? 'text-red-400 animate-[countdown-pulse_0.5s_ease-in-out_infinite]' : 'text-white'
      }`}>
        {seconds}
      </span>
    </div>
  );
};
