// Single source of truth for site-wide year references.
// `founded` is fixed (founding year, never changes).
// `currentYear` is computed at render time so the copyright auto-rolls every January.

export const FOUNDED_YEAR = 2026;

export function currentYear(): number {
  return new Date().getFullYear();
}

// Convenience helper for "© 2026" or "© 2026, 2027" once we cross a year boundary.
export function copyrightYears(): string {
  const y = currentYear();
  return y === FOUNDED_YEAR ? `${FOUNDED_YEAR}` : `${FOUNDED_YEAR}, ${y}`;
}
