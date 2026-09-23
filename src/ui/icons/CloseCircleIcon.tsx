/**
 * The close control of the Claude Design prototype's modals (`closeCircle`, drawn inline in
 * `Finance App.dc.html`; it is not one of the Figma file's 27 icons) — reused for the reset
 * banner's dismiss button, which no design covers (T-08 plan Q2 (d)). Decorative; the button
 * carries the name.
 */
export function CloseCircleIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="12.25" />
      <path d="M12 12l8 8M20 12l-8 8" />
    </svg>
  );
}
