/** Reject empty/malformed coordinate tokens rather than Number('') -> 0. */
export function parseBounds(
  value: string | null,
): [number, number, number, number] | null {
  if (!value) return null;
  const tokens = value.split(",");
  if (tokens.length !== 4 || tokens.some((t) => !t.trim())) return null;
  const b = tokens.map(Number);
  if (
    b.some((x) => !Number.isFinite(x)) ||
    b[0] < -180 ||
    b[2] > 180 ||
    b[1] < -90 ||
    b[3] > 90 ||
    b[0] >= b[2] ||
    b[1] >= b[3]
  )
    return null;
  return b as [number, number, number, number];
}
