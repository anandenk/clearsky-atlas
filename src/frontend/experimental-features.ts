/**
 * Local developer opt-in: load /?geography=1 to expose linked geography.
 * Read once after mount; reload after changing the URL. No persisted preference
 * or public menu entry. Ordinary multi-place evidence stays available.
 *
 * Backlog: public linked geography remains deferred until its entry/exit flow
 * has a coherent interaction design, user review and desktop acceptance checks.
 */
export function geographyEnabled(search: string): boolean {
  return new URLSearchParams(search).get("geography") === "1";
}
