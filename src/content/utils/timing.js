/**
 * Shared timing constants for the application.
 * Centralizes all delay and timeout values to make tuning easier.
 */
export const TIMING = {
    // Debounce delay for filter scanning (handling rapid DOM mutations)
    FILTER_SCAN_DEBOUNCE: 120,

    // Slightly slower debounce for heavier filters
    FILTER_SCAN_DEBOUNCE_SLOW: 140,

    // Interval for retrying sort preference application
    SORT_RETRY_DELAY: 250,

    // Delay before checking for empty pages
    EMPTY_PAGE_CHECK_DELAY: 500,

    // Duration for toast notification fade out
    TOAST_FADE_DURATION: 240,

    // Default timeout for toast notifications
    TOAST_DISPLAY_DURATION: 5000
};
