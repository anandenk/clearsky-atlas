export type MapView = "city" | "landscape";

// A full zoom-level gap keeps trackpad movement near the boundary stable.
export function automaticView(zoom: number, previous: MapView): MapView {
  if (zoom >= 12) return "city";
  if (zoom <= 11) return "landscape";
  return previous;
}
