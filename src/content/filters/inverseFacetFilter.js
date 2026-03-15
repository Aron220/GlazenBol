import { TIMING } from "../utils/timing.js";
import { createDebouncedScanner } from "../utils/scheduling.js";
import { isBolHomepage } from "../utils/pageDetection.js";

const LEGACY_ACTIONS_CLASS = "bf-inverse-facet-actions";
const LEGACY_BUTTON_CLASS = "bf-inverse-facet-btn";
const LEGACY_INFO_CLASS = "bf-inverse-facet-info";
const MODE_ROW_CLASS = "bf-inverse-facet-mode-row";
const MODE_TOGGLE_CLASS = "bf-inverse-facet-mode-toggle";
const MODE_CONFIRM_CLASS = "bf-inverse-facet-mode-confirm";
const MODE_CANCEL_CLASS = "bf-inverse-facet-mode-cancel";
const MODE_HINT_CLASS = "bf-inverse-facet-mode-hint";
const MODE_SELECTED_ROW_CLASS = "bf-inverse-facet-selected-row";
const STYLE_ID = "bf-inverse-facet-style";

function ensureInverseFacetStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .${MODE_ROW_CLASS} {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 6px 0 10px;
      flex-wrap: wrap;
    }

    .${MODE_TOGGLE_CLASS} {
      padding: 4px 10px;
      border: 1px solid #d5dcef;
      border-radius: 999px;
      background: #ffffff;
      color: #4b5563;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.4;
      cursor: pointer;
      transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
    }

    .${MODE_TOGGLE_CLASS}:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #334155;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
    }

    .${MODE_TOGGLE_CLASS}[aria-pressed="true"] {
      background: #fff1f2;
      border-color: #fda4af;
      color: #be123c;
      box-shadow: 0 1px 2px rgba(244, 63, 94, 0.12);
    }

    .${MODE_TOGGLE_CLASS}:focus-visible {
      outline: 2px solid #93c5fd;
      outline-offset: 2px;
    }

    .${MODE_TOGGLE_CLASS}[disabled] {
      cursor: progress;
      opacity: 0.7;
    }

    .${MODE_CONFIRM_CLASS},
    .${MODE_CANCEL_CLASS} {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.4;
      cursor: pointer;
      transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
    }

    .${MODE_CONFIRM_CLASS} {
      border: 1px solid #fda4af;
      background: #fff1f2;
      color: #be123c;
    }

    .${MODE_CONFIRM_CLASS}:hover {
      background: #ffe4e6;
      border-color: #fb7185;
    }

    .${MODE_CANCEL_CLASS} {
      border: 0;
      background: transparent;
      color: #64748b;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .${MODE_CANCEL_CLASS}:hover {
      background: transparent;
      color: #334155;
    }

    .${MODE_HINT_CLASS} {
      color: #64748b;
      font-size: 12px;
      line-height: 1.4;
    }

    .${MODE_SELECTED_ROW_CLASS} {
      border-radius: 10px;
      background: rgba(244, 63, 94, 0.08);
      box-shadow: inset 0 0 0 1px rgba(244, 63, 94, 0.22);
      padding: 3px 8px 3px 2px;
    }

    html.bf-dark-mode .${MODE_TOGGLE_CLASS} {
      background: #152235;
      border-color: #2d4568;
      color: #dbeafe;
    }

    html.bf-dark-mode .${MODE_TOGGLE_CLASS}:hover {
      background: #1a304c;
      border-color: #40608d;
      color: #eff6ff;
    }

    html.bf-dark-mode .${MODE_TOGGLE_CLASS}[aria-pressed="true"] {
      background: #4c1d2b;
      border-color: #9f1239;
      color: #fecdd3;
    }

    html.bf-dark-mode .${MODE_CONFIRM_CLASS} {
      background: #4c1d2b;
      border-color: #9f1239;
      color: #fecdd3;
    }

    html.bf-dark-mode .${MODE_CONFIRM_CLASS}:hover {
      background: #5b2234;
      border-color: #e11d48;
    }

    html.bf-dark-mode .${MODE_CANCEL_CLASS} {
      color: #dbeafe;
    }

    html.bf-dark-mode .${MODE_CANCEL_CLASS}:hover {
      color: #eff6ff;
    }

    html.bf-dark-mode .${MODE_HINT_CLASS} {
      color: #94a3b8;
    }

    html.bf-dark-mode .${MODE_SELECTED_ROW_CLASS} {
      background: rgba(225, 29, 72, 0.16);
      box-shadow: inset 0 0 0 1px rgba(251, 113, 133, 0.35);
    }
  `;

  document.head.appendChild(style);
}

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFacetItemId(checkbox) {
  if (!checkbox) return "";

  const dataId = checkbox.getAttribute("data-facet-item-id");
  if (dataId) return dataId;

  const value = checkbox.getAttribute("value") || "";
  return /^\d+$/.test(value) ? value : "";
}

function getFacetRowHighlightTarget(checkbox) {
  if (!checkbox) return null;

  const parent = checkbox.parentElement;
  if (parent?.querySelector("label")) {
    return parent;
  }

  const listItem = checkbox.closest("li");
  if (listItem) {
    const directRow = listItem.firstElementChild;
    if (directRow instanceof HTMLElement && directRow.children.length > 0) {
      return directRow;
    }
    return listItem;
  }

  return parent;
}

function getFacetTitleFromDialog(dialog) {
  const labelledBy = dialog?.getAttribute("aria-labelledby");
  if (labelledBy) {
    const titleEl = document.getElementById(labelledBy);
    if (titleEl) return normalizeText(titleEl.textContent);
  }

  const heading = dialog?.querySelector("h2");
  return normalizeText(heading?.textContent || "");
}

function getFacetTitleElementFromDialog(dialog) {
  const labelledBy = dialog?.getAttribute("aria-labelledby");
  if (labelledBy) {
    const titleEl = document.getElementById(labelledBy);
    if (titleEl) return titleEl;
  }

  return dialog?.querySelector("h2") || null;
}

function getFacetTitleFromSidebarSection(section) {
  if (!section) return "";

  const facetHeading = section.querySelector('[role="heading"][data-facet-id]');
  if (facetHeading) {
    const headingButton = facetHeading.querySelector('button[aria-controls]') || facetHeading.querySelector("button") || facetHeading;
    return normalizeText(headingButton.textContent);
  }

  const headings = Array.from(section.querySelectorAll("h2"));
  if (headings.length === 1) {
    return normalizeText(headings[0].textContent);
  }

  return "";
}

function getFacetTitleElementFromSidebarSection(section) {
  if (!section) return null;

  const facetHeading = section.querySelector('[role="heading"][data-facet-id]');
  if (facetHeading) return facetHeading;

  const headings = Array.from(section.querySelectorAll("h2"));
  return headings.length === 1 ? headings[0] : null;
}

function findSidebarFacetSection(checkbox) {
  let current = checkbox?.closest("li") || checkbox?.parentElement || null;

  while (current && current !== document.body) {
    const title = getFacetTitleFromSidebarSection(current);
    if (title && current.querySelector('[role="checkbox"]')) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function getFacetContext(checkbox) {
  if (!checkbox || checkbox.closest("#bol-filter-root")) return null;

  const dialog = checkbox.closest('[role="dialog"]');
  if (dialog) {
    const title = getFacetTitleFromDialog(dialog);
    if (!title) return null;

    return {
      type: "dialog",
      title,
      container: dialog
    };
  }

  if (checkbox.closest("main")) return null;

  const section = findSidebarFacetSection(checkbox);
  if (!section) return null;

  const title = getFacetTitleFromSidebarSection(section);
  if (!title) return null;

  return {
    type: "sidebar",
    title,
    container: section
  };
}

function getFacetKey(context) {
  return normalizeText(context?.title || "").toLowerCase();
}

function getFacetControlAnchor(context) {
  if (!context) return null;

  if (context.type === "dialog") {
    return getFacetTitleElementFromDialog(context.container);
  }

  return getFacetTitleElementFromSidebarSection(context.container);
}

function getModeRowSignature({ isActive, excludedCount, busy }) {
  return `${isActive ? "active" : "idle"}:${excludedCount}:${busy ? "busy" : "ready"}`;
}

function findModeRowForContext(context) {
  const key = getFacetKey(context);
  if (!key || !context?.container) return null;

  return Array.from(context.container.querySelectorAll(`.${MODE_ROW_CLASS}`)).find((row) => row.dataset.bfFacetKey === key) || null;
}

function collectGroupItemIds(container) {
  return Array.from(container.querySelectorAll('[role="checkbox"]'))
    .map(getFacetItemId)
    .filter(Boolean);
}

function findMoreButton(section) {
  const buttons = Array.from(section.querySelectorAll("button"));
  return buttons.find((button) => normalizeText(button.textContent) === "Meer") || null;
}

function waitForFacetDialog(title, timeoutMs = 1500) {
  const matcher = new RegExp(`^${escapeRegExp(title)}$`, "i");

  return new Promise((resolve) => {
    const start = Date.now();

    const tick = () => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
      const match = dialogs.find((dialog) => matcher.test(getFacetTitleFromDialog(dialog)));
      if (match) {
        resolve(match);
        return;
      }

      if (Date.now() - start >= timeoutMs) {
        resolve(null);
        return;
      }

      window.setTimeout(tick, 50);
    };

    tick();
  });
}

function waitForExpandedFacetSection(section, initialCount, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const start = Date.now();

    const tick = () => {
      const currentCount = collectGroupItemIds(section).length;
      const moreButton = findMoreButton(section);
      if (currentCount > initialCount || !moreButton) {
        resolve(currentCount > 0 ? section : null);
        return;
      }

      if (Date.now() - start >= timeoutMs) {
        resolve(null);
        return;
      }

      window.setTimeout(tick, 50);
    };

    tick();
  });
}

async function resolveGroupItemIds(context) {
  if (context.type === "dialog") {
    return collectGroupItemIds(context.container);
  }

  const moreButton = findMoreButton(context.container);
  if (!moreButton) {
    return collectGroupItemIds(context.container);
  }

  const initialCount = collectGroupItemIds(context.container).length;
  moreButton.click();

  const [dialog, expandedSection] = await Promise.all([
    waitForFacetDialog(context.title),
    waitForExpandedFacetSection(context.container, initialCount)
  ]);

  if (dialog) {
    return collectGroupItemIds(dialog);
  }

  if (expandedSection) {
    return collectGroupItemIds(expandedSection);
  }

  if (collectGroupItemIds(context.container).length > initialCount) {
    return collectGroupItemIds(context.container);
  }

  if (!findMoreButton(context.container)) {
    return collectGroupItemIds(context.container);
  }

  if (initialCount === 0) {
    return null;
  }

  return null;
}

function parseFilterTokens(search) {
  const rawSearch = (search || "").replace(/^\?/, "");
  const match = rawSearch.match(/(?:^|&)filter_N=([^&]*)/);
  if (!match || !match[1]) return [];

  return decodeURIComponent(match[1])
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean);
}

function buildNextUrl({ currentUrl, nextTokens }) {
  const url = new URL(currentUrl);
  const params = new URLSearchParams(url.search);

  params.delete("filter_N");
  params.delete("page");
  params.delete("bltgh");
  params.set("page", "1");

  const parts = [];
  if (nextTokens.length > 0) {
    parts.push(`filter_N=${nextTokens.join("+")}`);
  }

  params.forEach((value, key) => {
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  });

  url.search = parts.length > 0 ? `?${parts.join("&")}` : "";
  return url.toString();
}

function computeNextTokens({ currentTokens, groupIds, excludedIds }) {
  const groupSet = new Set(groupIds);
  const excludedSet = new Set(excludedIds);
  const preserved = currentTokens.filter((token) => !groupSet.has(token));
  const inverted = groupIds.filter((token) => !excludedSet.has(token));

  return Array.from(new Set([...preserved, ...inverted]));
}

function getCheckboxFromInteractionTarget(target) {
  if (!(target instanceof Element)) return null;

  const checkbox = target.closest('[role="checkbox"]');
  if (checkbox) return checkbox;

  if (target.closest("button, a, input, select, textarea")) return null;

  const row = target.closest("li");
  return row?.querySelector('[role="checkbox"]') || null;
}

export function createInverseFacetFilter() {
  let busy = false;
  let activeFacetKey = "";
  let excludedIds = new Set();
  let observing = false;

  const clearLegacyRowActions = () => {
    document.querySelectorAll(`.${LEGACY_ACTIONS_CLASS}`).forEach((node) => node.remove());
    document.querySelectorAll(`.${LEGACY_BUTTON_CLASS}, .${LEGACY_INFO_CLASS}`).forEach((node) => node.remove());
  };

  const clearModeRows = () => {
    document.querySelectorAll(`.${MODE_ROW_CLASS}`).forEach((node) => node.remove());
  };

  const clearSelectedRows = () => {
    document.querySelectorAll(`.${MODE_SELECTED_ROW_CLASS}`).forEach((node) => node.classList.remove(MODE_SELECTED_ROW_CLASS));
  };

  const resetActiveMode = () => {
    activeFacetKey = "";
    excludedIds = new Set();
  };

  const navigateToInverseFacet = async ({ context, nextExcludedIds }) => {
    if (busy) return;

    if (!context) return;

    busy = true;

    try {
      const groupIds = await resolveGroupItemIds(context);
      const validExcludedIds = nextExcludedIds.filter((itemId) => groupIds?.includes(itemId));
      if (!groupIds || validExcludedIds.length === 0 || validExcludedIds.length >= groupIds.length) {
        return;
      }

      const currentTokens = parseFilterTokens(window.location.search);
      const nextTokens = computeNextTokens({ currentTokens, groupIds, excludedIds: validExcludedIds });
      const nextUrl = buildNextUrl({ currentUrl: window.location.href, nextTokens });

      window.location.assign(nextUrl);
    } finally {
      busy = false;
    }
  };

  const setActiveFacet = (key) => {
    if (activeFacetKey === key) {
      activeFacetKey = "";
      excludedIds = new Set();
      return;
    }

    activeFacetKey = key;
    excludedIds = new Set();
  };

  const renderModeControl = (context) => {
    const anchor = getFacetControlAnchor(context);
    if (!anchor || !anchor.parentElement) return;

    const key = getFacetKey(context);
    if (!key) return;

    const signature = getModeRowSignature({
      isActive: activeFacetKey === key,
      excludedCount: excludedIds.size,
      busy
    });

    let row = findModeRowForContext(context);
    if (!row) {
      row = document.createElement("div");
      row.className = MODE_ROW_CLASS;
      row.dataset.bfFacetKey = key;
    }

    if (anchor.nextElementSibling !== row) {
      anchor.insertAdjacentElement("afterend", row);
    }

    if (row.dataset.bfStateSignature === signature) {
      return;
    }

    row.dataset.bfStateSignature = signature;
    row.replaceChildren();

    if (activeFacetKey === key) {
      const confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.className = MODE_CONFIRM_CLASS;
      confirmButton.textContent = excludedIds.size > 0 ? `Bevestig (${excludedIds.size})` : "Bevestig";
      confirmButton.disabled = excludedIds.size === 0 || busy;
      confirmButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const nextExcludedIds = Array.from(excludedIds);
        resetActiveMode();
        scanWithObserverPaused();
        void navigateToInverseFacet({ context, nextExcludedIds });
      });
      row.appendChild(confirmButton);

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = MODE_CANCEL_CLASS;
      cancelButton.textContent = "Annuleer";
      cancelButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        resetActiveMode();
        scanWithObserverPaused();
      });
      row.appendChild(cancelButton);

      const hint = document.createElement("span");
      hint.className = MODE_HINT_CLASS;
      hint.textContent = excludedIds.size > 0
        ? `${excludedIds.size} optie${excludedIds.size === 1 ? "" : "s"} wordt${excludedIds.size === 1 ? "" : "en"} uitgesloten. Kies meer, of bevestig.`
        : "Kies opties die je wilt uitsluiten, en bevestig daarna.";
      row.appendChild(hint);
    } else {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = MODE_TOGGLE_CLASS;
      toggle.textContent = "Behalve-modus";
      toggle.title = "Zet inverse modus aan. Klik daarna opties die je wilt uitsluiten.";
      toggle.setAttribute("aria-label", toggle.title);
      toggle.setAttribute("aria-pressed", "false");
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setActiveFacet(key);
        scanWithObserverPaused();
      });
      row.appendChild(toggle);
    }

  };

  const decorateSelectedRows = () => {
    clearSelectedRows();
    if (!activeFacetKey || excludedIds.size === 0) return;

    document.querySelectorAll('[role="checkbox"]').forEach((checkbox) => {
      const context = getFacetContext(checkbox);
      const itemId = getFacetItemId(checkbox);
      if (!context || getFacetKey(context) !== activeFacetKey || !excludedIds.has(itemId)) return;

      const row = getFacetRowHighlightTarget(checkbox);
      row?.classList.add(MODE_SELECTED_ROW_CLASS);
    });
  };

  const scan = () => {
    clearLegacyRowActions();
    clearSelectedRows();

    if (isBolHomepage()) {
      resetActiveMode();
      clearModeRows();
      return;
    }

    ensureInverseFacetStyles();

    const contexts = [];
    const seenContainers = new Set();
    document.querySelectorAll('[role="checkbox"]').forEach((checkbox) => {
      const itemId = getFacetItemId(checkbox);
      const context = getFacetContext(checkbox);
      if (!itemId || !context) return;

      if (!seenContainers.has(context.container)) {
        seenContainers.add(context.container);
        contexts.push(context);
      }
    });

    const activeFacetStillVisible = contexts.some((context) => getFacetKey(context) === activeFacetKey);
    if (activeFacetKey && !activeFacetStillVisible) {
      resetActiveMode();
    }

    const visibleKeys = new Set();
    contexts.forEach((context) => {
      visibleKeys.add(getFacetKey(context));
      renderModeControl(context);
    });

    document.querySelectorAll(`.${MODE_ROW_CLASS}`).forEach((row) => {
      if (!visibleKeys.has(row.dataset.bfFacetKey || "")) {
        row.remove();
      }
    });

    decorateSelectedRows();
  };

  const handleInverseInteraction = (event) => {
    if (!activeFacetKey || busy) return;

    const checkbox = getCheckboxFromInteractionTarget(event.target);
    if (!checkbox) return;

    const context = getFacetContext(checkbox);
    if (!context || getFacetKey(context) !== activeFacetKey) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const itemId = getFacetItemId(checkbox);
    if (!itemId) return;

    if (excludedIds.has(itemId)) {
      excludedIds.delete(itemId);
    } else {
      excludedIds.add(itemId);
    }

    scanWithObserverPaused();
  };

  function scanWithObserverPaused() {
    stopObserving();
    try {
      scan();
    } finally {
      startObserving();
    }
  }

  const { schedule: scheduleScan, clear: clearScan } = createDebouncedScanner(scanWithObserverPaused, TIMING.FILTER_SCAN_DEBOUNCE);
  const observer = new MutationObserver(() => {
    scheduleScan();
  });

  function startObserving() {
    if (observing) return;
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    observing = true;
  }

  function stopObserving() {
    if (!observing) return;
    observer.disconnect();
    observing = false;
  }

  const observe = () => {
    document.addEventListener("click", handleInverseInteraction, true);
    startObserving();
    scheduleScan();
  };

  const destroy = () => {
    document.removeEventListener("click", handleInverseInteraction, true);
    stopObserving();
    clearScan();
    resetActiveMode();
    clearModeRows();
    clearSelectedRows();
    clearLegacyRowActions();
  };

  return {
    observe,
    destroy
  };
}
