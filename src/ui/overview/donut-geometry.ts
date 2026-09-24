import type { Theme } from "@/src/shared/enums";

/** SPEC-overview §4.4: SVG 240 px, ring 24 px, flush with the canvas edge. */
export const DONUT_SIZE = 240;
export const DONUT_STROKE = 24;
export const DONUT_RADIUS = DONUT_SIZE / 2 - DONUT_STROKE / 2;

export type DonutSegment = { theme: Theme; strokeDasharray: string; strokeDashoffset: number };

/**
 * SPEC-overview §4.4: segments proportional to each item's `maximum`, clockwise from 12
 * o'clock, no gaps. `total` is the caller's own denominator (T-10 plan D3 — the DTO's
 * `budgets.limit`, all budgets, not necessarily the sum of `items`). An SVG `<circle>`
 * conventionally starts its stroke at 3 o'clock, so the ring itself is rotated -90deg in CSS;
 * this function only computes lengths and offsets along the circle's own circumference.
 */
export function donutSegments(
  items: readonly { theme: Theme; maximum: number }[],
  total: number,
): DonutSegment[] {
  const circumference = 2 * Math.PI * DONUT_RADIUS;
  let offset = 0;
  return items.map(({ theme, maximum }) => {
    const length = total > 0 ? (maximum / total) * circumference : 0;
    const segment: DonutSegment = {
      theme,
      strokeDasharray: `${length} ${circumference}`,
      strokeDashoffset: offset === 0 ? 0 : -offset,
    };
    offset += length;
    return segment;
  });
}
