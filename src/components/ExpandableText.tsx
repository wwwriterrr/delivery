import { useEffect, useId, useRef, useState } from "react";
import "./ExpandableText.css";

interface Props {
  text: string;
  /** How many lines to show while collapsed. */
  lines?: number;
  className?: string;
}

/**
 * Collapses long prose behind a "Читать далее" toggle.
 *
 * Whether the text is "too long" is decided by measuring the rendered box, not
 * by counting characters: the same blurb runs five lines on a desktop and
 * eleven on a phone, so any character threshold would either clamp text that
 * fits or leave a wall of text on narrow screens.
 */
export function ExpandableText({ text, lines = 5, className = "" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    // Only measurable while clamped; once expanded we keep the toggle so the
    // reader can always collapse it again.
    if (!el || expanded) return;

    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();

    // Re-measure on reflow, and again once the webfont swaps in — both change
    // where the text breaks.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    document.fonts?.ready.then(measure).catch(() => {});

    return () => observer.disconnect();
  }, [expanded, text, lines]);

  return (
    <div className="expandable-text">
      <div
        ref={ref}
        id={id}
        className={`expandable-text__body ${className} ${expanded ? "" : "expandable-text__body--clamped"}`}
        style={{ "--expandable-lines": lines } as React.CSSProperties}
      >
        {text}
      </div>

      {(overflows || expanded) && (
        <button
          className="expandable-text__toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Свернуть" : "Читать далее"}
        </button>
      )}
    </div>
  );
}
