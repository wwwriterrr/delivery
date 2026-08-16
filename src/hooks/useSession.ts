import { useEffect, useState } from "react";
import { verifySession } from "../services/cdekApi";
import { isAbortError } from "../services/http";

/**
 * `unknown` until the backend answers. Callers must not collapse it into a
 * boolean early: guessing "authenticated" makes the price flip from coins to
 * roubles and pops the consent checkbox in after first paint.
 */
export type SessionState = "unknown" | "authenticated" | "guest";

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>("unknown");

  useEffect(() => {
    const controller = new AbortController();

    verifySession(controller.signal)
      .then(() => setState("authenticated"))
      .catch((err: unknown) => {
        // Any failure — 403 or offline — means we treat the visitor as a guest.
        if (!isAbortError(err)) setState("guest");
      });

    return () => controller.abort();
  }, []);

  return state;
}
