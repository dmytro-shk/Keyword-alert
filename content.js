(function () {
  let triggered = false;

  function checkForKeywords(keywordMap, triggerPhrase) {
    if (triggered) return;

    const bodyText = (document.body.innerText || "").toLowerCase();
    const triggerCheck = (triggerPhrase || "").toLowerCase();

    // Require trigger phrase to appear first
    if (!bodyText.includes(triggerCheck)) return;

    for (const keyword in keywordMap) {
      if (bodyText.includes(keyword)) {
        triggered = true;
        alert(keywordMap[keyword]);
        break;
      }
    }
  }

  window.addEventListener("load", () => {
    chrome.storage.sync.get(["keywordMap", "triggerPhrase"], (data) => {
      const keywordMap = data.keywordMap || {};
      const triggerPhrase = data.triggerPhrase || "";

      checkForKeywords(keywordMap, triggerPhrase);

      const observer = new MutationObserver(() => {
        checkForKeywords(keywordMap, triggerPhrase);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  });
})();