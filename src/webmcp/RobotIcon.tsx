/**
 * The agent-tools icon (design changelog §37): a robot head with eyes, a mouth and an antenna,
 * drawn for the design (`robot()` in the design export) — it has no icon-set name. 24 px,
 * decorative; the indicator carries the name.
 */
export function RobotIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="24"
      height="24"
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M64,72H192a24,24,0,0,1,24,24v88a24,24,0,0,1-24,24H64a24,24,0,0,1-24-24V96A24,24,0,0,1,64,72Zm4,16a12,12,0,0,0-12,12v80a12,12,0,0,0,12,12H188a12,12,0,0,0,12-12V100a12,12,0,0,0-12-12Z"
      />
      <circle cx="100" cy="132" r="14" />
      <circle cx="156" cy="132" r="14" />
      <rect x="100" y="162" width="56" height="12" rx="6" />
      <rect x="122" y="36" width="12" height="40" rx="6" />
      <circle cx="128" cy="32" r="12" />
    </svg>
  );
}
