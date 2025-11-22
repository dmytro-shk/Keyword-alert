// content.js — main/secondary trigger-based alert system
const DEBUG = true;   // set true to see parsing logs in DevTools console
const DETAILED_DEBUG = false; // set true for very verbose logging

// Comprehensive debug logger
const DebugLogger = {
  session: Date.now(),

  log(category, message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `🔍 [${category}] ${timestamp}:`;

    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  },

  logSettings() {
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
    console.log('\n🔍 PAGE CHECK STARTED');
    console.log(`📄 Page text length: ${pageText.length} chars`);
    console.log(`📄 First 200 chars: "${pageText.substring(0, 200)}..."`);
    if (pageText.length > 200) {
      console.log(`📄 Last 100 chars: "...${pageText.substring(pageText.length - 100)}"`);
    }

    console.log('\n📄 FULL PAGE TEXT (for debugging):');
    console.log('════════════════════════════════════════');
    console.log(pageText);
    console.log('════════════════════════════════════════\n');
  },

  logAlertEvaluation(alertIndex, alert, result) {
    const status = result.triggered ? '✅ TRIGGERED' : '❌ FAILED';
    console.log(`\n🚨 Alert ${alertIndex + 1}/? "${alert.message}" - ${status}`);
    console.log(`   Main triggers: ${result.mainResult ? '✅' : '❌'}`);
    console.log(`   Secondary triggers: ${result.secondaryResult ? '✅' : '❌'}`);
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
  console.log('Use enableDetailedDebug() for verbose keyword matching');
  console.log('Use testKeywordAlert() to test with full debug output');
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

let alerted = false;
let checking = false;  // simple guard to avoid overlapping checks
let shownAlerts = new Set(); // Track which specific alerts have been shown
let lastCheckTime = 0; // Track last check time for debouncing
const CHECK_DEBOUNCE_MS = 1000; // Minimum time between checks

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
        // Evaluate main triggers
        const mainTriggersMatch = alertItem.mainTriggers.every(triggerId => {
          const trigger = mainTriggers.find(t => t.id === triggerId);
          if (!trigger) {
            DebugLogger.log('ERROR', `Main trigger ID ${triggerId} not found for alert "${alertItem.message}"`);
            return false;
          }
          return window.evaluateTrigger(trigger, pageText);
        });

        // Evaluate secondary triggers
        let secondaryTriggersMatch = true;
        if (alertItem.secondaryTriggers && alertItem.secondaryTriggers.length > 0) {
          secondaryTriggersMatch = alertItem.secondaryTriggers.some(triggerId => {
            const trigger = secondaryTriggers.find(t => t.id === triggerId);
            if (!trigger) {
              DebugLogger.log('ERROR', `Secondary trigger ID ${triggerId} not found for alert "${alertItem.message}"`);
              return false;
            }
            return window.evaluateTrigger(trigger, pageText);
          });
        }

        // Determine final result
        const triggered = mainTriggersMatch && secondaryTriggersMatch;
        const alreadyShown = shownAlerts.has(alertItem.id);

        DebugLogger.logAlertEvaluation(alertIndex, alertItem, {
          triggered,
          mainResult: mainTriggersMatch,
          secondaryResult: secondaryTriggersMatch,
          alreadyShown
        });

        if (triggered && !alreadyShown) {
          triggeredAlerts.push({
            message: alertItem.message,
            id: alertItem.id,
            index: alertsTriggered + 1
          });
          shownAlerts.add(alertItem.id);
          alertsTriggered++;
        }
      });

      // Show final results and display alerts
      DebugLogger.logFinalResults(alerts.length, alertsTriggered, triggeredAlerts);

      if (alertsTriggered > 0) {
        triggeredAlerts.forEach((alertObj, index) => {
          setTimeout(() => {
            DebugLogger.log('ALERT', `Displaying: "${alertObj.message}"`);
            window.alert(`Alert ${index + 1}: ${alertObj.message}`);
          }, index * 300);
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