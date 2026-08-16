/**
 * scrollIntoView with an explicit `behavior: "smooth"` ignores the reduced-motion
 * CSS override, so the preference is checked here instead.
 */
export function scrollIntoView(
  element: Element | null | undefined,
  block: ScrollLogicalPosition = "start"
): void {
  if (!element) return;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block });
}
