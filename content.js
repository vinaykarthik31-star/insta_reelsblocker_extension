// Configuration state
let config = {
  blockReels: true,
  blockExplore: true,
  blockSuggested: true
};

// Ensure we don't start DOM clearing before body exists
const init = () => {
    // Load initial config from storage
    chrome.storage.local.get(['blockReels', 'blockExplore', 'blockSuggested'], function(result) {
      if (result.blockReels !== undefined) config.blockReels = result.blockReels;
      if (result.blockExplore !== undefined) config.blockExplore = result.blockExplore;
      if (result.blockSuggested !== undefined) config.blockSuggested = result.blockSuggested;
      runCleaner();
    });

    // Start observing the body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
};

// Update config when changed in popup
chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (config.hasOwnProperty(key)) {
      config[key] = newValue;
    }
  }
  runCleaner();
});

// Main cleaning function
function runCleaner() {
  checkUrl();
  cleanDOM();
}

// Redirect if on blocked URL
function checkUrl() {
  const path = window.location.pathname;
  if (config.blockReels && path.includes('/reels')) {
    window.location.replace('/');
  }
  if (config.blockExplore && path.includes('/explore')) {
    window.location.replace('/');
  }
}

// Intercept History API to detect SPA navigation
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function() {
  originalPushState.apply(this, arguments);
  setTimeout(runCleaner, 50);
};

history.replaceState = function() {
  originalReplaceState.apply(this, arguments);
  setTimeout(runCleaner, 50);
};

window.addEventListener('popstate', function() {
  setTimeout(runCleaner, 50);
});

// DOM cleaning logic
function cleanDOM() {
  if (config.blockSuggested) {
    removeSuggestedPosts();
    removeSidebarSuggestions();
  }
}

// Remove "Suggested for you" from feed
function removeSuggestedPosts() {
  // Find standard feed articles
  const articles = document.querySelectorAll('article');
  articles.forEach(article => {
    // Basic text detection inside the article
    if (article.innerText && (article.innerText.includes('Suggested for you') || article.innerText.includes('Because you follow'))) {
      article.style.display = 'none';
    }
  });

  // Catch dynamic text chunks
  const spans = document.querySelectorAll('span');
  spans.forEach(span => {
    if (span.innerText === 'Suggested for you') {
      // Find the closest parent container to hide
      const container = span.closest('article') || span.closest('div[style*="max-width:"]');
      if (container) {
          container.style.display = 'none';
      }
    }
  });
}

// Remove sidebar suggestions
function removeSidebarSuggestions() {
    // Sidebar on desktop often contains "Suggested for you"
    const divs = document.querySelectorAll('div');
    for (let i = 0; i < divs.length; i++) {
        const div = divs[i];
        if (div.innerText === 'Suggested for you' && div.children.length === 0) {
            // Find appropriate parent to remove
            const parent = div.closest('div[style*="max-width"]'); 
            if (parent) {
                parent.style.display = 'none';
            } else {
                // Heuristic: go up a few levels to hide the section
                let p = div.parentElement;
                if(p) p = p.parentElement;
                if(p) p = p.parentElement;
                if(p) p.style.display = 'none';
            }
        }
    }
}

// Use MutationObserver for dynamic React DOM additions
const observer = new MutationObserver((mutations) => {
  let shouldClean = false;
  for (let mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldClean = true;
      break;
    }
  }
  if (shouldClean) {
    // Debounce the cleaning to avoid heavy CPU usage
    if (window.cleanerTimeout) clearTimeout(window.cleanerTimeout);
    window.cleanerTimeout = setTimeout(runCleaner, 100);
  }
});

// document_start requires waiting for DOMContentLoaded to attach observer to body
document.addEventListener('DOMContentLoaded', init);
// Fallback if readyState is already complete
if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(init, 1);
}
