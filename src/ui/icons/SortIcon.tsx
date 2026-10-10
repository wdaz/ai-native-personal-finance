/**
 * Phosphor "sort-ascending", fill weight (github.com/phosphor-icons/core,
 * assets/fill/sort-ascending-fill.svg, MIT licence). SPEC-transactions 2.6: the mobile Sort
 * trigger; the style guide's "sort" has no Phosphor file of that name, so the nearest fill glyph
 * is used (T-19 plan Q1 (a), pending the designer's check). Decorative: the control carries the
 * name.
 */
export function SortIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="20"
      height="20"
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,72h96a8,8,0,0,1,0,16H72a8,8,0,0,1,0-16Zm40,112H72a8,8,0,0,1,0-16h40a8,8,0,0,1,0,16Zm8-48H72a8,8,0,0,1,0-16h48a8,8,0,0,1,0,16Zm77.66,29.66-24,24a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L160,164.69V120a8,8,0,0,1,16,0v44.69l10.34-10.35a8,8,0,0,1,11.32,11.32Z" />
    </svg>
  );
}
