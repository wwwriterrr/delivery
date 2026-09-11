import { useCallback, useEffect, useRef, useState } from "react";
import { fetchBalance } from "../services/cdekApi";
import type { Balance } from "../services/cdekApi";
import { isAbortError } from "../services/http";

/**
 * `unknown` until the backend answers. Callers must not collapse it into a
 * boolean early: guessing "authenticated" makes the price flip from coins to
 * roubles and pops the consent checkbox in after first paint.
 */
export type SessionStatus = "unknown" | "authenticated" | "guest";

export interface Session {
  status: SessionStatus;
  /** Present only for an authenticated reader. */
  balance: Balance | null;
  /**
   * Re-reads the balance. Cheap to call repeatedly — a pending read is
   * aborted before the next one starts.
   */
  refresh: () => void;
  /** True while a re-read is in flight, so the amount can be shown as stale. */
  checking: boolean;
}

interface SessionState {
  status: SessionStatus;
  balance: Balance | null;
}

/**
 * The balance endpoint answers only for a valid session, so one request
 * settles both questions: who the reader is, and what they can afford.
 */
export function useSession(): Session {
  const [state, setState] = useState<SessionState>({ status: "unknown", balance: null });
  const [checking, setChecking] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const read = useCallback((initial: boolean) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setChecking(true);

    fetchBalance(controller.signal)
      .then((balance) => {
        setState({ status: "authenticated", balance });
        setChecking(false);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        // On the first read any failure — 403 or offline — means we treat the
        // visitor as a guest. A later re-read keeps whatever we already know:
        // a network blip must not drop a signed-in reader into the guest flow
        // halfway through the form, and a genuinely expired session surfaces
        // at submit with a message that says so.
        if (initial) setState({ status: "guest", balance: null });
        setChecking(false);
      });
  }, []);

  useEffect(() => {
    read(true);
    return () => controllerRef.current?.abort();
  }, [read]);

  const refresh = useCallback(() => read(false), [read]);

  return { ...state, refresh, checking };
}
