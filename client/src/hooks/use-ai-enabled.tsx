// Hook that tells the UI whether AI features are available. Backed by the
// /api/ai-status endpoint which reads process.env.AI_DISABLED at request time.
//
// While the check is in flight we assume AI is enabled (optimistic) so the
// first render doesn't flash a "disabled" state on happy-path loads. The
// endpoint is cheap and cached for 60s so this costs effectively nothing.

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type AIStatus = {
  enabled: boolean;
  loaded: boolean;
};

const AIStatusContext = createContext<AIStatus>({ enabled: true, loaded: false });

export function AIStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AIStatus>({ enabled: true, loaded: false });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai-status", { method: "GET" })
      .then((r) => (r.ok ? r.json() : { enabled: true }))
      .then((data: { enabled?: boolean }) => {
        if (cancelled) return;
        setStatus({ enabled: data.enabled !== false, loaded: true });
      })
      .catch(() => {
        // If the status endpoint fails, assume AI is on (fail-open for UX);
        // the individual function will still 503 if actually disabled.
        if (!cancelled) setStatus({ enabled: true, loaded: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <AIStatusContext.Provider value={status}>{children}</AIStatusContext.Provider>;
}

export function useAIEnabled(): boolean {
  return useContext(AIStatusContext).enabled;
}

export function useAIStatus(): AIStatus {
  return useContext(AIStatusContext);
}
