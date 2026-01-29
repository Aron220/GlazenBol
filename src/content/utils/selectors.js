/**
 * Shared DOM selectors used across the application to identify key elements.
 * Centralizing these makes it easier to update when Bol.com changes their markup.
 */

// Product listing links
export const PRODUCT_LINK_SELECTOR = 'a[href*="/nl/nl/p/"], a[href*="/p/"]';

// Brand links
export const BRAND_LINK_SELECTOR = 'a[href*="/b/"], a[href*="/pb/"]';

// Listing container markers
export const LISTING_DATA_SELECTOR = '[data-bltgi*="ProductList"], [data-bltgh*="ProductList"]';
export const LISTING_CONTAINER_SELECTOR = `${LISTING_DATA_SELECTOR}, [data-test*="product"], [role="listitem"], article, li`;

// Sponsored/Ad selectors
export const AD_BADGE_SELECTOR = "span.text-12";
export const SPONSORED_BADGE_SELECTOR = "span.text-12.text-neutral-text-medium";
export const VISIBLE_TEXT_SELECTOR = "span, div, p";
