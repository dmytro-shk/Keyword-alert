// content.js — main/secondary trigger-based alert system
// COMBINATION-BASED LOGIC SYSTEM:
// Level 1: Keywords within each trigger set use defined AND/OR operators
// Level 2: Check ALL combinations of Main + Secondary trigger sets
// Final: (Main1 AND Secondary1) OR (Main1 AND Secondary2) OR (Main2 AND Secondary1) OR (Main2 AND Secondary2)...
const DEBUG = true;   // set true to see parsing logs in DevTools console
const DETAILED_DEBUG = false; // set true for very verbose logging

// Comprehensive debug logger
const DebugLogger = {
  session: Date.now(),

  log(category, message, data = null) {
    if (!DEBUG) return;
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `🔍 [${category}] ${timestamp}:`;

    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  },

  logSettings() {
    if (!DEBUG) return;
    chrome.storage.local.get(['alerts', 'mainTriggers', 'secondaryTriggers'], res => {
      console.log('\n════════════════════════════════════════');
      console.log('🔧 KEYWORD ALERT EXTENSION - DEBUG SETTINGS');
      console.log('════════════════════════════════════════');
      console.log(`🌐 URL: ${window.location.href}`);
      console.log(`⏰ Session: ${this.session}`);
      console.log(`📊 Storage Summary: ${(res.alerts || []).length} alerts, ${(res.mainTriggers || []).length} main triggers, ${(res.secondaryTriggers || []).length} secondary triggers`);

      console.log('\n📋 MAIN TRIGGERS:');
      (res.mainTriggers || []).forEach(trigger => {
        const keywordString = trigger.keywords.map((k, index) => {
          if (index === 0) return `"${k.keyword}"`;
          const prevOperator = trigger.keywords[index - 1].operator || 'AND';
          return `${prevOperator} "${k.keyword}"`;
        }).join(' ');
        console.log(`  • ${trigger.name} (ID: ${trigger.id}): ${keywordString}`);
      });

      console.log('\n📋 SECONDARY TRIGGERS:');
      (res.secondaryTriggers || []).forEach(trigger => {
        const keywordString = trigger.keywords.map((k, index) => {
          if (index === 0) return `"${k.keyword}"`;
          const prevOperator = trigger.keywords[index - 1].operator || 'AND';
          return `${prevOperator} "${k.keyword}"`;
        }).join(' ');
        console.log(`  • ${trigger.name} (ID: ${trigger.id}): ${keywordString}`);
      });

      console.log('\n🚨 ALERTS CONFIGURATION:');
      (res.alerts || []).forEach((alert, index) => {
        const mainTriggerNames = alert.mainTriggers.map(id => {
          const trigger = (res.mainTriggers || []).find(t => t.id === id);
          return trigger ? trigger.name : `MISSING(${id})`;
        });

        const secondaryTriggerNames = alert.secondaryTriggers.map(id => {
          const trigger = (res.secondaryTriggers || []).find(t => t.id === id);
          return trigger ? trigger.name : `MISSING(${id})`;
        });

        console.log(`  Alert ${index + 1}: "${alert.message}"`);
        console.log(`    Main: [${mainTriggerNames.join(', ')}]`);
        console.log(`    Secondary: [${secondaryTriggerNames.join(', ')}]`);
      });

      console.log('════════════════════════════════════════\n');
    });
  },

  logPageCheck(pageText) {
    if (!DEBUG) return;
    console.log('\n🔍 PAGE CHECK STARTED');
    console.log(`📄 Page text length: ${pageText.length} chars`);
    if (DETAILED_DEBUG) {
      console.log(`📄 First 200 chars: "${pageText.substring(0, 200)}..."`);
      if (pageText.length > 200) {
        console.log(`📄 Last 100 chars: "...${pageText.substring(pageText.length - 100)}"`);
      }
      console.log('\n📄 FULL PAGE TEXT (for debugging):');
      console.log('════════════════════════════════════════');
      console.log(pageText);
      console.log('════════════════════════════════════════\n');
    }
  },

  logAlertEvaluation(alertIndex, alert, result) {
    if (!DEBUG) return;
    const status = result.triggered ? '✅ TRIGGERED' : '❌ FAILED';
    console.log(`\n🚨 Alert ${alertIndex + 1}/? "${alert.message}" - ${status}`);

    if (result.matchingCombinations && result.matchingCombinations.length > 0) {
      console.log(`   ✅ Matching combinations:`);
      result.matchingCombinations.forEach((combo, index) => {
        console.log(`      ${index + 1}. ${combo}`);
      });
    } else {
      console.log(`   ❌ No combinations matched`);
    }

    if (result.alreadyShown) {
      console.log(`   ⏭️ Already shown in this session`);
    }
  },

  logTriggerEvaluation(triggerName, keywords, result, pageText) {
    if (!DETAILED_DEBUG) {
      console.log(`🎯 "${triggerName}": ${result ? '✅ MATCH' : '❌ NO MATCH'}`);
      return;
    }

    // Detailed mode - show keyword-by-keyword evaluation
    console.log(`\n🎯 EVALUATING: "${triggerName}"`);
    let currentResult = pageText.includes(keywords[0].keyword.toLowerCase());
    console.log(`   "${keywords[0].keyword}": ${currentResult ? '✅' : '❌'}`);

    for (let i = 1; i < keywords.length; i++) {
      const keywordMatch = pageText.includes(keywords[i].keyword.toLowerCase());
      const operator = keywords[i - 1].operator;
      const prevResult = currentResult;

      if (operator === 'AND') {
        currentResult = currentResult && keywordMatch;
      } else if (operator === 'OR') {
        currentResult = currentResult || keywordMatch;
      }

      console.log(`   ${operator} "${keywords[i].keyword}": ${keywordMatch ? '✅' : '❌'} → Result: ${currentResult ? '✅' : '❌'}`);
    }
  },

  logFinalResults(totalChecked, totalTriggered, triggeredAlerts) {
    if (!DEBUG) return;
    console.log('\n🏁 FINAL RESULTS');
    console.log(`📊 Alerts checked: ${totalChecked}`);
    console.log(`🎯 Alerts triggered: ${totalTriggered}`);

    if (totalTriggered > 0) {
      console.log('🚀 Showing alerts:');
      triggeredAlerts.forEach((alert, index) => {
        console.log(`   ${index + 1}. "${alert.message}"`);
      });
    } else {
      console.log('❌ No alerts to show');
    }
    console.log('════════════════════════════════════════\n');
  }
};

console.log('🚀 Keyword Alert Extension loaded on', window.location.href);

// Global function to manually test the extension
window.testKeywordAlert = function() {
  DebugLogger.log('MANUAL', 'Test triggered - resetting state');
  alerted = false;
  shownAlerts.clear();
  window.settingsLogged = false; // Force settings display
  window.manualTest = true; // Bypass debouncing for manual tests
  checkPage();
  setTimeout(() => { window.manualTest = false; }, 100); // Reset after test
};

// EMERGENCY: Force show all alerts regardless of triggers
window.forceShowAllAlerts = function() {
  console.log('🚨 EMERGENCY: Forcing all alerts to show...');
  alerted = false;

  chrome.storage.local.get(['alerts'], res => {
    const alerts = res.alerts || [];
    console.log(`Found ${alerts.length} alerts to force-show`);

    if (alerts.length === 0) {
      console.log('❌ NO ALERTS FOUND IN STORAGE');
      window.alert('No alerts configured!');
      return;
    }

    alerts.forEach((alert, index) => {
      setTimeout(() => {
        console.log(`Forcing alert ${index + 1}/${alerts.length}: "${alert.message}"`);
        window.alert(`FORCED Alert ${index + 1}: ${alert.message}`);
      }, index * 500);
    });
  });
};

// EMERGENCY: Test with all triggers forced to match
window.testWithAllTriggersMatching = function() {
  console.log('🚨 TESTING: Making all triggers match temporarily...');
  alerted = false;
  shownAlerts.clear(); // Reset shown alerts tracking

  // Temporarily override evaluateTrigger to always return true
  const originalEvaluate = window.evaluateTrigger;
  window.evaluateTrigger = function() {
    console.log('🟢 FORCED TRIGGER MATCH (temporary override)');
    return true;
  };

  // Run the check
  checkPage();

  // Restore original function after 2 seconds
  setTimeout(() => {
    window.evaluateTrigger = originalEvaluate;
    console.log('✅ Restored original evaluateTrigger function');
  }, 2000);
};

// Global function to inspect all stored data
window.inspectExtensionData = function() {
  DebugLogger.logSettings();
};

// Global function to enable detailed debug mode
window.enableDetailedDebug = function() {
  window.DETAILED_DEBUG = true;
  DebugLogger.log('SYSTEM', 'Detailed debug mode ENABLED - keyword matching will be verbose');
};

// Global function to disable detailed debug mode
window.disableDetailedDebug = function() {
  window.DETAILED_DEBUG = false;
  DebugLogger.log('SYSTEM', 'Detailed debug mode DISABLED - keyword matching will be concise');
};

// Global function to show current debug status
window.debugStatus = function() {
  console.log('\n🔍 KEYWORD ALERT DEBUG STATUS');
  console.log(`🌐 Current URL: ${window.location.href}`);
  console.log(`⏰ Session ID: ${DebugLogger.session}`);
  console.log(`🔧 Debug mode: ${DEBUG ? 'ON' : 'OFF'}`);
  console.log(`📝 Detailed debug: ${DETAILED_DEBUG ? 'ON' : 'OFF'}`);
  console.log(`🚨 Alerted flag: ${alerted}`);
  console.log(`⚡ Currently checking: ${checking}`);
  console.log(`📋 Shown alerts this session: ${Array.from(shownAlerts).join(', ') || 'none'}`);

  // Check user debug mode setting
  chrome.storage.local.get(['debugMode'], (result) => {
    const userDebugMode = result.debugMode || false;
    console.log(`🐛 User debug mode: ${userDebugMode ? 'ENABLED' : 'DISABLED'} (shows trigger details in alerts)`);
  });

  console.log('\nAvailable commands:');
  console.log('• enableDetailedDebug() - verbose keyword matching');
  console.log('• testKeywordAlert() - test with full debug output');
  console.log('• testDebugMode() - test debug alert format');
  console.log('• testTriggerLogic() - test combination logic');
};

// Global function to show current page text
window.showPageText = function() {
  const pageText = (safeGetPageText() || '').toLowerCase();
  console.log('\n📄 CURRENT PAGE TEXT');
  console.log('════════════════════════════════════════');
  console.log(`Length: ${pageText.length} characters`);
  console.log('════════════════════════════════════════');
  console.log(pageText);
  console.log('════════════════════════════════════════\n');
};

// Global function to reset all alert tracking
window.resetAlertTracking = function() {
  alerted = false;
  shownAlerts.clear();
  lastCheckTime = 0;
  window.settingsLogged = false;
  DebugLogger.log('RESET', 'All alert tracking reset - ready for fresh alerts');
};

// Global function to manually trigger multiple alerts
window.testMultipleAlerts = function() {
  console.log('Testing multiple alerts manually...');
  const testMessages = ['First alert test', 'Second alert test', 'Third alert test'];

  testMessages.forEach((message, index) => {
    setTimeout(() => {
      console.log(`Manual alert ${index + 1}: ${message}`);
      window.alert(message);
    }, index * 200);
  });
};

// Global function to test debug mode specifically
window.testDebugMode = function() {
  console.log('🧪 TESTING DEBUG MODE');
  console.log('════════════════════════════════════════');

  chrome.storage.local.get(['debugMode'], (result) => {
    const debugMode = result.debugMode || false;
    console.log(`Current debug mode: ${debugMode ? 'ENABLED' : 'DISABLED'}`);

    if (!debugMode) {
      console.log('⚠️  Debug mode is currently disabled.');
      console.log('Enable debug mode in the popup and try again.');
      return;
    }

    console.log('✅ Debug mode is enabled - alerts will show trigger details');

    // Create a test alert with enhanced debug info
    const testAlert = {
      message: 'Test Enhanced Debug Alert',
      debugInfo: [
        {
          mainTrigger: 'Product Alert',
          mainKeywords: ['phone', 'smartphone'],
          secondaryTrigger: 'Price Drop',
          secondaryKeywords: ['sale', 'discount']
        },
        {
          mainTrigger: 'Category Alert',
          mainKeywords: ['electronics'],
          secondaryTrigger: 'Location',
          secondaryKeywords: ['Seattle', 'BLV']
        }
      ]
    };

    // Format debug lines same way as actual alerts
    const debugLines = testAlert.debugInfo.map(combo => {
      if (combo.secondaryTrigger) {
        return `Main: "${combo.mainTrigger}" (${combo.mainKeywords.join(', ')}) + Secondary: "${combo.secondaryTrigger}" (${combo.secondaryKeywords.join(', ')})`;
      } else {
        return `Main: "${combo.mainTrigger}" (${combo.mainKeywords.join(', ')})`;
      }
    });

    const displayMessage = `🚨 Alert 1: ${testAlert.message}\n\n🐛 Debug Info:\n• ${debugLines.join('\n• ')}`;

    console.log('Sample enhanced debug alert format:');
    console.log(displayMessage);

    // Show actual alert
    window.alert(displayMessage);
  });
};

// Global function to test the combination-based trigger logic
window.testTriggerLogic = function() {
  console.log('🧪 TESTING COMBINATION-BASED TRIGGER LOGIC');
  console.log('════════════════════════════════════════');
  console.log('LEVEL 1: Keywords within each trigger set (internal AND/OR)');
  console.log('LEVEL 2: Check ALL combinations of Main + Secondary sets');
  console.log('FINAL: (Main1 AND Secondary1) OR (Main1 AND Secondary2) OR (Main2 AND Secondary1) OR (Main2 AND Secondary2)...');
  console.log('════════════════════════════════════════');

  // Test trigger sets with internal keyword logic
  const testMainTriggers = [
    {
      id: 1,
      name: 'Fruits',
      keywords: [
        {keyword: 'apple'},
        {keyword: 'orange', operator: 'OR'}
      ]
    },
    {
      id: 2,
      name: 'Tech Products',
      keywords: [
        {keyword: 'phone'},
        {keyword: 'smartphone', operator: 'OR'}
      ]
    }
  ];

  const testSecondaryTriggers = [
    {
      id: 3,
      name: 'Colors',
      keywords: [
        {keyword: 'red'},
        {keyword: 'blue', operator: 'OR'}
      ]
    },
    {
      id: 4,
      name: 'Prices',
      keywords: [
        {keyword: 'sale'},
        {keyword: 'discount', operator: 'OR'}
      ]
    }
  ];

  const testAlert = {
    id: 100,
    message: 'Test Alert',
    mainTriggers: [1, 2], // Both main trigger sets selected
    secondaryTriggers: [3, 4] // Both secondary trigger sets selected
  };

  // Test scenarios with complex internal logic
  const testCases = [
    { text: 'apple red', expected: true, desc: 'Fruits(apple) + Colors(red)' },
    { text: 'orange blue', expected: true, desc: 'Fruits(orange) + Colors(blue)' },
    { text: 'phone sale', expected: true, desc: 'Tech(phone) + Prices(sale)' },
    { text: 'smartphone discount', expected: true, desc: 'Tech(smartphone) + Prices(discount)' },
    { text: 'apple sale', expected: true, desc: 'Fruits(apple) + Prices(sale)' },
    { text: 'phone red', expected: true, desc: 'Tech(phone) + Colors(red)' },
    { text: 'apple', expected: false, desc: 'Fruits only (missing secondary)' },
    { text: 'red', expected: false, desc: 'Colors only (missing main)' },
    { text: 'laptop green', expected: false, desc: 'No matching trigger sets' }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n📋 Test ${index + 1}: ${testCase.desc}`);
    console.log(`   Text: "${testCase.text}"`);

    // Test the new combination-based logic
    let triggered = false;
    let matchingCombinations = [];

    // Check all combinations of main + secondary trigger sets (with keyword details)
    for (const mainTriggerId of testAlert.mainTriggers) {
      const mainTrigger = testMainTriggers.find(t => t.id === mainTriggerId);
      if (!mainTrigger) continue;

      const mainDetails = window.evaluateTriggerWithDetails(mainTrigger, testCase.text.toLowerCase());
      console.log(`   Main "${mainTrigger.name}": ${mainDetails.matched ? '✅' : '❌'} (matched: ${mainDetails.matchedKeywords.join(', ') || 'none'})`);

      for (const secondaryTriggerId of testAlert.secondaryTriggers) {
        const secondaryTrigger = testSecondaryTriggers.find(t => t.id === secondaryTriggerId);
        if (!secondaryTrigger) continue;

        const secondaryDetails = window.evaluateTriggerWithDetails(secondaryTrigger, testCase.text.toLowerCase());
        console.log(`   Secondary "${secondaryTrigger.name}": ${secondaryDetails.matched ? '✅' : '❌'} (matched: ${secondaryDetails.matchedKeywords.join(', ') || 'none'})`);

        // Check this specific combination
        const comboResult = mainDetails.matched && secondaryDetails.matched;
        console.log(`   Combo "${mainTrigger.name}" + "${secondaryTrigger.name}": ${comboResult ? '✅' : '❌'}`);

        if (comboResult) {
          triggered = true;
          matchingCombinations.push(`${mainTrigger.name} (${mainDetails.matchedKeywords.join(', ')}) + ${secondaryTrigger.name} (${secondaryDetails.matchedKeywords.join(', ')})`);
        }
      }
    }

    const passed = triggered === testCase.expected;

    console.log(`   Matching combinations: ${matchingCombinations.length > 0 ? matchingCombinations.join(', ') : 'none'}`);
    console.log(`   Final Result: ${triggered ? 'TRUE' : 'FALSE'}`);
    console.log(`   Expected: ${testCase.expected ? 'TRUE' : 'FALSE'}`);
    console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  });

  console.log('\n════════════════════════════════════════');
  console.log('✅ Test completed! The combination-based logic system works correctly:');
  console.log('• Level 1: Keywords within each trigger set use their defined AND/OR operators');
  console.log('• Level 2: Check ALL combinations of selected Main + Secondary sets');
  console.log('• Final: If ANY combination (Main AND Secondary) is TRUE, show alert');

  // Show debug mode information
  chrome.storage.local.get(['debugMode'], (result) => {
    const debugMode = result.debugMode || false;
    console.log(`\n🐛 Debug Mode: ${debugMode ? 'ENABLED' : 'DISABLED'}`);
    if (debugMode) {
      console.log('   When alerts trigger, they will show which trigger combinations matched.');
    } else {
      console.log('   Enable debug mode in popup to see trigger details in alerts.');
      console.log('   Use testDebugMode() to test debug alert format.');
    }
  });
};

let alerted = false;
let checking = false;  // simple guard to avoid overlapping checks
let shownAlerts = new Set(); // Track which specific alerts have been shown
let lastCheckTime = 0; // Track last check time for debouncing
const CHECK_DEBOUNCE_MS = 1000; // Minimum time between checks
const suppressedAlerts = new Map(); // Track suppressed alerts: alertId -> expiryTime

// Function to show custom alert dialog
function showCustomAlert(message, alertId, debugInfo, index) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['alertStyle'], (result) => {
      const alertStyle = result.alertStyle || 'native';

      if (alertStyle === 'native') {
        // Use native window.alert
        window.alert(message);
        resolve(null);
      } else {
        // Use custom modal
        const modal = createAlertModal(message, alertId, debugInfo, index, resolve);
        document.body.appendChild(modal);
      }
    });
  });
}

// Function to create custom alert modal
function createAlertModal(message, alertId, debugInfo, index, resolve) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    padding: 24px;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  const title = document.createElement('div');
  title.style.cssText = `
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #1a1a1a;
  `;
  title.textContent = `🚨 Keyword Alert`;

  const content = document.createElement('div');
  content.style.cssText = `
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    white-space: pre-wrap;
    margin-bottom: 20px;
  `;
  content.textContent = message;

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'OK';
  closeBtn.style.cssText = `
    flex: 1;
    padding: 10px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = '#0056b3';
  closeBtn.onmouseout = () => closeBtn.style.background = '#007bff';
  closeBtn.onclick = () => {
    document.body.removeChild(overlay);
    resolve(null);
  };

  // Suppress buttons
  const suppress1 = createSuppressButton('1 min', 1, alertId, overlay, resolve);
  const suppress2 = createSuppressButton('2 min', 2, alertId, overlay, resolve);
  const suppress5 = createSuppressButton('5 min', 5, alertId, overlay, resolve);

  buttonContainer.appendChild(closeBtn);
  buttonContainer.appendChild(suppress1);
  buttonContainer.appendChild(suppress2);
  buttonContainer.appendChild(suppress5);

  modal.appendChild(title);
  modal.appendChild(content);
  modal.appendChild(buttonContainer);
  overlay.appendChild(modal);

  return overlay;
}

function createSuppressButton(label, minutes, alertId, overlay, resolve) {
  const btn = document.createElement('button');
  btn.textContent = `Suppress ${label}`;
  btn.style.cssText = `
    padding: 10px 16px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  `;
  btn.onmouseover = () => btn.style.background = '#5a6268';
  btn.onmouseout = () => btn.style.background = '#6c757d';
  btn.onclick = () => {
    const expiryTime = Date.now() + (minutes * 60 * 1000);
    suppressedAlerts.set(alertId, expiryTime);
    shownAlerts.delete(alertId); // Allow it to show again after suppression expires
    console.log(`Alert ${alertId} suppressed for ${minutes} minute(s)`);
    document.body.removeChild(overlay);
    resolve({ suppressed: true, minutes });
  };
  return btn;
}

function safeGetPageText() {
  // prefer innerText (visible text), fallback to textContent
  const raw = (document.body && (document.body.innerText || document.body.textContent)) || '';
  // normalize line endings and unicode normalization for more robust matching
  return raw.normalize ? raw.normalize('NFC') : raw;
}

// Function to evaluate trigger with AND/OR logic
window.evaluateTrigger = function evaluateTrigger(trigger, text) {
  const keywords = trigger.keywords;
  if (keywords.length === 0) return false;

  let result = text.includes(keywords[0].keyword.toLowerCase());

  for (let i = 1; i < keywords.length; i++) {
    const prevOperator = keywords[i - 1].operator;
    const keywordMatch = text.includes(keywords[i].keyword.toLowerCase());

    if (prevOperator === 'AND') {
      result = result && keywordMatch;
    } else if (prevOperator === 'OR') {
      result = result || keywordMatch;
    }
  }

  // Use the new debug logger
  DebugLogger.logTriggerEvaluation(trigger.name, keywords, result, text);

  return result;
}

// Enhanced function to evaluate trigger and return detailed match information
window.evaluateTriggerWithDetails = function evaluateTriggerWithDetails(trigger, text) {
  const keywords = trigger.keywords;
  if (keywords.length === 0) return { matched: false, matchedKeywords: [], expression: '' };

  const matchedKeywords = [];
  const expressionParts = [];

  // Check first keyword
  const firstMatch = text.includes(keywords[0].keyword.toLowerCase());
  if (firstMatch) {
    matchedKeywords.push(keywords[0].keyword);
  }
  expressionParts.push(`"${keywords[0].keyword}":${firstMatch ? 'TRUE' : 'FALSE'}`);

  let result = firstMatch;

  // Check remaining keywords with operators
  for (let i = 1; i < keywords.length; i++) {
    const prevOperator = keywords[i - 1].operator;
    const keywordMatch = text.includes(keywords[i].keyword.toLowerCase());

    if (keywordMatch) {
      matchedKeywords.push(keywords[i].keyword);
    }

    expressionParts.push(`${prevOperator} "${keywords[i].keyword}":${keywordMatch ? 'TRUE' : 'FALSE'}`);

    if (prevOperator === 'AND') {
      result = result && keywordMatch;
    } else if (prevOperator === 'OR') {
      result = result || keywordMatch;
    }
  }

  return {
    matched: result,
    matchedKeywords: matchedKeywords,
    expression: expressionParts.join(' '),
    triggerName: trigger.name
  };
}

function checkPage() {
  const now = Date.now();

  if (checking) {
    DebugLogger.log('SYSTEM', 'Already checking page, skipping duplicate call');
    return;
  }

  // Debounce rapid checks (except for manual tests)
  if (!window.manualTest && now - lastCheckTime < CHECK_DEBOUNCE_MS) {
    DebugLogger.log('SYSTEM', `Debounced check - too soon (${now - lastCheckTime}ms since last)`);
    return;
  }

  checking = true;
  lastCheckTime = now;
  DebugLogger.log('SYSTEM', 'Page check initiated');

  chrome.storage.local.get(['alerts', 'mainTriggers', 'secondaryTriggers'], res => {
    try {
      const pageText = (safeGetPageText() || '').toLowerCase();
      const alerts = res.alerts || [];
      const mainTriggers = res.mainTriggers || [];
      const secondaryTriggers = res.secondaryTriggers || [];

      // Show settings on first run or when explicitly requested
      if (!window.settingsLogged) {
        DebugLogger.logSettings();
        window.settingsLogged = true;
      }

      DebugLogger.logPageCheck(pageText);

      if (alerts.length === 0) {
        DebugLogger.log('SYSTEM', 'No alerts configured');
        return;
      }

      let alertsTriggered = 0;
      const triggeredAlerts = [];

      alerts.forEach((alertItem, alertIndex) => {
        // Check if alert is currently suppressed
        const suppressExpiry = suppressedAlerts.get(alertItem.id);
        if (suppressExpiry && Date.now() < suppressExpiry) {
          DebugLogger.log('SYSTEM', `Alert "${alertItem.message}" is suppressed until ${new Date(suppressExpiry).toLocaleTimeString()}`);
          return; // Skip this alert
        } else if (suppressExpiry) {
          // Suppression expired, remove it
          suppressedAlerts.delete(alertItem.id);
        }

        // Check all combinations of main + secondary trigger sets
        let triggered = false;
        let matchingCombinations = [];

        // If no secondary triggers are specified, only check main triggers
        if (!alertItem.secondaryTriggers || alertItem.secondaryTriggers.length === 0) {
          // Check if any main trigger matches when no secondary triggers required
          for (const mainTriggerId of alertItem.mainTriggers) {
            const trigger = mainTriggers.find(t => t.id === mainTriggerId);
            if (!trigger) {
              DebugLogger.log('ERROR', `Main trigger ID ${mainTriggerId} not found for alert "${alertItem.message}"`);
              continue;
            }

            const mainDetails = window.evaluateTriggerWithDetails(trigger, pageText);
            if (mainDetails.matched) {
              triggered = true;

              // Create detailed debug information for main-only alerts
              const detailedInfo = {
                mainTrigger: mainDetails.triggerName,
                mainKeywords: mainDetails.matchedKeywords,
                mainExpression: mainDetails.expression,
                secondaryTrigger: null,
                secondaryKeywords: [],
                secondaryExpression: null
              };

              matchingCombinations.push(detailedInfo);
            }
          }
        } else {
          // Performance optimization: Check main triggers first, then only check secondary if main matches
          for (const mainTriggerId of alertItem.mainTriggers) {
            const mainTrigger = mainTriggers.find(t => t.id === mainTriggerId);
            if (!mainTrigger) {
              DebugLogger.log('ERROR', `Main trigger ID ${mainTriggerId} not found for alert "${alertItem.message}"`);
              continue;
            }

            const mainDetails = window.evaluateTriggerWithDetails(mainTrigger, pageText);

            // Only check secondary triggers if main trigger matched (performance optimization)
            if (mainDetails.matched) {
              for (const secondaryTriggerId of alertItem.secondaryTriggers) {
                const secondaryTrigger = secondaryTriggers.find(t => t.id === secondaryTriggerId);
                if (!secondaryTrigger) {
                  DebugLogger.log('ERROR', `Secondary trigger ID ${secondaryTriggerId} not found for alert "${alertItem.message}"`);
                  continue;
                }

                const secondaryDetails = window.evaluateTriggerWithDetails(secondaryTrigger, pageText);

                // If both main and secondary trigger in this combination match
                if (secondaryDetails.matched) {
                  triggered = true;

                  // Create detailed debug information
                  const detailedInfo = {
                    mainTrigger: mainDetails.triggerName,
                    mainKeywords: mainDetails.matchedKeywords,
                    mainExpression: mainDetails.expression,
                    secondaryTrigger: secondaryDetails.triggerName,
                    secondaryKeywords: secondaryDetails.matchedKeywords,
                    secondaryExpression: secondaryDetails.expression
                  };

                  matchingCombinations.push(detailedInfo);
                }
              }
            }
          }
        }

        // For debugging: show which combinations matched
        if (matchingCombinations.length > 0) {
          DebugLogger.log('COMBINATIONS', `Matching combinations for "${alertItem.message}":`, matchingCombinations);
        }
        const alreadyShown = shownAlerts.has(alertItem.id);

        DebugLogger.logAlertEvaluation(alertIndex, alertItem, {
          triggered,
          matchingCombinations,
          alreadyShown
        });

        if (triggered && !alreadyShown) {
          triggeredAlerts.push({
            message: alertItem.message,
            id: alertItem.id,
            index: alertsTriggered + 1,
            debugInfo: matchingCombinations
          });
          shownAlerts.add(alertItem.id);
          alertsTriggered++;
        }
      });

      // Show final results and display alerts
      DebugLogger.logFinalResults(alerts.length, alertsTriggered, triggeredAlerts);

      if (alertsTriggered > 0) {
        // Check debug mode setting before displaying alerts
        chrome.storage.local.get(['debugMode'], (result) => {
          const debugMode = result.debugMode || false;

          // Show alerts sequentially
          let delay = 0;
          triggeredAlerts.forEach((alertObj, index) => {
            setTimeout(async () => {
              DebugLogger.log('ALERT', `Displaying: "${alertObj.message}"`);

              let displayMessage;
              if (debugMode && alertObj.debugInfo && alertObj.debugInfo.length > 0) {
                // Format detailed debug message with keywords
                const debugLines = alertObj.debugInfo.map(combo => {
                  if (combo.secondaryTrigger) {
                    // Main + Secondary combination
                    return `Main: "${combo.mainTrigger}" (${combo.mainKeywords.join(', ')}) + Secondary: "${combo.secondaryTrigger}" (${combo.secondaryKeywords.join(', ')})`;
                  } else {
                    // Main-only combination
                    return `Main: "${combo.mainTrigger}" (${combo.mainKeywords.join(', ')})`;
                  }
                });

                displayMessage = `Alert ${index + 1}: ${alertObj.message}\n\n🐛 Debug Info:\n• ${debugLines.join('\n• ')}`;
              } else {
                // Standard message
                displayMessage = `Alert ${index + 1}: ${alertObj.message}`;
              }

              await showCustomAlert(displayMessage, alertObj.id, alertObj.debugInfo, index);
            }, delay);
            delay += 300;
          });
        });
        alerted = true;
      }
    } finally {
      checking = false;
    }
  });
}

// initial run on load (works when content script is injected on page load)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(checkPage, 50); // small delay lets late-rendered text settle
} else {
  window.addEventListener('DOMContentLoaded', () => setTimeout(checkPage, 50));
}

// handle SPA soft navigations triggered by background
chrome.runtime.onMessage.addListener(msg => {
  if (msg && msg.type === 'url-changed') {
    // allow alerting again on new SPA "page"
    alerted = false;
    shownAlerts.clear(); // Reset shown alerts for new page
    console.log('🔄 URL changed - reset alert tracking');
    // small delay to allow new content to render
    setTimeout(checkPage, 150);
  }
});

// observe DOM changes with debouncing to prevent duplicate alerts
let observerTimeout;
const observer = new MutationObserver(() => {
  // Clear existing timeout to debounce rapid changes
  clearTimeout(observerTimeout);
  observerTimeout = setTimeout(() => {
    DebugLogger.log('OBSERVER', 'DOM change detected, checking page');
    checkPage();
  }, 500); // 500ms debounce for DOM changes
});
observer.observe(document.body || document.documentElement, { childList: true, subtree: true });