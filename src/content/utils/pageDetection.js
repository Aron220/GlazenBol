const HOMEPAGE_PATHS = new Set(["/nl/nl", "/nl/nl/"]);

export function isBolHomepage() {
  const path = (window.location.pathname || "").toLowerCase();
  return HOMEPAGE_PATHS.has(path);
}
