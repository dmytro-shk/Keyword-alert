// Tab management
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Main Triggers tab elements
const mainTriggerNameInput = document.getElementById('main-trigger-name');
const mainKeywordContainer = document.getElementById('main-keyword-container');
const addMainKeywordBtn = document.getElementById('add-main-keyword');
const saveMainTriggerBtn = document.getElementById('save-main-trigger');
const cancelMainEditBtn = document.getElementById('cancel-main-edit');
const loadMainExampleBtn = document.getElementById('load-main-example');
const mainTriggersList = document.getElementById('main-triggers-list');

// Secondary Triggers tab elements
const secondaryTriggerNameInput = document.getElementById('secondary-trigger-name');
const secondaryKeywordContainer = document.getElementById('secondary-keyword-container');
const addSecondaryKeywordBtn = document.getElementById('add-secondary-keyword');
const saveSecondaryTriggerBtn = document.getElementById('save-secondary-trigger');
const cancelSecondaryEditBtn = document.getElementById('cancel-secondary-edit');
const loadSecondaryExampleBtn = document.getElementById('load-secondary-example');
const secondaryTriggersList = document.getElementById('secondary-triggers-list');

// Alerts tab elements
const alertMainTriggersDiv = document.getElementById('alert-main-triggers');
const alertSecondaryTriggersDiv = document.getElementById('alert-secondary-triggers');
const alertMessageTextArea = document.getElementById('alert-message');
const saveAlertBtn = document.getElementById('save-alert');
const cancelAlertEditBtn = document.getElementById('cancel-alert-edit');
const clearAlertFormBtn = document.getElementById('clear-alert-form');
const alertsList = document.getElementById('alerts-list');

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
  loadMainExampleBtn.addEventListener('click', loadMainExample);

  // Secondary Triggers functionality
  addSecondaryKeywordBtn.addEventListener('click', () => addKeywordRow(secondaryKeywordContainer));
  saveSecondaryTriggerBtn.addEventListener('click', saveSecondaryTrigger);
  cancelSecondaryEditBtn.addEventListener('click', clearSecondaryTriggerForm);
  loadSecondaryExampleBtn.addEventListener('click', loadSecondaryExample);

  // Alerts functionality
  saveAlertBtn.addEventListener('click', saveAlert);
  cancelAlertEditBtn.addEventListener('click', clearAlertForm);
  clearAlertFormBtn.addEventListener('click', clearAlertForm);

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

function loadMainExample() {
  if (!confirm('This will clear the current form and load an example main trigger. Continue?')) return;

  mainTriggerNameInput.value = 'New work order creation';
  mainKeywordContainer.innerHTML = `
    <div class="keyword-row">
      <input type="text" class="keyword-input" placeholder="Keyword" value="New work order">
      <select class="operator-select">
        <option value="AND" selected>AND</option>
        <option value="OR">OR</option>
      </select>
      <button class="btn btn-danger btn-remove-keyword">×</button>
    </div>
    <div class="keyword-row">
      <input type="text" class="keyword-input" placeholder="Keyword" value="Work order summary">
      <select class="operator-select">
        <option value="AND">AND</option>
        <option value="OR" selected>OR</option>
      </select>
      <button class="btn btn-danger btn-remove-keyword">×</button>
    </div>
    <div class="keyword-row">
      <input type="text" class="keyword-input" placeholder="Keyword" value="Convert to a Work Order">
      <select class="operator-select">
        <option value="AND">AND</option>
        <option value="OR">OR</option>
      </select>
      <button class="btn btn-danger btn-remove-keyword">×</button>
    </div>
  `;
}

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

      // Switch to main triggers tab if not already there
      document.querySelector('[data-tab="main-triggers"]').click();
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
  chrome.storage.local.get(['mainTriggers'], res => {
    const mainTriggers = res.mainTriggers || [];
    console.log('Loading', mainTriggers.length, 'main triggers');

    if (!mainTriggersList) {
      console.error('mainTriggersList element not found!');
      return;
    }

    mainTriggersList.innerHTML = '';

    mainTriggers.forEach(trigger => {
      const div = document.createElement('div');
      div.className = 'preset-item';

      const keywordText = trigger.keywords.map(k =>
        k.operator ? `${k.keyword} ${k.operator}` : k.keyword
      ).join(' ');

      div.innerHTML = `
        <div class="preset-name">${trigger.name}</div>
        <div class="preset-keywords">${keywordText}</div>
        <div style="margin-top: 8px;">
          <button class="btn btn-secondary edit-main-trigger" data-trigger-id="${trigger.id}" style="margin-right: 5px;">Edit</button>
          <button class="btn btn-danger delete-main-trigger" data-trigger-id="${trigger.id}">Delete</button>
        </div>
      `;

      mainTriggersList.appendChild(div);
    });
  });
}

function deleteMainTrigger(triggerId) {
  if (!confirm('Are you sure you want to delete this main trigger?')) return;

  chrome.storage.local.get(['mainTriggers'], res => {
    const mainTriggers = (res.mainTriggers || []).filter(t => t.id !== triggerId);
    chrome.storage.local.set({ mainTriggers }, () => {
      loadMainTriggers();
      loadTriggersForAlerts();
    });
  });
}

// ===== SECONDARY TRIGGERS FUNCTIONS =====

function loadSecondaryExample() {
  if (!confirm('This will clear the current form and load an example secondary trigger. Continue?')) return;

  secondaryTriggerNameInput.value = 'Google, SEA/BLV';
  secondaryKeywordContainer.innerHTML = `
    <div class="keyword-row">
      <input type="text" class="keyword-input" placeholder="Keyword" value="Google">
      <select class="operator-select">
        <option value="AND" selected>AND</option>
        <option value="OR">OR</option>
      </select>
      <button class="btn btn-danger btn-remove-keyword">×</button>
    </div>
    <div class="keyword-row">
      <input type="text" class="keyword-input" placeholder="Keyword" value="Seattle">
      <select class="operator-select">
        <option value="AND">AND</option>
        <option value="OR" selected>OR</option>
      </select>
      <button class="btn btn-danger btn-remove-keyword">×</button>
    </div>
    <div class="keyword-row">
      <input type="text" class="keyword-input" placeholder="Keyword" value="Bellevue">
      <select class="operator-select">
        <option value="AND">AND</option>
        <option value="OR">OR</option>
      </select>
      <button class="btn btn-danger btn-remove-keyword">×</button>
    </div>
  `;
}

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

      // Switch to secondary triggers tab if not already there
      document.querySelector('[data-tab="secondary-triggers"]').click();
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
  chrome.storage.local.get(['secondaryTriggers'], res => {
    const secondaryTriggers = res.secondaryTriggers || [];
    secondaryTriggersList.innerHTML = '';

    secondaryTriggers.forEach(trigger => {
      const div = document.createElement('div');
      div.className = 'preset-item';

      const keywordText = trigger.keywords.map(k =>
        k.operator ? `${k.keyword} ${k.operator}` : k.keyword
      ).join(' ');

      div.innerHTML = `
        <div class="preset-name">${trigger.name}</div>
        <div class="preset-keywords">${keywordText}</div>
        <div style="margin-top: 8px;">
          <button class="btn btn-secondary edit-secondary-trigger" data-trigger-id="${trigger.id}" style="margin-right: 5px;">Edit</button>
          <button class="btn btn-danger delete-secondary-trigger" data-trigger-id="${trigger.id}">Delete</button>
        </div>
      `;
      secondaryTriggersList.appendChild(div);
    });
  });
}

function deleteSecondaryTrigger(triggerId) {
  if (!confirm('Are you sure you want to delete this secondary trigger?')) return;

  chrome.storage.local.get(['secondaryTriggers'], res => {
    const secondaryTriggers = (res.secondaryTriggers || []).filter(t => t.id !== triggerId);
    chrome.storage.local.set({ secondaryTriggers }, () => {
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
      alertMainTriggersDiv.innerHTML = '<p style="color: #666; font-size: 12px;">No main triggers available. Create them in the Main Triggers tab.</p>';
    } else {
      mainTriggers.forEach(trigger => {
        const div = document.createElement('div');
        div.innerHTML = `
          <label style="display: block; margin-bottom: 5px;">
            <input type="checkbox" value="${trigger.id}" style="margin-right: 5px;">
            ${trigger.name}
          </label>
        `;
        alertMainTriggersDiv.appendChild(div);
      });
    }

    // Load secondary triggers checkboxes
    alertSecondaryTriggersDiv.innerHTML = '';
    if (secondaryTriggers.length === 0) {
      alertSecondaryTriggersDiv.innerHTML = '<p style="color: #666; font-size: 12px;">No secondary triggers available. Create them in the Secondary Triggers tab.</p>';
    } else {
      secondaryTriggers.forEach(trigger => {
        const div = document.createElement('div');
        div.innerHTML = `
          <label style="display: block; margin-bottom: 5px;">
            <input type="checkbox" value="${trigger.id}" style="margin-right: 5px;">
            ${trigger.name}
          </label>
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

      // Switch to alerts tab if not already there
      document.querySelector('[data-tab="alerts"]').click();

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
    const alerts = res.alerts || [];
    const mainTriggers = res.mainTriggers || [];
    const secondaryTriggers = res.secondaryTriggers || [];
    alertsList.innerHTML = '';

    alerts.forEach(alert => {
      const div = document.createElement('div');
      div.className = 'message-item';

      const selectedMainTriggerNames = alert.mainTriggers.map(id => {
        const trigger = mainTriggers.find(t => t.id === id);
        return trigger ? trigger.name : 'Deleted Trigger';
      });

      const selectedSecondaryTriggerNames = alert.secondaryTriggers.map(id => {
        const trigger = secondaryTriggers.find(t => t.id === id);
        return trigger ? trigger.name : 'Deleted Trigger';
      });

      div.innerHTML = `
        <div><strong>Main Triggers:</strong> ${selectedMainTriggerNames.join(', ')}</div>
        ${selectedSecondaryTriggerNames.length > 0 ? `<div><strong>Secondary Triggers:</strong> ${selectedSecondaryTriggerNames.join(', ')}</div>` : ''}
        <div style="background: #e3f2fd; padding: 8px; border-radius: 3px; margin-top: 8px;"><strong>Message:</strong> ${alert.message}</div>
        <div style="margin-top: 8px;">
          <button class="btn btn-secondary edit-alert" data-alert-id="${alert.id}" style="margin-right: 5px;">Edit</button>
          <button class="btn btn-danger delete-alert" data-alert-id="${alert.id}">Delete</button>
        </div>
      `;
      alertsList.appendChild(div);
    });
  });
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

// ===== LOAD ALL DATA =====

function loadAllData() {
  loadMainTriggers();
  loadSecondaryTriggers();
  loadAlerts();
  loadTriggersForAlerts();
}

// Functions are now handled via event delegation, no need for global assignment

// Initialize when DOM is ready
init();