import { useEffect, useState } from "react";
import "./QuantityPicker.css";

interface Props {
  value: number;
  onChange: (value: number) => void;
  max: number;
  min?: number;
  id?: string;
  /** The control carries no visible label, so assistive tech gets this one. */
  label?: string;
}

/**
 * A quantity the reader can either type or step through.
 *
 * The typed text lives in its own state while the field is being edited:
 * clamping every keystroke straight into `value` would make a cleared field
 * snap back to 1 before the reader has typed the new number. An empty field is
 * therefore tolerated mid-edit and resolved on blur, while leading zeros are
 * dropped outright — that is what keeps a bare "0" from ever being a quantity.
 */
export function QuantityPicker({
  value,
  onChange,
  max,
  min = 1,
  id,
  label = "Количество книг",
}: Props) {
  const [draft, setDraft] = useState(String(value));

  // The steppers — and anything else that moves `value` — own the field
  // whenever it is not being typed into.
  useEffect(() => setDraft(String(value)), [value]);

  const handleInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "").replace(/^0+/, "");

    if (!digits) {
      setDraft("");
      return;
    }

    const next = Math.min(Number(digits), max);
    // Echo the clamped number rather than what was typed, so a "25" cannot sit
    // in the field while the order is really for 20.
    setDraft(String(next));
    onChange(next);
  };

  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));

  return (
    <div className="quantity-picker">
      <button
        className="quantity-picker__step"
        type="button"
        onClick={() => step(-1)}
        disabled={value <= min}
        aria-label="Уменьшить количество"
      >
        −
      </button>

      <input
        id={id}
        className="quantity-picker__input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        value={draft}
        onChange={(e) => handleInput(e.target.value)}
        onBlur={() => setDraft(String(value))}
      />

      <button
        className="quantity-picker__step"
        type="button"
        onClick={() => step(1)}
        disabled={value >= max}
        aria-label="Увеличить количество"
      >
        +
      </button>
    </div>
  );
}
