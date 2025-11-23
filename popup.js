// Tab management
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Main Triggers tab elements
const mainTriggerNameInput = document.getElementById('main-trigger-name');
const mainKeywordContainer = document.getElementById('main-keyword-container');
const addMainKeywordBtn = document.getElementById('add-main-keyword');
const saveMainTriggerBtn = document.getElementById('save-main-trigger');
const cancelMainEditBtn = document.getElementById('cancel-main-edit');
const mainTriggersList = document.getElementById('main-triggers-list');

// Secondary Triggers tab elements
const secondaryTriggerNameInput = document.getElementById('secondary-trigger-name');
const secondaryKeywordContainer = document.getElementById('secondary-keyword-container');
const addSecondaryKeywordBtn = document.getElementById('add-secondary-keyword');
const saveSecondaryTriggerBtn = document.getElementById('save-secondary-trigger');
const cancelSecondaryEditBtn = document.getElementById('cancel-secondary-edit');
const secondaryTriggersList = document.getElementById('secondary-triggers-list');

// Alerts tab elements
const alertMainTriggersDiv = document.getElementById('alert-main-triggers');
const alertSecondaryTriggersDiv = document.getElementById('alert-secondary-triggers');
const alertMessageTextArea = document.getElementById('alert-message');
const saveAlertBtn = document.getElementById('save-alert');
const cancelAlertEditBtn = document.getElementById('cancel-alert-edit');
const clearAlertFormBtn = document.getElementById('clear-alert-form');
const alertsList = document.getElementById('alerts-list');

// Filter elements
const alertFilterInput = document.getElementById('alert-filter-input');
const alertFilterMain = document.getElementById('alert-filter-main');
const alertFilterSecondary = document.getElementById('alert-filter-secondary');
const clearAlertFilterBtn = document.getElementById('clear-alert-filter');
const alertCount = document.getElementById('alert-count');

// Import/Export elements
const expandBtn = document.getElementById('expand-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const clearAllBtn = document.getElementById('clear-all-btn');

// Modal elements
const createMainTriggerBtn = document.getElementById('create-main-trigger-btn');
const createSecondaryTriggerBtn = document.getElementById('create-secondary-trigger-btn');
const createAlertBtn = document.getElementById('create-alert-btn');
const mainTriggerModal = document.getElementById('main-trigger-modal');
const secondaryTriggerModal = document.getElementById('secondary-trigger-modal');
const alertModal = document.getElementById('alert-modal');

// Initialize app
function init() {
  setupTabs();
  setupEventHandlers();
  loadAllData();

}

// Tab switching functionality
function setupTabs() {
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      document.getElementById(`${targetTab}-content`).classList.add('active');

      // Refresh data when switching tabs
      if (targetTab === 'main-triggers') {
        loadMainTriggers();
      } else if (targetTab === 'secondary-triggers') {
        loadSecondaryTriggers();
      } else if (targetTab === 'alerts') {
        loadAlerts();
        loadTriggersForAlerts();
      }
    });
  });
}

// Setup all event handlers
function setupEventHandlers() {
  // Main Triggers functionality
  addMainKeywordBtn.addEventListener('click', () => addKeywordRow(mainKeywordContainer));
  saveMainTriggerBtn.addEventListener('click', saveMainTrigger);
  cancelMainEditBtn.addEventListener('click', clearMainTriggerForm);

  // Secondary Triggers functionality
  addSecondaryKeywordBtn.addEventListener('click', () => addKeywordRow(secondaryKeywordContainer));
  saveSecondaryTriggerBtn.addEventListener('click', saveSecondaryTrigger);
  cancelSecondaryEditBtn.addEventListener('click', clearSecondaryTriggerForm);

  // Alerts functionality
  saveAlertBtn.addEventListener('click', saveAlert);
  cancelAlertEditBtn.addEventListener('click', clearAlertForm);
  clearAlertFormBtn.addEventListener('click', clearAlertForm);

  // Filter functionality
  alertFilterInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value;
    applyFiltersAndRender();
  });

  alertFilterMain.addEventListener('change', (e) => {
    currentFilters.mainTrigger = e.target.value;
    applyFiltersAndRender();
  });

  alertFilterSecondary.addEventListener('change', (e) => {
    currentFilters.secondaryTrigger = e.target.value;
    applyFiltersAndRender();
  });

  clearAlertFilterBtn.addEventListener('click', clearAllFilters);

  // Modal functionality
  createMainTriggerBtn.addEventListener('click', () => openModal(mainTriggerModal));
  createSecondaryTriggerBtn.addEventListener('click', () => openModal(secondaryTriggerModal));
  createAlertBtn.addEventListener('click', () => {
    openModal(alertModal);
    loadTriggersForAlerts(); // Load triggers when opening alert modal
  });

  // Modal close handlers
  setupModalCloseHandlers();

  // Import/Export functionality
  expandBtn.addEventListener('click', toggleExpanded);
  exportBtn.addEventListener('click', exportData);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', handleImport);
  clearAllBtn.addEventListener('click', clearAllData);

  // Keyword row removal (delegated events)
  mainKeywordContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove-keyword')) {
      removeKeywordRow(e.target, mainKeywordContainer);
    }
  });

  secondaryKeywordContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove-keyword')) {
      removeKeywordRow(e.target, secondaryKeywordContainer);
    }
  });

  // Main Triggers edit/delete button delegation
  if (mainTriggersList) {
    mainTriggersList.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-main-trigger')) {
        const triggerId = parseInt(e.target.dataset.triggerId);
        editMainTrigger(triggerId);
      } else if (e.target.classList.contains('delete-main-trigger')) {
        const triggerId = parseInt(e.target.dataset.triggerId);
        deleteMainTrigger(triggerId);
      }
    });
  } else {
    console.error('mainTriggersList not found for event delegation');
  }

  // Secondary Triggers edit/delete button delegation
  if (secondaryTriggersList) {
    secondaryTriggersList.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-secondary-trigger')) {
        const triggerId = parseInt(e.target.dataset.triggerId);
        editSecondaryTrigger(triggerId);
      } else if (e.target.classList.contains('delete-secondary-trigger')) {
        const triggerId = parseInt(e.target.dataset.triggerId);
        deleteSecondaryTrigger(triggerId);
      }
    });
  } else {
    console.error('secondaryTriggersList not found for event delegation');
  }

  // Alerts edit/delete button delegation
  if (alertsList) {
    alertsList.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-alert')) {
        const alertId = parseInt(e.target.dataset.alertId);
        editAlert(alertId);
      } else if (e.target.classList.contains('delete-alert')) {
        const alertId = parseInt(e.target.dataset.alertId);
        deleteAlert(alertId);
      }
    });
  } else {
    console.error('alertsList not found for event delegation');
  }
}

// ===== SHARED UTILITY FUNCTIONS =====

// Generic function to add keyword row to any container
function addKeywordRow(container) {
  const row = document.createElement('div');
  row.className = 'keyword-row';
  row.innerHTML = `
    <input type="text" class="keyword-input" placeholder="Keyword">
    <select class="operator-select">
      <option value="AND">AND</option>
      <option value="OR">OR</option>
    </select>
    <button class="btn btn-danger btn-remove-keyword">×</button>
  `;
  container.appendChild(row);
}

// Generic function to remove keyword row from any container
function removeKeywordRow(button, container) {
  const row = button.parentElement;
  if (container.children.length > 1) {
    row.remove();
  } else {
    alert('At least one keyword is required.');
  }
}

// Generic function to extract keywords from container
function extractKeywords(container) {
  const keywordRows = container.querySelectorAll('.keyword-row');
  const keywords = [];

  for (let i = 0; i < keywordRows.length; i++) {
    const row = keywordRows[i];
    const keyword = row.querySelector('.keyword-input').value.trim();
    const operator = row.querySelector('.operator-select').value;

    if (!keyword) {
      return null; // Invalid - missing keyword
    }

    keywords.push({ keyword, operator });
  }

  // Remove the operator from the last keyword (no operator after last item)
  if (keywords.length > 0) {
    delete keywords[keywords.length - 1].operator;
  }

  return keywords;
}

// Generic function to evaluate trigger with AND/OR logic
function evaluateTrigger(trigger, text) {
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

  return result;
}

// ===== MAIN TRIGGERS FUNCTIONS =====


// Variable to track if we're editing
let editingMainTriggerId = null;

function saveMainTrigger() {
  const name = mainTriggerNameInput.value.trim();
  if (!name) {
    alert('Please enter a main trigger name.');
    return;
  }

  const keywords = extractKeywords(mainKeywordContainer);
  if (!keywords) {
    alert('Please fill in all keywords.');
    return;
  }

  chrome.storage.local.get(['mainTriggers'], res => {
    let mainTriggers = res.mainTriggers || [];

    if (editingMainTriggerId) {
      // Update existing trigger
      const index = mainTriggers.findIndex(t => t.id === editingMainTriggerId);
      if (index !== -1) {
        mainTriggers[index] = { name, keywords, id: editingMainTriggerId, type: 'main' };
      }
      editingMainTriggerId = null;
      saveMainTriggerBtn.textContent = 'Save Main Trigger';
    } else {
      // Create new trigger
      const mainTrigger = { name, keywords, id: Date.now(), type: 'main' };
      mainTriggers.push(mainTrigger);
    }

    chrome.storage.local.set({ mainTriggers }, () => {
      alert('Main trigger saved!');
      clearMainTriggerForm();
      loadMainTriggers();
      loadTriggersForAlerts(); // Refresh alerts tab if open
      closeModalAfterSave('main');
    });
  });
}

function editMainTrigger(triggerId) {
  chrome.storage.local.get(['mainTriggers'], res => {
    const mainTriggers = res.mainTriggers || [];
    const trigger = mainTriggers.find(t => t.id === triggerId);

    if (trigger) {
      // Set editing mode
      editingMainTriggerId = triggerId;
      saveMainTriggerBtn.textContent = 'Update Main Trigger';
      cancelMainEditBtn.style.display = 'inline-block';

      // Load trigger data into form
      mainTriggerNameInput.value = trigger.name;

      // Clear container and add keyword rows
      mainKeywordContainer.innerHTML = '';
      trigger.keywords.forEach((keyword, index) => {
        const row = document.createElement('div');
        row.className = 'keyword-row';
        row.innerHTML = `
          <input type="text" class="keyword-input" placeholder="Keyword" value="${keyword.keyword}">
          <select class="operator-select">
            <option value="AND" ${keyword.operator === 'AND' ? 'selected' : ''}>AND</option>
            <option value="OR" ${keyword.operator === 'OR' ? 'selected' : ''}>OR</option>
          </select>
          <button class="btn btn-danger btn-remove-keyword">×</button>
        `;
        mainKeywordContainer.appendChild(row);
      });

      // Open main trigger modal for editing
      openModal(mainTriggerModal);
    }
  });
}

function clearMainTriggerForm() {
  editingMainTriggerId = null;
  saveMainTriggerBtn.textContent = 'Save Main Trigger';
  cancelMainEditBtn.style.display = 'none';
  mainTriggerNameInput.value = '';
  mainKeywordContainer.innerHTML = `
    <div class="keyword-row">
      <input type="text" class="keyword-input" placeholder="Keyword">
      <select class="operator-select">
        <option value="AND">AND</option>
        <option value="OR">OR</option>
      </select>
      <button class="btn btn-danger btn-remove-keyword">×</button>
    </div>
  `;
}

function loadMainTriggers() {
  chrome.storage.local.get(['mainTriggers', 'alerts'], res => {
    const mainTriggers = res.mainTriggers || [];
    const alerts = res.alerts || [];
    console.log('Loading', mainTriggers.length, 'main triggers');

    if (!mainTriggersList) {
      console.error('mainTriggersList element not found!');
      return;
    }

    mainTriggersList.innerHTML = '';

    if (mainTriggers.length === 0) {
      mainTriggersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚡</div>
          <div class="empty-state-text">No main triggers yet</div>
          <div class="empty-state-subtext">Create your first trigger above</div>
        </div>
      `;
      return;
    }

    mainTriggers.forEach(trigger => {
      const div = document.createElement('div');
      div.className = 'trigger-item';

      const keywordText = trigger.keywords.map(k =>
        k.operator ? `${k.keyword} ${k.operator}` : k.keyword
      ).join(' ');

      // Check if this trigger is used in any alerts
      const alertsUsingTrigger = alerts.filter(alert =>
        alert.mainTriggers.includes(trigger.id)
      );
      const isInUse = alertsUsingTrigger.length > 0;
      const usageBadge = isInUse
        ? `<span class="usage-badge" title="Used in ${alertsUsingTrigger.length} alert(s)">🔗 ${alertsUsingTrigger.length}</span>`
        : '';

      div.innerHTML = `
        <div class="item-header">
          <div class="item-title">${trigger.name}</div>
          ${usageBadge}
        </div>
        <div class="item-keywords">${keywordText}</div>
        <div class="item-actions">
          <button class="btn btn-secondary edit-main-trigger" data-trigger-id="${trigger.id}">Edit</button>
          <button class="btn btn-danger delete-main-trigger" data-trigger-id="${trigger.id}" ${isInUse ? 'title="Cannot delete - trigger is in use"' : ''}>Delete</button>
        </div>
      `;

      mainTriggersList.appendChild(div);
    });
  });
}

function deleteMainTrigger(triggerId) {
  // Check if this trigger is used in any alerts before deletion
  chrome.storage.local.get(['alerts', 'mainTriggers'], res => {
    const alerts = res.alerts || [];
    const mainTriggers = res.mainTriggers || [];
    const trigger = mainTriggers.find(t => t.id === triggerId);

    if (!trigger) return;

    // Find alerts that use this main trigger
    const alertsUsingTrigger = alerts.filter(alert =>
      alert.mainTriggers.includes(triggerId)
    );

    if (alertsUsingTrigger.length > 0) {
      const alertMessages = alertsUsingTrigger.map(alert => `• "${alert.message}"`).join('\n');
      alert(`Cannot delete "${trigger.name}" because it is being used in ${alertsUsingTrigger.length} alert(s):\n\n${alertMessages}\n\nPlease remove or edit these alerts first.`);
      return;
    }

    // Proceed with deletion if not in use
    if (!confirm(`Are you sure you want to delete the main trigger "${trigger.name}"?`)) return;

    const updatedMainTriggers = mainTriggers.filter(t => t.id !== triggerId);
    chrome.storage.local.set({ mainTriggers: updatedMainTriggers }, () => {
      loadMainTriggers();
      loadTriggersForAlerts();
    });
  });
}

// ===== SECONDARY TRIGGERS FUNCTIONS =====


// Variable to track if we're editing
let editingSecondaryTriggerId = null;

function saveSecondaryTrigger() {
  const name = secondaryTriggerNameInput.value.trim();
  if (!name) {
    alert('Please enter a secondary trigger name.');
    return;
  }

  const keywords = extractKeywords(secondaryKeywordContainer);
  if (!keywords) {
    alert('Please fill in all keywords.');
    return;
  }

  chrome.storage.local.get(['secondaryTriggers'], res => {
    let secondaryTriggers = res.secondaryTriggers || [];

    if (editingSecondaryTriggerId) {
      // Update existing trigger
      const index = secondaryTriggers.findIndex(t => t.id === editingSecondaryTriggerId);
      if (index !== -1) {
        secondaryTriggers[index] = { name, keywords, id: editingSecondaryTriggerId, type: 'secondary' };
      }
      editingSecondaryTriggerId = null;
      saveSecondaryTriggerBtn.textContent = 'Save Secondary Trigger';
    } else {
      // Create new trigger
      const secondaryTrigger = { name, keywords, id: Date.now(), type: 'secondary' };
      secondaryTriggers.push(secondaryTrigger);
    }

    chrome.storage.local.set({ secondaryTriggers }, () => {
      alert('Secondary trigger saved!');
      clearSecondaryTriggerForm();
      loadSecondaryTriggers();
      loadTriggersForAlerts(); // Refresh alerts tab if open
      closeModalAfterSave('secondary');
    });
  });
}

function editSecondaryTrigger(triggerId) {
  chrome.storage.local.get(['secondaryTriggers'], res => {
    const secondaryTriggers = res.secondaryTriggers || [];
    const trigger = secondaryTriggers.find(t => t.id === triggerId);

    if (trigger) {
      // Set editing mode
      editingSecondaryTriggerId = triggerId;
      saveSecondaryTriggerBtn.textContent = 'Update Secondary Trigger';
      cancelSecondaryEditBtn.style.display = 'inline-block';

      // Load trigger data into form
      secondaryTriggerNameInput.value = trigger.name;

      // Clear container and add keyword rows
      secondaryKeywordContainer.innerHTML = '';
      trigger.keywords.forEach((keyword, index) => {
        const row = document.createElement('div');
        row.className = 'keyword-row';
        row.innerHTML = `
          <input type="text" class="keyword-input" placeholder="Keyword" value="${keyword.keyword}">
          <select class="operator-select">
            <option value="AND" ${keyword.operator === 'AND' ? 'selected' : ''}>AND</option>
            <option value="OR" ${keyword.operator === 'OR' ? 'selected' : ''}>OR</option>
          </select>
          <button class="btn btn-danger btn-remove-keyword">×</button>
        `;
        secondaryKeywordContainer.appendChild(row);
      });

      // Open secondary trigger modal for editing
      openModal(secondaryTriggerModal);
    }
  });
}

function clearSecondaryTriggerForm() {
  editingSecondaryTriggerId = null;
  saveSecondaryTriggerBtn.textContent = 'Save Secondary Trigger';
  cancelSecondaryEditBtn.style.display = 'none';
  secondaryTriggerNameInput.value = '';
  secondaryKeywordContainer.innerHTML = `
    <div class="keyword-row">
      <input type="text" class="keyword-input" placeholder="Keyword">
      <select class="operator-select">
        <option value="AND">AND</option>
        <option value="OR">OR</option>
      </select>
      <button class="btn btn-danger btn-remove-keyword">×</button>
    </div>
  `;
}

function loadSecondaryTriggers() {
  chrome.storage.local.get(['secondaryTriggers', 'alerts'], res => {
    const secondaryTriggers = res.secondaryTriggers || [];
    const alerts = res.alerts || [];
    secondaryTriggersList.innerHTML = '';

    if (secondaryTriggers.length === 0) {
      secondaryTriggersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <div class="empty-state-text">No secondary triggers yet</div>
          <div class="empty-state-subtext">Create your first trigger above</div>
        </div>
      `;
      return;
    }

    secondaryTriggers.forEach(trigger => {
      const div = document.createElement('div');
      div.className = 'trigger-item';

      const keywordText = trigger.keywords.map(k =>
        k.operator ? `${k.keyword} ${k.operator}` : k.keyword
      ).join(' ');

      // Check if this trigger is used in any alerts
      const alertsUsingTrigger = alerts.filter(alert =>
        alert.secondaryTriggers.includes(trigger.id)
      );
      const isInUse = alertsUsingTrigger.length > 0;
      const usageBadge = isInUse
        ? `<span class="usage-badge" title="Used in ${alertsUsingTrigger.length} alert(s)">🔗 ${alertsUsingTrigger.length}</span>`
        : '';

      div.innerHTML = `
        <div class="item-header">
          <div class="item-title">${trigger.name}</div>
          ${usageBadge}
        </div>
        <div class="item-keywords">${keywordText}</div>
        <div class="item-actions">
          <button class="btn btn-secondary edit-secondary-trigger" data-trigger-id="${trigger.id}">Edit</button>
          <button class="btn btn-danger delete-secondary-trigger" data-trigger-id="${trigger.id}" ${isInUse ? 'title="Cannot delete - trigger is in use"' : ''}>Delete</button>
        </div>
      `;
      secondaryTriggersList.appendChild(div);
    });
  });
}

function deleteSecondaryTrigger(triggerId) {
  // Check if this trigger is used in any alerts before deletion
  chrome.storage.local.get(['alerts', 'secondaryTriggers'], res => {
    const alerts = res.alerts || [];
    const secondaryTriggers = res.secondaryTriggers || [];
    const trigger = secondaryTriggers.find(t => t.id === triggerId);

    if (!trigger) return;

    // Find alerts that use this secondary trigger
    const alertsUsingTrigger = alerts.filter(alert =>
      alert.secondaryTriggers.includes(triggerId)
    );

    if (alertsUsingTrigger.length > 0) {
      const alertMessages = alertsUsingTrigger.map(alert => `• "${alert.message}"`).join('\n');
      alert(`Cannot delete "${trigger.name}" because it is being used in ${alertsUsingTrigger.length} alert(s):\n\n${alertMessages}\n\nPlease remove or edit these alerts first.`);
      return;
    }

    // Proceed with deletion if not in use
    if (!confirm(`Are you sure you want to delete the secondary trigger "${trigger.name}"?`)) return;

    const updatedSecondaryTriggers = secondaryTriggers.filter(t => t.id !== triggerId);
    chrome.storage.local.set({ secondaryTriggers: updatedSecondaryTriggers }, () => {
      loadSecondaryTriggers();
      loadTriggersForAlerts();
    });
  });
}

// ===== ALERTS FUNCTIONS =====

function loadTriggersForAlerts(callback) {
  chrome.storage.local.get(['mainTriggers', 'secondaryTriggers'], res => {
    const mainTriggers = res.mainTriggers || [];
    const secondaryTriggers = res.secondaryTriggers || [];

    // Load main triggers checkboxes
    alertMainTriggersDiv.innerHTML = '';
    if (mainTriggers.length === 0) {
      alertMainTriggersDiv.innerHTML = `
        <div class="empty-state-text">No main triggers available</div>
        <div class="empty-state-subtext">Create them in the Main Triggers tab</div>
      `;
    } else {
      mainTriggers.forEach(trigger => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
          <input type="checkbox" value="${trigger.id}" id="main-${trigger.id}">
          <label for="main-${trigger.id}">${trigger.name}</label>
        `;
        alertMainTriggersDiv.appendChild(div);
      });
    }

    // Load secondary triggers checkboxes
    alertSecondaryTriggersDiv.innerHTML = '';
    if (secondaryTriggers.length === 0) {
      alertSecondaryTriggersDiv.innerHTML = `
        <div class="empty-state-text">No secondary triggers available</div>
        <div class="empty-state-subtext">Create them in the Secondary Triggers tab</div>
      `;
    } else {
      secondaryTriggers.forEach(trigger => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
          <input type="checkbox" value="${trigger.id}" id="secondary-${trigger.id}">
          <label for="secondary-${trigger.id}">${trigger.name}</label>
        `;
        alertSecondaryTriggersDiv.appendChild(div);
      });
    }

    // Call callback if provided
    if (callback && typeof callback === 'function') {
      callback();
    }
  });
}

// Variable to track if we're editing
let editingAlertId = null;

// Filter state
let allAlerts = [];
let filteredAlerts = [];
let currentFilters = {
  search: '',
  mainTrigger: '',
  secondaryTrigger: ''
};

function saveAlert() {
  const selectedMainTriggers = Array.from(alertMainTriggersDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));
  const selectedSecondaryTriggers = Array.from(alertSecondaryTriggersDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));
  const alertMessage = alertMessageTextArea.value.trim();

  if (selectedMainTriggers.length === 0) {
    alert('Please select at least one main trigger.');
    return;
  }

  if (!alertMessage) {
    alert('Please enter an alert message.');
    return;
  }

  chrome.storage.local.get(['alerts'], res => {
    let alerts = res.alerts || [];

    if (editingAlertId) {
      // Update existing alert
      const index = alerts.findIndex(a => a.id === editingAlertId);
      if (index !== -1) {
        alerts[index] = {
          id: editingAlertId,
          mainTriggers: selectedMainTriggers,
          secondaryTriggers: selectedSecondaryTriggers,
          message: alertMessage
        };
      }
      editingAlertId = null;
      saveAlertBtn.textContent = 'Save Alert';
    } else {
      // Create new alert
      const newAlert = {
        id: Date.now(),
        mainTriggers: selectedMainTriggers,
        secondaryTriggers: selectedSecondaryTriggers,
        message: alertMessage
      };
      alerts.push(newAlert);
    }

    chrome.storage.local.set({ alerts }, () => {
      const isEditing = editingAlertId !== null;
      alert(isEditing ? 'Alert updated!' : 'Alert saved! You can create another one with the same triggers or change selections.');

      // Only clear the message text, keep checkboxes for easier multiple alert creation
      alertMessageTextArea.value = '';

      if (isEditing) {
        // If we were editing, clear everything and reset to create mode
        clearAlertForm();
      }

      loadAlerts();
      closeModalAfterSave('alert');
    });
  });
}

function editAlert(alertId) {
  chrome.storage.local.get(['alerts'], res => {
    const alerts = res.alerts || [];
    const alertToEdit = alerts.find(a => a.id === alertId);

    if (alertToEdit) {
      // Set editing mode
      editingAlertId = alertId;
      saveAlertBtn.textContent = 'Update Alert';
      cancelAlertEditBtn.style.display = 'inline-block';

      // Load alert data into form
      alertMessageTextArea.value = alertToEdit.message;

      // Open alert modal for editing
      openModal(alertModal);

      // Load triggers first, then check the appropriate ones
      loadTriggersForAlerts(() => {
        // This callback runs after triggers are loaded
        setTimeout(() => {
          // Check the appropriate checkboxes
          alertMainTriggersDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = alertToEdit.mainTriggers.includes(parseInt(cb.value));
          });

          alertSecondaryTriggersDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = alertToEdit.secondaryTriggers.includes(parseInt(cb.value));
          });

          console.log('Edit Alert: Checkboxes updated for alert ID', alertId);
        }, 50); // Small delay to ensure DOM is updated
      });
    }
  });
}

function clearAlertForm() {
  editingAlertId = null;
  saveAlertBtn.textContent = 'Save Alert';
  cancelAlertEditBtn.style.display = 'none';
  // Clear checkboxes
  alertMainTriggersDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  alertSecondaryTriggersDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  alertMessageTextArea.value = '';
}

function loadAlerts() {
  chrome.storage.local.get(['alerts', 'mainTriggers', 'secondaryTriggers'], res => {
    allAlerts = res.alerts || [];
    const mainTriggers = res.mainTriggers || [];
    const secondaryTriggers = res.secondaryTriggers || [];

    // Update filter dropdowns
    updateFilterDropdowns(mainTriggers, secondaryTriggers);

    // Apply current filters and render
    applyFiltersAndRender();
  });
}

function updateFilterDropdowns(mainTriggers, secondaryTriggers) {
  // Update main triggers dropdown
  alertFilterMain.innerHTML = '<option value="">All Main Triggers</option>';
  mainTriggers.forEach(trigger => {
    const option = document.createElement('option');
    option.value = trigger.id;
    option.textContent = trigger.name;
    alertFilterMain.appendChild(option);
  });

  // Update secondary triggers dropdown
  alertFilterSecondary.innerHTML = '<option value="">All Secondary Triggers</option>';
  secondaryTriggers.forEach(trigger => {
    const option = document.createElement('option');
    option.value = trigger.id;
    option.textContent = trigger.name;
    alertFilterSecondary.appendChild(option);
  });

  // Restore selected filter values
  alertFilterMain.value = currentFilters.mainTrigger;
  alertFilterSecondary.value = currentFilters.secondaryTrigger;
}

function applyFiltersAndRender() {
  chrome.storage.local.get(['mainTriggers', 'secondaryTriggers'], res => {
    const mainTriggers = res.mainTriggers || [];
    const secondaryTriggers = res.secondaryTriggers || [];

    // Filter alerts based on current filters
    filteredAlerts = allAlerts.filter(alert => {
      // Enhanced search filter - search across all possible fields
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        let searchFound = false;

        // Search in alert message
        if (alert.message.toLowerCase().includes(searchLower)) {
          searchFound = true;
        }

        // Search in main trigger names and keywords
        if (!searchFound) {
          for (const mainTriggerId of alert.mainTriggers) {
            const mainTrigger = mainTriggers.find(t => t.id === mainTriggerId);
            if (mainTrigger) {
              // Search in trigger name
              if (mainTrigger.name.toLowerCase().includes(searchLower)) {
                searchFound = true;
                break;
              }
              // Search in trigger keywords
              if (mainTrigger.keywords && mainTrigger.keywords.some(kw =>
                kw.keyword.toLowerCase().includes(searchLower)
              )) {
                searchFound = true;
                break;
              }
            }
          }
        }

        // Search in secondary trigger names and keywords
        if (!searchFound) {
          for (const secondaryTriggerId of alert.secondaryTriggers) {
            const secondaryTrigger = secondaryTriggers.find(t => t.id === secondaryTriggerId);
            if (secondaryTrigger) {
              // Search in trigger name
              if (secondaryTrigger.name.toLowerCase().includes(searchLower)) {
                searchFound = true;
                break;
              }
              // Search in trigger keywords
              if (secondaryTrigger.keywords && secondaryTrigger.keywords.some(kw =>
                kw.keyword.toLowerCase().includes(searchLower)
              )) {
                searchFound = true;
                break;
              }
            }
          }
        }

        // If search term wasn't found anywhere, exclude this alert
        if (!searchFound) {
          return false;
        }
      }

      // Main trigger filter
      if (currentFilters.mainTrigger) {
        const mainTriggerId = parseInt(currentFilters.mainTrigger);
        if (!alert.mainTriggers.includes(mainTriggerId)) {
          return false;
        }
      }

      // Secondary trigger filter
      if (currentFilters.secondaryTrigger) {
        const secondaryTriggerId = parseInt(currentFilters.secondaryTrigger);
        if (!alert.secondaryTriggers.includes(secondaryTriggerId)) {
          return false;
        }
      }

      return true;
    });

    // Update count
    updateAlertCount();

    // Render filtered alerts
    renderFilteredAlerts(mainTriggers, secondaryTriggers);
  });
}

function updateAlertCount() {
  if (allAlerts.length === 0) {
    alertCount.textContent = '';
  } else if (filteredAlerts.length === allAlerts.length) {
    alertCount.textContent = `${allAlerts.length} alert${allAlerts.length !== 1 ? 's' : ''}`;
  } else {
    alertCount.textContent = `${filteredAlerts.length} of ${allAlerts.length} alert${allAlerts.length !== 1 ? 's' : ''}`;
  }
}

function renderFilteredAlerts(mainTriggers, secondaryTriggers) {
  alertsList.innerHTML = '';

  if (allAlerts.length === 0) {
    alertsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔔</div>
        <div class="empty-state-text">No alerts configured</div>
        <div class="empty-state-subtext">Create your first alert above</div>
      </div>
    `;
    return;
  }

  if (filteredAlerts.length === 0) {
    alertsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-text">No alerts match your filters</div>
        <div class="empty-state-subtext">Try adjusting your search or filters</div>
      </div>
    `;
    return;
  }

  filteredAlerts.forEach(alert => {
    const div = document.createElement('div');
    div.className = 'alert-item';

    const selectedMainTriggerNames = alert.mainTriggers.map(id => {
      const trigger = mainTriggers.find(t => t.id === id);
      return trigger ? trigger.name : 'Deleted Trigger';
    });

    const selectedSecondaryTriggerNames = alert.secondaryTriggers.map(id => {
      const trigger = secondaryTriggers.find(t => t.id === id);
      return trigger ? trigger.name : 'Deleted Trigger';
    });

    div.innerHTML = `
      <div class="item-title">Alert: ${alert.message}</div>
      <div style="margin-bottom: 8px;">
        <strong>Main:</strong> ${selectedMainTriggerNames.join(', ')}
      </div>
      ${selectedSecondaryTriggerNames.length > 0 ? `<div style="margin-bottom: 12px;"><strong>Secondary:</strong> ${selectedSecondaryTriggerNames.join(', ')}</div>` : ''}
      <div class="alert-message">${alert.message}</div>
      <div class="item-actions">
        <button class="btn btn-secondary edit-alert" data-alert-id="${alert.id}">Edit</button>
        <button class="btn btn-danger delete-alert" data-alert-id="${alert.id}">Delete</button>
      </div>
    `;
    alertsList.appendChild(div);
  });
}

function clearAllFilters() {
  currentFilters = {
    search: '',
    mainTrigger: '',
    secondaryTrigger: ''
  };

  alertFilterInput.value = '';
  alertFilterMain.value = '';
  alertFilterSecondary.value = '';

  applyFiltersAndRender();
}

function deleteAlert(alertId) {
  if (!confirm('Are you sure you want to delete this alert?')) return;

  chrome.storage.local.get(['alerts'], res => {
    const alerts = (res.alerts || []).filter(a => a.id !== alertId);
    chrome.storage.local.set({ alerts }, () => {
      loadAlerts();
    });
  });
}

// ===== IMPORT/EXPORT FUNCTIONS =====

function exportData() {
  chrome.storage.local.get(['mainTriggers', 'secondaryTriggers', 'alerts'], res => {
    const mainTriggers = res.mainTriggers || [];
    const secondaryTriggers = res.secondaryTriggers || [];
    const alerts = res.alerts || [];

    const exportData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      exportSource: "Keyword Alert Extension",
      mergeable: true, // Indicates this export supports merging
      credits: {
        icon: "Siren icon from Flaticon",
        iconUrl: "https://www.flaticon.com/free-icon/siren_18468278"
      },
      stats: {
        mainTriggers: mainTriggers.length,
        secondaryTriggers: secondaryTriggers.length,
        alerts: alerts.length,
        totalItems: mainTriggers.length + secondaryTriggers.length + alerts.length
      },
      data: {
        mainTriggers: mainTriggers,
        secondaryTriggers: secondaryTriggers,
        alerts: alerts
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `keyword-alert-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    // Show success message
    const originalText = exportBtn.textContent;
    exportBtn.textContent = 'Exported!';
    exportBtn.style.background = 'var(--success)';
    exportBtn.style.color = 'white';

    setTimeout(() => {
      exportBtn.textContent = originalText;
      exportBtn.style.background = '';
      exportBtn.style.color = '';
    }, 2000);
  });
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importData = JSON.parse(e.target.result);

      // Validate import data structure
      if (!importData.data || !importData.data.mainTriggers || !importData.data.secondaryTriggers || !importData.data.alerts) {
        throw new Error('Invalid file format');
      }

      // Show import options dialog
      showImportOptionsDialog(importData);

    } catch (error) {
      alert('Error importing file: Invalid JSON format or corrupted file.');
      console.error('Import error:', error);
    }

    // Reset file input
    importFile.value = '';
  };

  reader.readAsText(file);
}

function showImportOptionsDialog(importData) {
  const mainCount = importData.data.mainTriggers.length;
  const secondaryCount = importData.data.secondaryTriggers.length;
  const alertCount = importData.data.alerts.length;

  const exportDate = importData.exportDate ? new Date(importData.exportDate).toLocaleDateString() : 'Unknown';
  const version = importData.version || 'Unknown';

  // Get current data counts
  chrome.storage.local.get(['mainTriggers', 'secondaryTriggers', 'alerts'], res => {
    const currentMainCount = (res.mainTriggers || []).length;
    const currentSecondaryCount = (res.secondaryTriggers || []).length;
    const currentAlertCount = (res.alerts || []).length;

    // Show simple confirmation dialog first
    const basicMessage = `Found import file with ${mainCount} main triggers, ${secondaryCount} secondary triggers, and ${alertCount} alerts.

You currently have ${currentMainCount} main triggers, ${currentSecondaryCount} secondary triggers, and ${currentAlertCount} alerts.

Do you want to MERGE the data (combine with existing) or REPLACE all data?

Click OK to MERGE, Cancel to see REPLACE option.`;

    const wantsMerge = confirm(basicMessage);

    if (wantsMerge) {
      console.log('User chose MERGE');
      performMergeImport(importData, res);
    } else {
      // Ask for replace confirmation
      const replaceConfirm = confirm(`REPLACE: This will delete ALL current data and replace with the imported data. Continue?`);
      if (replaceConfirm) {
        console.log('User chose REPLACE');
        performReplaceImport(importData);
      } else {
        console.log('User cancelled import');
        return;
      }
    }
  });
}

function performReplaceImport(importData) {
  const mainCount = importData.data.mainTriggers.length;
  const secondaryCount = importData.data.secondaryTriggers.length;
  const alertCount = importData.data.alerts.length;

  if (!confirm(`REPLACE: This will delete ALL current data and replace with ${mainCount} main trigger(s), ${secondaryCount} secondary trigger(s), and ${alertCount} alert(s). Continue?`)) {
    return;
  }

  // Replace all data (original behavior)
  chrome.storage.local.set({
    mainTriggers: importData.data.mainTriggers,
    secondaryTriggers: importData.data.secondaryTriggers,
    alerts: importData.data.alerts
  }, () => {
    loadAllData();
    showImportSuccess('Data replaced successfully!');
  });
}

function performMergeImport(importData, currentData) {
  console.log('Starting merge import...');
  console.log('Current data:', currentData);
  console.log('Import data:', importData.data);

  try {
    const mergedData = mergeConfigurations(currentData, importData.data);
    console.log('Merged data:', mergedData);

    const confirmMessage = `MERGE: This will combine the imported data with your existing data.

After merge you will have:
• Main Triggers: ${mergedData.mainTriggers.length} (${mergedData.stats.mainAdded} new)
• Secondary Triggers: ${mergedData.secondaryTriggers.length} (${mergedData.stats.secondaryAdded} new)
• Alerts: ${mergedData.alerts.length} (${mergedData.stats.alertsAdded} new)

${mergedData.stats.duplicatesSkipped > 0 ? `• ${mergedData.stats.duplicatesSkipped} duplicate(s) skipped` : ''}

Continue with merge?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    console.log('User confirmed merge, applying data...');

    // Apply merged data
    chrome.storage.local.set({
      mainTriggers: mergedData.mainTriggers,
      secondaryTriggers: mergedData.secondaryTriggers,
      alerts: mergedData.alerts
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        alert('Error saving merged data: ' + chrome.runtime.lastError.message);
        return;
      }

      console.log('Data successfully saved to storage');
      loadAllData();
      showImportSuccess(`Data merged successfully! Added ${mergedData.stats.mainAdded + mergedData.stats.secondaryAdded + mergedData.stats.alertsAdded} new items.`);
    });
  } catch (error) {
    console.error('Error during merge:', error);
    alert('Error during merge: ' + error.message);
  }
}

function mergeConfigurations(currentData, importedData) {
  console.log('mergeConfigurations called with:', { currentData, importedData });

  const current = {
    mainTriggers: currentData.mainTriggers || [],
    secondaryTriggers: currentData.secondaryTriggers || [],
    alerts: currentData.alerts || []
  };

  const imported = {
    mainTriggers: importedData.mainTriggers || [],
    secondaryTriggers: importedData.secondaryTriggers || [],
    alerts: importedData.alerts || []
  };

  console.log('Processed data:', { current, imported });

  // Generate new unique IDs to avoid conflicts
  const generateNewId = () => Date.now() + Math.floor(Math.random() * 1000);

  // Create ID mapping for imported items
  const mainTriggerIdMap = new Map();
  const secondaryTriggerIdMap = new Map();

  // Merge main triggers
  const mergedMainTriggers = [...current.mainTriggers];
  let mainAdded = 0;
  let duplicatesSkipped = 0;

  imported.mainTriggers.forEach(importedTrigger => {
    console.log('Processing imported main trigger:', importedTrigger);

    // Check for duplicate by name and keywords
    const isDuplicate = current.mainTriggers.some(existingTrigger => {
      const nameMatch = existingTrigger.name.toLowerCase() === importedTrigger.name.toLowerCase();

      // More robust keyword comparison
      const existingKeywords = existingTrigger.keywords || [];
      const importedKeywords = importedTrigger.keywords || [];
      const keywordsMatch = JSON.stringify(existingKeywords.sort()) === JSON.stringify(importedKeywords.sort());

      console.log('Comparing triggers:', {
        existing: existingTrigger.name,
        imported: importedTrigger.name,
        nameMatch,
        keywordsMatch
      });

      return nameMatch && keywordsMatch;
    });

    if (!isDuplicate) {
      const newId = generateNewId();
      const newTrigger = { ...importedTrigger, id: newId };
      mainTriggerIdMap.set(importedTrigger.id, newId);
      mergedMainTriggers.push(newTrigger);
      mainAdded++;
    } else {
      duplicatesSkipped++;
      // Map old ID to existing trigger's ID for alert mapping
      const existingTrigger = current.mainTriggers.find(t =>
        t.name.toLowerCase() === importedTrigger.name.toLowerCase() &&
        JSON.stringify(t.keywords) === JSON.stringify(importedTrigger.keywords)
      );
      if (existingTrigger) {
        mainTriggerIdMap.set(importedTrigger.id, existingTrigger.id);
      }
    }
  });

  // Merge secondary triggers
  const mergedSecondaryTriggers = [...current.secondaryTriggers];
  let secondaryAdded = 0;

  imported.secondaryTriggers.forEach(importedTrigger => {
    console.log('Processing imported secondary trigger:', importedTrigger);

    // Check for duplicate by name and keywords
    const isDuplicate = current.secondaryTriggers.some(existingTrigger => {
      const nameMatch = existingTrigger.name.toLowerCase() === importedTrigger.name.toLowerCase();

      // More robust keyword comparison
      const existingKeywords = existingTrigger.keywords || [];
      const importedKeywords = importedTrigger.keywords || [];
      const keywordsMatch = JSON.stringify(existingKeywords.sort()) === JSON.stringify(importedKeywords.sort());

      return nameMatch && keywordsMatch;
    });

    if (!isDuplicate) {
      const newId = generateNewId();
      const newTrigger = { ...importedTrigger, id: newId };
      secondaryTriggerIdMap.set(importedTrigger.id, newId);
      mergedSecondaryTriggers.push(newTrigger);
      secondaryAdded++;
    } else {
      duplicatesSkipped++;
      // Map old ID to existing trigger's ID for alert mapping
      const existingTrigger = current.secondaryTriggers.find(t =>
        t.name.toLowerCase() === importedTrigger.name.toLowerCase() &&
        JSON.stringify(t.keywords) === JSON.stringify(importedTrigger.keywords)
      );
      if (existingTrigger) {
        secondaryTriggerIdMap.set(importedTrigger.id, existingTrigger.id);
      }
    }
  });

  // Merge alerts with updated trigger IDs
  const mergedAlerts = [...current.alerts];
  let alertsAdded = 0;

  imported.alerts.forEach(importedAlert => {
    // Update trigger IDs to match merged triggers
    const updatedMainTriggers = importedAlert.mainTriggers
      .map(id => mainTriggerIdMap.get(id))
      .filter(id => id !== undefined);

    const updatedSecondaryTriggers = importedAlert.secondaryTriggers
      .map(id => secondaryTriggerIdMap.get(id))
      .filter(id => id !== undefined);

    // Only add alert if it has at least one valid main trigger
    if (updatedMainTriggers.length > 0) {
      // Check for duplicate alert by message and triggers
      const isDuplicate = current.alerts.some(existingAlert =>
        existingAlert.message.toLowerCase() === importedAlert.message.toLowerCase() &&
        JSON.stringify(existingAlert.mainTriggers.sort()) === JSON.stringify(updatedMainTriggers.sort()) &&
        JSON.stringify(existingAlert.secondaryTriggers.sort()) === JSON.stringify(updatedSecondaryTriggers.sort())
      );

      if (!isDuplicate) {
        const newAlert = {
          ...importedAlert,
          id: generateNewId(),
          mainTriggers: updatedMainTriggers,
          secondaryTriggers: updatedSecondaryTriggers
        };
        mergedAlerts.push(newAlert);
        alertsAdded++;
      } else {
        duplicatesSkipped++;
      }
    }
  });

  const result = {
    mainTriggers: mergedMainTriggers,
    secondaryTriggers: mergedSecondaryTriggers,
    alerts: mergedAlerts,
    stats: {
      mainAdded,
      secondaryAdded,
      alertsAdded,
      duplicatesSkipped
    }
  };

  console.log('Merge result:', result);
  return result;
}

function showImportSuccess(message) {
  // Show success message on import button
  const originalText = importBtn.textContent;
  importBtn.textContent = 'Imported!';
  importBtn.style.background = 'var(--success)';
  importBtn.style.color = 'white';

  setTimeout(() => {
    importBtn.textContent = originalText;
    importBtn.style.background = '';
    importBtn.style.color = '';
  }, 2000);

  alert(message);
}

function clearAllData() {
  const confirmMessage = 'Are you sure you want to clear ALL data?\n\nThis will permanently delete:\n• All main triggers\n• All secondary triggers\n• All alerts\n\nThis action cannot be undone!';

  if (!confirm(confirmMessage)) {
    return;
  }

  const doubleConfirm = 'This is your final warning!\n\nType "DELETE" to confirm you want to clear all data:';
  const userInput = prompt(doubleConfirm);

  if (userInput !== 'DELETE') {
    alert('Clear cancelled. Your data is safe.');
    return;
  }

  chrome.storage.local.set({
    mainTriggers: [],
    secondaryTriggers: [],
    alerts: []
  }, () => {
    // Clear filters
    clearAllFilters();

    // Reload all data
    loadAllData();

    // Show success message
    const originalText = clearAllBtn.textContent;
    clearAllBtn.textContent = '✅ Cleared!';
    clearAllBtn.style.background = 'var(--success)';

    setTimeout(() => {
      clearAllBtn.textContent = originalText;
      clearAllBtn.style.background = '';
    }, 2000);

    alert('All data has been cleared successfully.');
  });
}

// ===== LOAD ALL DATA =====

function loadAllData() {
  loadMainTriggers();
  loadSecondaryTriggers();
  loadAlerts();
  loadTriggersForAlerts();
}

// ===== MODAL FUNCTIONALITY =====

function openModal(modal) {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeModal(modal) {
  modal.classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
}

function setupModalCloseHandlers() {
  // Close buttons
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      closeModal(modal);
    });
  });

  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay);
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        closeModal(activeModal);
      }
    }
  });
}

// Function to close modals after successful saves
function closeModalAfterSave(modalType) {
  switch(modalType) {
    case 'main':
      closeModal(mainTriggerModal);
      break;
    case 'secondary':
      closeModal(secondaryTriggerModal);
      break;
    case 'alert':
      closeModal(alertModal);
      break;
  }
}

// ===== EXPAND FUNCTIONALITY =====

let isExpanded = false;

function toggleExpanded() {
  isExpanded = !isExpanded;

  if (isExpanded) {
    // Use Chrome extension popup maximum safe dimensions
    // Chrome typically limits popups to around 800x600 maximum
    const maxWidth = 750;
    const maxHeight = 580;

    // Apply expanded styles within Chrome's limits
    document.body.style.width = maxWidth + 'px';
    document.body.style.height = maxHeight + 'px';
    document.body.style.maxHeight = maxHeight + 'px';
    document.body.style.minHeight = 'auto';

    // Add expanded class to body for CSS-based responsive scrollable containers
    document.body.classList.add('expanded');

    // Update button text and icon
    expandBtn.textContent = '🗗 Collapse';
  } else {
    // Reset to original compact size
    document.body.style.width = '400px';
    document.body.style.height = 'auto';
    document.body.style.maxHeight = 'none';
    document.body.style.minHeight = '500px';

    // Remove expanded class to reset scrollable containers
    document.body.classList.remove('expanded');

    // Update button text and icon
    expandBtn.textContent = '⛶ Expand';
  }
}

// Functions are now handled via event delegation, no need for global assignment

// Initialize when DOM is ready
init();