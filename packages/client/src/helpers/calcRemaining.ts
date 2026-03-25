export const calcRemaining = (timeoutAt: number) =>
  Math.max(0, Math.ceil((timeoutAt - Date.now()) / 1000));
