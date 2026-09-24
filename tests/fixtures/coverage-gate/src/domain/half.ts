// Fixture (T-13): a "domain" file that is deliberately mostly untested, so the coverage gate
// has something to reject. See tests/unit/coverage-gate.test.ts.
export function covered(): number {
  return 1;
}

export function uncoveredOne(): number {
  return 2;
}

export function uncoveredTwo(): number {
  return 3;
}
