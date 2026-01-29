(() => {
    const DARK_MODE_KEY = "glazenBolDarkMode";

    const injectStyle = () => {
        if (document.querySelector("link[href*='dark-mode.css']")) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = chrome.runtime.getURL("src/content/styles/dark-mode.css");
        if (document.head) {
            document.head.appendChild(link);
        } else {
            // If head not ready, append todocumentElement or wait
            document.documentElement.appendChild(link);
        }
    };

    const applyDarkMode = (enabled) => {
        if (enabled) {
            document.documentElement.classList.add("bf-dark-mode");
            injectStyle();
        } else {
            document.documentElement.classList.remove("bf-dark-mode");
        }
    };

    const getStorage = (key, callback) => {
        if (typeof browser !== "undefined" && browser.storage && browser.storage.sync) {
            browser.storage.sync.get(key).then(callback);
        } else if (chrome && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get(key, callback);
        }
    };

    if (typeof chrome !== "undefined" && chrome.storage) {
        getStorage(DARK_MODE_KEY, (result) => {
            let enabled = result && result[DARK_MODE_KEY];
            applyDarkMode(Boolean(enabled));

            // Protect against page hydration/SPA frameworks removing the class
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === "class") {
                        const hasDarkMode = document.documentElement.classList.contains("bf-dark-mode");
                        // Re-apply the correct state if it was changed externally
                        if (enabled && !hasDarkMode) {
                            document.documentElement.classList.add("bf-dark-mode");
                        } else if (!enabled && hasDarkMode) {
                            document.documentElement.classList.remove("bf-dark-mode");
                        }
                    }
                });
            });

            observer.observe(document.documentElement, { attributes: true });

            // Listen for storage changes to update in real-time across tabs
            chrome.storage.onChanged.addListener((changes, area) => {
                if ((area === "sync" || area === "local") && changes[DARK_MODE_KEY]) {
                    const newValue = changes[DARK_MODE_KEY].newValue;
                    enabled = Boolean(newValue);
                    applyDarkMode(enabled);
                }
            });
        });
    }
})();
