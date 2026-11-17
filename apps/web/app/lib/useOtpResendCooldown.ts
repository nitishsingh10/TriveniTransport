'use client';

import { useCallback, useEffect, useState } from 'react';

export function useOtpResendCooldown(durationSeconds = 30) {
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const timeout = setTimeout(() => {
      setSecondsRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [secondsRemaining]);

  const start = useCallback(() => setSecondsRemaining(durationSeconds), [durationSeconds]);
  const reset = useCallback(() => setSecondsRemaining(0), []);

  return { secondsRemaining, start, reset };
}
