// content.js — main/secondary trigger-based alert system
// COMBINATION-BASED LOGIC SYSTEM:
// Level 1: Keywords within each trigger set use defined AND/OR operators
// Level 2: Check ALL combinations of Main + Secondary trigger sets
// Final: (Main1 AND Secondary1) OR (Main1 AND Secondary2) OR (Main2 AND Secondary1) OR (Main2 AND Secondary2)...
const DEBUG = false;  // set true to see parsing logs in DevTools console
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


let alerted = false;
let checking = false;  // simple guard to avoid overlapping checks
let shownAlerts = new Set(); // Track which specific alerts have been shown
let lastCheckTime = 0; // Track last check time for debouncing
const CHECK_DEBOUNCE_MS = 1000; // Minimum time between checks
const suppressedAlerts = new Map(); // Track suppressed alerts: alertId -> expiryTime
const onScreen = new Set(); // Track message texts of modals currently visible on page

// Restore suppress state from storage so it survives page reloads
function loadSuppressState() {
  chrome.storage.local.get(['suppressedAlerts'], (result) => {
    const now = Date.now();
    const stored = result.suppressedAlerts || {};
    let hasStale = false;
    Object.entries(stored).forEach(([idStr, expiryTime]) => {
      if (expiryTime > now) {
        suppressedAlerts.set(parseInt(idStr), expiryTime);
      } else {
        hasStale = true;
      }
    });
    if (hasStale) {
      saveSuppressState(); // Clean up expired entries from storage
    }
  });
}

function saveSuppressState() {
  const state = {};
  suppressedAlerts.forEach((expiryTime, alertId) => {
    state[alertId] = expiryTime;
  });
  chrome.storage.local.set({ suppressedAlerts: state });
}

loadSuppressState();

// Normalize any historical alert format → [s1, s2, s3] strings
function resolveSectionContents(sections, fallbackMessage) {
  if (Array.isArray(sections) && sections.length > 0) {
    if (typeof sections[0] === 'string') {
      return [sections[0] || fallbackMessage || '', sections[1] || '', sections[2] || ''];
    }
    if (sections[0] !== null && typeof sections[0] === 'object') {
      return [sections[0]?.content || fallbackMessage || '', sections[1]?.content || '', sections[2]?.content || ''];
    }
  }
  return [fallbackMessage || '', '', ''];
}

function buildAlertTitle(debugInfo, showTriggerNames) {
  const base = '🚨 Keyword Alert';
  if (!debugInfo || !debugInfo.length || !showTriggerNames || showTriggerNames === 'none') return base;

  const mainNames = [...new Set(debugInfo.map(c => c.mainTrigger).filter(Boolean))];
  const secNames  = [...new Set(debugInfo.map(c => c.secondaryTrigger).filter(Boolean))];

  let forPart = '';
  if (showTriggerNames === 'main' && mainNames.length) {
    forPart = mainNames.join(', ');
  } else if (showTriggerNames === 'secondary' && secNames.length) {
    forPart = secNames.join(', ');
  } else if (showTriggerNames === 'both') {
    const parts = [];
    if (mainNames.length) parts.push(mainNames.join(', '));
    if (secNames.length)  parts.push(secNames.join(', '));
    forPart = parts.join(' + ');
  }

  return forPart ? `${base} for: ${forPart}` : base;
}

// Function to show custom alert dialog
function showCustomAlert(message, alertId, debugInfo, sections) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['alertStyle', 'sectionNames', 'debugMode', 'showTriggerNames'], (result) => {
      const alertStyle = result.alertStyle || 'custom';
      const sectionNames = result.sectionNames || [];
      const debugMode = result.debugMode || false;
      const showTriggerNames = result.showTriggerNames || 'none';

      if (alertStyle === 'native') {
        window.alert(message);
        resolve(null);
      } else {
        if (onScreen.has(message)) {
          resolve(null); // same alert already visible — drop this one
          return;
        }
        onScreen.add(message);
        const modal = createAlertModal(message, alertId, debugInfo, resolve, sections, sectionNames, debugMode, showTriggerNames);
        document.body.appendChild(modal);
      }
    });
  });
}

// Function to create custom alert modal
function createAlertModal(message, alertId, debugInfo, resolve, sections, sectionNames, debugMode, showTriggerNames) {
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
    margin-bottom: 12px;
    color: #1a1a1a;
  `;
  title.textContent = buildAlertTitle(debugInfo, showTriggerNames);

  // Resolve sections from any historical format
  const contents = resolveSectionContents(sections, message);
  const names = sectionNames || [];

  // Build section cards and collect lines for Copy All
  const sectionsWrap = document.createElement('div');
  sectionsWrap.style.cssText = 'margin-bottom: 12px;';
  const copyAllLines = [];

  contents.forEach((content, i) => {
    if (!content) return;
    const name = names[i] || `Section ${i + 1}`;
    copyAllLines.push(`${name}:\n${content}`);

    const sectionDiv = document.createElement('div');
    sectionDiv.style.cssText = `
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
      background: #f8f9fa;
    `;

    const nameEl = document.createElement('div');
    nameEl.style.cssText = `
      font-size: 11px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    `;
    nameEl.textContent = name;
    sectionDiv.appendChild(nameEl);

    const row = document.createElement('div');
    row.style.cssText = 'display: flex; gap: 8px; align-items: flex-start;';

    const contentEl = document.createElement('div');
    contentEl.style.cssText = `
      flex: 1;
      font-size: 13px;
      color: #333;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    `;
    contentEl.textContent = content;
    row.appendChild(contentEl);

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copy';
    copyBtn.style.cssText = `
      padding: 4px 10px;
      background: #f0f0f0;
      color: #000;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
    `;
    copyBtn.onmouseover = () => copyBtn.style.background = '#e0e0e0';
    copyBtn.onmouseout = () => copyBtn.style.background = '#f0f0f0';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(content).then(() => {
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.background = '#d4edda';
        copyBtn.style.borderColor = '#b8dfc4';
        setTimeout(() => {
          copyBtn.textContent = '📋 Copy';
          copyBtn.style.background = '#f0f0f0';
          copyBtn.style.borderColor = '#ccc';
        }, 1500);
      });
    };
    row.appendChild(copyBtn);

    sectionDiv.appendChild(row);
    sectionsWrap.appendChild(sectionDiv);
  });

  // Debug info (collapsible) — only shown when debug mode is on
  if (debugMode && debugInfo && debugInfo.length > 0) {
    const debugDetails = document.createElement('details');
    debugDetails.style.cssText = `
      font-size: 11px; color: #666;
      border: 1px solid #e0d7f0;
      border-radius: 6px;
      padding: 6px 8px;
      background: #f8f0ff;
      margin-bottom: 12px;
    `;
    const summary = document.createElement('summary');
    summary.style.cursor = 'pointer';
    summary.textContent = '🐛 Debug Info';
    const debugContent = document.createElement('div');
    debugContent.style.cssText = 'margin-top: 6px; line-height: 1.6;';
    debugContent.textContent = '• ' + debugInfo.map(combo => combo.secondaryTrigger
      ? `Main: "${combo.mainTrigger}" (${combo.mainKeywords.join(', ')}) + Secondary: "${combo.secondaryTrigger}" (${combo.secondaryKeywords.join(', ')})`
      : `Main: "${combo.mainTrigger}" (${combo.mainKeywords.join(', ')})`
    ).join('\n• ');
    debugDetails.appendChild(summary);
    debugDetails.appendChild(debugContent);
    sectionsWrap.appendChild(debugDetails);
  }

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `display: flex; gap: 8px; flex-wrap: wrap;`;

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
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = '#0056b3';
  closeBtn.onmouseout = () => closeBtn.style.background = '#007bff';

  const dismissModal = () => {
    document.removeEventListener('keydown', onKeyDown);
    onScreen.delete(message);
    document.body.removeChild(overlay);
    resolve(null);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') dismissModal();
  };
  document.addEventListener('keydown', onKeyDown);

  closeBtn.onclick = dismissModal;

  const suppress1 = createSuppressButton('1 min', 1, alertId, overlay, resolve, () => {
    document.removeEventListener('keydown', onKeyDown);
    onScreen.delete(message);
  });

  // Button order: Suppress → Copy All → OK
  buttonContainer.appendChild(suppress1);

  if (copyAllLines.length >= 2) {
    const copyAllBtn = document.createElement('button');
    copyAllBtn.textContent = '📋 Copy All';
    copyAllBtn.style.cssText = `
      padding: 10px 16px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    `;
    copyAllBtn.onmouseover = () => copyAllBtn.style.background = '#1e7e34';
    copyAllBtn.onmouseout = () => copyAllBtn.style.background = '#28a745';
    copyAllBtn.onclick = () => {
      navigator.clipboard.writeText(copyAllLines.join('\n\n')).then(() => {
        copyAllBtn.textContent = '✓ All Copied!';
        copyAllBtn.style.background = '#1e7e34';
        setTimeout(() => {
          copyAllBtn.textContent = '📋 Copy All';
          copyAllBtn.style.background = '#28a745';
        }, 1500);
      });
    };
    buttonContainer.appendChild(copyAllBtn);
  }

  buttonContainer.appendChild(closeBtn);

  modal.appendChild(title);
  modal.appendChild(sectionsWrap);
  modal.appendChild(buttonContainer);
  overlay.appendChild(modal);

  return overlay;
}

function createSuppressButton(label, minutes, alertId, overlay, resolve, onCleanup) {
  const btn = document.createElement('button');
  btn.textContent = `Suppress for ${label}`;
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
    saveSuppressState();
    shownAlerts.delete(alertId);
    console.log(`Alert ${alertId} suppressed for ${minutes} minute(s)`);
    if (onCleanup) onCleanup();
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
          saveSuppressState();
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
            debugInfo: matchingCombinations,
            sections: alertItem.sections || []
          });
          shownAlerts.add(alertItem.id);
          alertsTriggered++;
        }
      });

      // Show final results and display alerts
      DebugLogger.logFinalResults(alerts.length, alertsTriggered, triggeredAlerts);

      if (alertsTriggered > 0) {
        // Show alerts sequentially, deduplicating by section-1 content
        const shownMessages = new Set();
        let delay = 0;
        triggeredAlerts.forEach(alertObj => {
          const primaryText = resolveSectionContents(alertObj.sections, alertObj.message)[0] || alertObj.message;
          if (shownMessages.has(primaryText)) return;
          shownMessages.add(primaryText);

          setTimeout(async () => {
            DebugLogger.log('ALERT', `Displaying: "${primaryText}"`);
            // showCustomAlert reads debugMode/sectionNames from storage internally
            await showCustomAlert(primaryText, alertObj.id, alertObj.debugInfo, alertObj.sections);
          }, delay);
          delay += 300;
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

// handle SPA soft navigations and manual retrigger from popup
chrome.runtime.onMessage.addListener(msg => {
  if (msg && msg.type === 'url-changed') {
    alerted = false;
    shownAlerts.clear();
    console.log('🔄 URL changed - reset alert tracking');
    setTimeout(checkPage, 150);
  }
  if (msg && msg.type === 'retrigger') {
    alerted = false;
    shownAlerts.clear();
    suppressedAlerts.clear();
    saveSuppressState(); // wipe persisted suppress so storage matches
    window.settingsLogged = false;
    console.log('🔄 Manual retrigger from popup — suppress cleared');
    checkPage();
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