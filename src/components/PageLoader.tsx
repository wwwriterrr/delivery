interface Props {
  text?: string;
  compact?: boolean;
}

export function PageLoader({ text = "Загрузка...", compact = false }: Props) {
  return (
    <div
      className="loading-overlay"
      style={compact ? { minHeight: "200px" } : undefined}
      role="status"
      aria-live="polite"
    >
      <div className="spinner" />
      <div className="loading-overlay__text">{text}</div>
    </div>
  );
}
