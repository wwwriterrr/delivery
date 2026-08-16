import type { ReactNode } from "react";
import "./ErrorState.css";

interface Props {
  title?: string;
  message: string;
  /** Renders a "Попробовать снова" button. Omit when a retry cannot help. */
  onRetry?: () => void;
  /** Extra escape hatch, e.g. a link to the login page or back to the catalogue. */
  action?: ReactNode;
}

export function ErrorState({ title, message, onRetry, action }: Props) {
  return (
    <div className="error-state" role="alert">
      <svg
        className="error-state__icon"
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M24 13v14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="24" cy="34" r="1.8" fill="currentColor" />
      </svg>

      {title && <h2 className="error-state__title">{title}</h2>}
      <p className="error-state__message">{message}</p>

      {(onRetry || action) && (
        <div className="error-state__actions">
          {onRetry && (
            <button className="error-state__retry" type="button" onClick={onRetry}>
              Попробовать снова
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
