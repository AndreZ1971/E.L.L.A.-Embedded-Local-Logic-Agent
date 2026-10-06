import { useState, useEffect, useCallback } from "react";
import { gestureEngine } from "../services/gestureEngine";

export function useGestures() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await gestureEngine.start();
      setEnabled(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gestensteuerung nicht verfügbar",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(() => {
    gestureEngine.stop();
    setEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    if (gestureEngine.running) disable();
    else void enable();
  }, [enable, disable]);

  useEffect(() => {
    return () => {
      if (gestureEngine.running) gestureEngine.stop();
    };
  }, []);

  return { enabled, loading, error, enable, disable, toggle };
}
