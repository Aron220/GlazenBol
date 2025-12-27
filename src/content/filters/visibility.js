export const MERKLOOS_HIDDEN_ATTR = "data-bolfilter-hidden-merkloos";
export const SPONSORED_HIDDEN_ATTR = "data-bolfilter-hidden-gesponsord";
export const GENERAL_AD_HIDDEN_ATTR = "data-bolfilter-hidden-general-ad";
export const VERKOOP_DOOR_BOL_HIDDEN_ATTR = "data-bolfilter-hidden-verkoop-door-bol";

const ALL_MARKERS = [
  MERKLOOS_HIDDEN_ATTR,
  SPONSORED_HIDDEN_ATTR,
  GENERAL_AD_HIDDEN_ATTR,
  VERKOOP_DOOR_BOL_HIDDEN_ATTR
];

function applyVisibility(listingEl) {
  if (listingEl === document.body || listingEl === document.documentElement) return;
  const isHidden = ALL_MARKERS.some((attr) => listingEl.getAttribute(attr) === "true");
  listingEl.style.display = isHidden ? "none" : "";
}

export function markHidden(listingEl, markerAttr) {
  if (listingEl.getAttribute(markerAttr) === "true") return;
  listingEl.setAttribute(markerAttr, "true");
  applyVisibility(listingEl);
}

export function unmarkHidden(listingEl, markerAttr) {
  if (listingEl.getAttribute(markerAttr) !== "true") return;
  listingEl.removeAttribute(markerAttr);
  applyVisibility(listingEl);
}
