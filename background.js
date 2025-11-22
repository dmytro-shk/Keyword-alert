// Send a message to content scripts when the history API changes (SPA navigation).
chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
  if (details.tabId) {
    chrome.tabs.sendMessage(details.tabId, { type: 'url-changed' }, () => {
      // ignore sendMessage errors (tab might be unloading)
      const err = chrome.runtime.lastError;
      if (err) {
        // console.log('message error (normal in some cases):', err.message);
      }
    });
  }
});