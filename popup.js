document.addEventListener('DOMContentLoaded', () => {
    const blockReels = document.getElementById('blockReels');
    const blockExplore = document.getElementById('blockExplore');
    const blockSuggested = document.getElementById('blockSuggested');

    // Load saved settings
    chrome.storage.local.get({
        blockReels: true,
        blockExplore: true,
        blockSuggested: true
    }, (items) => {
        blockReels.checked = items.blockReels;
        blockExplore.checked = items.blockExplore;
        blockSuggested.checked = items.blockSuggested;
    });

    // Save settings when changed
    const saveSettings = () => {
        chrome.storage.local.set({
            blockReels: blockReels.checked,
            blockExplore: blockExplore.checked,
            blockSuggested: blockSuggested.checked
        });
    };

    blockReels.addEventListener('change', saveSettings);
    blockExplore.addEventListener('change', saveSettings);
    blockSuggested.addEventListener('change', saveSettings);
});
