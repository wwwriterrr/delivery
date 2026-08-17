import { useEffect, useState } from "react";
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
}

/**
 * The balance endpoint answers only for a valid session, so one request
 * settles both questions: who the reader is, and what they can afford.
 */
export function useSession(): Session {
  const [session, setSession] = useState<Session>({ status: "unknown", balance: null });

  useEffect(() => {
    const controller = new AbortController();

    fetchBalance(controller.signal)
      .then((balance) => setSession({ status: "authenticated", balance }))
      .catch((err: unknown) => {
        // Any failure — 403 or offline — means we treat the visitor as a guest.
        if (!isAbortError(err)) setSession({ status: "guest", balance: null });
      });

    return () => controller.abort();
  }, []);

  return session;
}
