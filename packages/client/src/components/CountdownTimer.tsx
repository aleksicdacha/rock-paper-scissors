import { useEffect, useState } from 'react';
import { CountdownTimerProps } from '../interfaces/CountdownTimerProps.interface';
import { TICK_INTERVAL } from '../consts';
import { calcRemaining } from '../helpers/calcRemaining';

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

  return <div>{seconds}s</div>;
};
