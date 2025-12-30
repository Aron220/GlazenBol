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
    id: "filter-verkoop-door-bol",
    label: "Verkoop door Bol",
    description: "",
    enabled: false
  }
];
