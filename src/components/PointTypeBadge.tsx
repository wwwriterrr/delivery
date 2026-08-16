import { POINT_KIND_LABEL, pointKind } from "../utils/points";
import "./PointTypeBadge.css";

interface Props {
  type: string | undefined;
}

/**
 * A staffed point is the norm and stays quiet; a postamat is the exception that
 * changes what the customer should expect on arrival — a locker, no counter, no
 * staff — so it is the one that gets filled emphasis.
 */
export function PointTypeBadge({ type }: Props) {
  const kind = pointKind(type);

  return (
    <span className={`point-badge point-badge--${kind}`}>
      <svg
        className="point-badge__icon"
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
      >
        {kind === "postamat" ? (
          <>
            <rect x="3.25" y="2.25" width="9.5" height="11.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M3.25 6.1h9.5M3.25 9.9h9.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10.6 4.2h.9M10.6 8h.9M10.6 11.8h.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M2.4 5.6 8 2.2l5.6 3.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M3.6 6.6v7.2h8.8V6.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M6.5 13.8V9.6h3v4.2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </>
        )}
      </svg>
      {POINT_KIND_LABEL[kind]}
    </span>
  );
}
