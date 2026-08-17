import type { ReactNode } from "react";
import { SUPPORT_EMAIL } from "../constants";
import "./ErrorState.css";

interface Props {
  title?: string;
  message: string;
  /**
   * A primary way out, when one exists — topping up a balance, for instance.
   * Deliberately not a "try again" button: a reader repeating a failed action
   * is guesswork, and support is the only path that actually resolves it.
   */
  action?: ReactNode;
}

export function ErrorState({ title, message, action }: Props) {
  return (
    <div className="error-state" role="alert">
      <svg
        className="error-state__icon"
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M24 13v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="34" r="1.8" fill="currentColor" />
      </svg>

      {title && <h2 className="error-state__title">{title}</h2>}
      <p className="error-state__message">{message}</p>

      {action && <div className="error-state__actions">{action}</div>}

      <p className="error-state__support">
        Напишите нам на{" "}
        <a className="error-state__mail" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>{" "}
        — поможем разобраться.
      </p>
    </div>
  );
}
