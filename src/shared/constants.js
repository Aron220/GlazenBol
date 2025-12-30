export const EXTENSION_NAME = "GlazenBol";
export const TOGGLE_STATE_KEY = "glazenBolToggleState";
export const SORT_PREFERENCE_KEY = "glazenBolSortPreference";
export const WELCOME_SEEN_KEY = "glazenBolWelcomeSeen";
export const PANEL_COLLAPSED_KEY = "glazenBolPanelCollapsed";

export const SORT_OPTIONS = [
  { value: "", label: "Geen voorkeur" },
  { value: "RELEVANCE", label: "Relevantie" },
  { value: "POPULARITY", label: "Populariteit" },
  { value: "PRICE_ASC", label: "Prijs laag - hoog" },
  { value: "PRICE_DESC", label: "Prijs hoog - laag" },
  { value: "RELEASE_DATE", label: "Verschijningsdatum" },
  { value: "RATING", label: "Beoordeling" },
  { value: "WISHLIST", label: "Meest gewild" }
];

export const DEFAULT_TOGGLES = [
  {
    id: "filter-merkloos",
    label: "Merkloze producten wegfilteren",
    description: "",
    enabled: true
  },
  {
    id: "filter-gesponsord",
    label: "Gesponsorde producten wegfilteren",
    description: "",
    enabled: true
  },
  {
    id: "filter-general-ads",
    label: "Advertentieblokken wegfilteren",
    description: "",
    enabled: true
  },
  {
    id: "filter-goede-keuze",
    label: "Goede/Duurzame keuze volgens Bol",
    badgeSvg:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" focusable="false" aria-hidden="true">' +
      '<g clip-path="url(#clip0_289_726)">' +
      '<mask id="mask0_289_726" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">' +
      '<path d="M20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10Z" fill="white"></path>' +
      "</mask>" +
      '<g mask="url(#mask0_289_726)">' +
      '<path d="M20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10Z" fill="#1EADFF"></path>' +
      '<path d="M4.5 3.05001L4.5 1.30003C5.94012 0.470869 9.45 -0.409027 9.45 -0.409027V0.100007C9.45 1.70001 8 1.85003 7.6 1.85003C7.14723 1.85003 6.8 2.00003 6.8 2.95003C6.8 4.63003 4.50001 4.45003 4.5 3.05001Z" fill="#71E9B4"></path>' +
      '<path d="M10.6998 4.50001C8.79999 5.07822 8.58798 3.93767 9.09983 2.85001C9.49983 2.00001 10.6498 0.950006 11.6998 0.150006C11.8494 0.0244214 12.2849 -0.304627 12.3998 -0.399994L17.8998 1.85001L20.7498 9.25001C20.1929 9.47276 19.6142 9.31097 18.9998 9.50001C17.0498 10.1 15.8498 13.9573 13.8498 16.25C12.2541 18.0793 11.5998 16.6 11.1498 15.5C10.6998 14.4 11.1498 11 8.54979 10.6C6.24979 10.1 6.81365 7.74263 8.04982 7.70001C9.28599 7.65738 11.4735 7.64523 12.2998 6.75001C12.8998 6.10001 12.9998 3.80001 10.6998 4.50001Z" fill="#71E9B4"></path>' +
      "</g>" +
      '<path d="M10 20C15.5228 20 20 15.5229 20 10C20 4.47716 15.5228 0 10 0C4.47715 0 0 4.47716 0 10C0 15.5229 4.47715 20 10 20Z" fill="#1EADFF"></path>' +
      '<path d="M11.7363 0.150399C10.5226 0.91433 9.2 2.06282 8.82285 3.58031C8.71319 4.0234 8.97474 4.47909 9.41339 4.60505C9.61345 4.66285 9.90391 4.79845 10.2084 4.65248C11.0072 4.27088 12.4306 4.06193 12.5699 5.13855C12.7084 6.21516 12.8129 6.90944 10.7293 7.36069C8.64576 7.81193 7.1179 7.25621 6.97934 8.85372C6.84819 10.3608 8.33381 10.3468 9.02809 10.7632C9.51268 11.0536 10.3826 11.041 10.8234 13.8278C11.1969 16.19 11.7022 17.1517 12.8477 17.1517C13.3686 17.1517 15.8686 13.4366 16.9104 11.4575C17.8329 9.70435 19.0014 9.23161 19.9802 9.36424C19.689 4.7199 16.2287 0.935817 11.7363 0.149658V0.150399Z" fill="#71E9B4"></path>' +
      '<path d="M5.62543 4.16641C7.39633 3.99302 6.47754 2.42293 6.97176 2.02725C7.41633 1.67159 9.48139 1.97168 9.41396 0.0170288C7.56156 0.124468 5.84476 0.73502 4.3984 1.71457C4.36284 2.82601 4.52511 4.27385 5.62543 4.16567V4.16641Z" fill="#71E9B4"></path>' +
      "</g>" +
      '<defs><clipPath id="clip0_289_726"><rect width="20" height="20" fill="white"></rect></clipPath></defs>' +
      "</svg>",
    badgeAlt: "Goede Keuze label",
    enabled: false
  },
  {
    id: "filter-verkoop-door-bol",
    label: "Verkoop door Bol",
    description: "",
    enabled: false
  }
];
