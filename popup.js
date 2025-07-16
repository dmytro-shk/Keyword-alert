// Load saved data when popup opens
chrome.storage.sync.get(["keywordMap", "triggerPhrase"], (data) => {
    const map = data.keywordMap || {};
    const phrase = data.triggerPhrase || "Convert To Work Order";
  
    document.getElementById("triggerInput").value = phrase;
    document.getElementById("keywordInput").value = Object.entries(map)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
  });
  
  // Save button
  document.getElementById("saveBtn").addEventListener("click", () => {
    const lines = document.getElementById("keywordInput").value.split("\n");
    const map = {};
  
    for (const line of lines) {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) {
        map[key.trim().toLowerCase()] = rest.join("=").trim();
      }
    }
  
    const triggerPhrase = document.getElementById("triggerInput").value.trim();
  
    chrome.storage.sync.set({
      keywordMap: map,
      triggerPhrase: triggerPhrase
    }, () => {
      alert("Settings saved!");
    });
  });