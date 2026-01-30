/**
 * Shared styles and class names for block buttons.
 * Used by sellerBlockFilter and brandBlockFilter to ensure consistent styling.
 */

export const BLOCK_BUTTON_CLASS = "bf-block-btn";
const STYLE_ID = "bf-block-btn-style";

/**
 * Injects the CSS styles for block buttons if they don't already exist.
 * This ensures the buttons look consistent across different types of blocking (seller vs brand).
 */
export function ensureBlockButtonStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    .${BLOCK_BUTTON_CLASS} {
      margin-left: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      border: 1px solid #cbd5f5;
      background: #f5f8ff;
      color: #1e3a8a;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      line-height: 1.3;
      box-shadow: 0 1px 1px rgba(15, 23, 42, 0.08);
      transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease, transform 0.04s ease;
    }
    .${BLOCK_BUTTON_CLASS}:hover {
      background: #e8efff;
      border-color: #b6c3f7;
      color: #1e40af;
      box-shadow: 0 2px 5px rgba(15, 23, 42, 0.16);
    }
    .${BLOCK_BUTTON_CLASS}:active {
      transform: translateY(1px);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.14);
    }
    .${BLOCK_BUTTON_CLASS}:focus-visible {
      outline: 2px solid #93c5fd;
      outline-offset: 2px;
    }
    .${BLOCK_BUTTON_CLASS}[disabled] {
      background: #e5e7eb;
      border-color: #e5e7eb;
      color: #6b7280;
      cursor: default;
      box-shadow: none;
      transform: none;
    }
    html.bf-dark-mode .${BLOCK_BUTTON_CLASS} {
      border-color: #334155;
      background: #1f2937;
      color: #e2e8f0;
      box-shadow: 0 1px 1px rgba(2, 6, 23, 0.4);
    }
    html.bf-dark-mode .${BLOCK_BUTTON_CLASS}:hover {
      background: #273449;
      border-color: #475569;
      color: #f1f5f9;
      box-shadow: 0 2px 6px rgba(2, 6, 23, 0.45);
    }
    html.bf-dark-mode .${BLOCK_BUTTON_CLASS}:focus-visible {
      outline-color: #60a5fa;
    }
    html.bf-dark-mode .${BLOCK_BUTTON_CLASS}[disabled] {
      background: #111827;
      border-color: #111827;
      color: #64748b;
      box-shadow: none;
    }
  `;
    document.head.appendChild(style);
}
