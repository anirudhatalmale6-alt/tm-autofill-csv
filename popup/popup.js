document.addEventListener('DOMContentLoaded', function () {
  initializeProfile();
  initializeTicketmaster();
  initializeCsvProfiles();
  loadDebugLogs();
  setupEventListeners();

  // Auto-refresh logs every 2 seconds
  setInterval(loadDebugLogs, 2000);
});

function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', function () {
      switchTab(this.dataset.tab);
    });
  });

  // Profile buttons
  document.getElementById('save-profile').addEventListener('click', saveProfile);
  document.getElementById('clear-profile').addEventListener('click', clearProfile);

  // Debug buttons
  document.getElementById('clear-logs').addEventListener('click', function () {
    chrome.storage.local.remove('debug_logs', function () {
      document.getElementById('debug-logs').innerHTML = 'Logs cleared.';
    });
  });

  // Enter key for profile input
  document.getElementById('profile-id').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      saveProfile();
    }
  });
  // Ticketmaster buttons
  document.getElementById('save-tm-password').addEventListener('click', saveTmPassword);

  // Enter key on password field
  document.getElementById('tm-password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      saveTmPassword();
    }
  });

  // CSV profile buttons
  document.getElementById('load-csv-profile').addEventListener('click', loadSelectedCsvProfile);
  document.getElementById('open-csv-settings').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
}

function switchTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
  document.getElementById(`${tab}-content`).classList.add('active');
}

async function initializeProfile() {
  const profileInput = document.getElementById('profile-id');

  try {
    // Check storage first
    const result = await chrome.storage.sync.get(['profile_name']);

    if (result.profile_name) {
      profileInput.value = result.profile_name;
      showStatus('Profile loaded', 'success');
    } else {
      // Try auto-detect
      const detected = await autoDetect();
      if (detected) {
        profileInput.value = detected;
        await chrome.storage.sync.set({ profile_name: detected });
        showStatus('Profile auto-detected', 'success');
      }
    }
  } catch (error) {
    console.error('Profile init failed:', error);
  }
}

async function autoDetect() {
  try {
    const tabs = await chrome.tabs.query({});
    for (let tab of tabs) {
      if (tab.url && tab.url.includes('whoerip.com/multilogin/')) {
        const match = tab.url.match(/multilogin\/([A-Za-z0-9]+)/);
        if (match) return match[1];
      }
    }
  } catch (error) {
    console.error('Auto-detect failed:', error);
  }
  return null;
}

async function saveProfile() {
  const profileId = document.getElementById('profile-id').value.trim();

  if (!profileId) {
    showStatus('Please enter a profile ID', 'error');
    return;
  }

  try {
    await chrome.storage.sync.set({ profile_name: profileId });
    showStatus('Profile saved', 'success');
  } catch (error) {
    showStatus('Save failed', 'error');
  }
}

async function clearProfile() {
  try {
    await chrome.storage.sync.remove(['profile_name']);
    document.getElementById('profile-id').value = '';
    showStatus('Profile cleared', 'success');
  } catch (error) {
    showStatus('Clear failed', 'error');
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';

  setTimeout(() => {
    status.style.display = 'none';
  }, 2000);
}

// Your existing debug functions
function loadDebugLogs() {
  chrome.storage.local.get(['debug_logs'], function (result) {
    const logsContainer = document.getElementById('debug-logs');
    const logs = result.debug_logs || [];

    if (logs.length === 0) {
      logsContainer.innerHTML = 'No debug logs yet.';
      return;
    }

    const logsHtml = logs
      .map((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        return `
                <div class="log-entry">
                    <div class="timestamp">${time}</div>
                    <div>${escapeHtml(log.message)}</div>
                </div>
            `;
      })
      .join('');

    logsContainer.innerHTML = logsHtml;
    logsContainer.scrollTop = logsContainer.scrollHeight;
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function saveTmPassword() {
  const newPassword = document.getElementById('tm-password').value.trim();
  if (!newPassword) {
    showTmStatus('Please enter a password', 'error');
    return;
  }

  try {
    chrome.runtime.sendMessage({ action: 'passwordUpdate', data: { newPassword } });
    showTmStatus('Ticketmaster password saved', 'success');
  } catch (error) {
    showTmStatus('Save failed', 'error');
  }
}

function showTmStatus(message, type) {
  const status = document.getElementById('tm-status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  setTimeout(() => {
    status.style.display = 'none';
  }, 2000);
}
async function initializeTicketmaster() {
  try {
    const data = await new Promise((resolve) => {
      chrome.storage.sync.get(['profileInfo'], resolve);
    });

    if (!data.profileInfo) return;
    let profileInfo = JSON.parse(data.profileInfo);
    document.querySelector('#tm-password').value = profileInfo['tm_pass'];
  } catch (error) {
    console.error('Ticketmaster init failed:', error);
  }
}

// CSV Profile Functions
async function initializeCsvProfiles() {
  try {
    const localData = await chrome.storage.local.get(['csvProfiles']);
    const profiles = localData.csvProfiles || [];

    // Update CSV count display
    const csvCountSpan = document.getElementById('csv-count');
    if (csvCountSpan) {
      csvCountSpan.textContent = profiles.length > 0
        ? `${profiles.length} profiles loaded`
        : 'No CSV data - click CSV Settings to load';
    }

    // Populate dropdown
    const select = document.getElementById('csv-profile-select');
    if (select) {
      select.innerHTML = '<option value="">-- Select Profile --</option>';
      profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.profile_name;
        option.textContent = `${profile.profile_name} - ${profile.acc_email || 'No email'}`;
        select.appendChild(option);
      });
    }

    // Show current profile if loaded from CSV
    const syncData = await chrome.storage.sync.get(['profileInfo', 'profile_name']);
    if (syncData.profile_name && select) {
      select.value = syncData.profile_name;
    }
    if (syncData.profileInfo) {
      displayCurrentCsvProfile(JSON.parse(syncData.profileInfo));
    }
  } catch (error) {
    console.error('CSV init failed:', error);
  }
}

async function loadSelectedCsvProfile() {
  const select = document.getElementById('csv-profile-select');
  const selectedProfile = select.value;

  if (!selectedProfile) {
    showCsvStatus('Please select a profile', 'error');
    return;
  }

  try {
    const localData = await chrome.storage.local.get(['csvProfiles']);
    const profiles = localData.csvProfiles || [];
    const profile = profiles.find(p => p.profile_name === selectedProfile);

    if (profile) {
      await chrome.storage.sync.set({
        profileInfo: JSON.stringify(profile),
        profile_name: profile.profile_name
      });

      // Also update the profile ID field
      document.getElementById('profile-id').value = profile.profile_name;

      showCsvStatus(`Profile "${selectedProfile}" loaded!`, 'success');
      displayCurrentCsvProfile(profile);
    } else {
      showCsvStatus('Profile not found', 'error');
    }
  } catch (error) {
    showCsvStatus('Error loading profile', 'error');
  }
}

function displayCurrentCsvProfile(profile) {
  const container = document.getElementById('current-csv-profile');
  if (!container) return;

  const displayFields = ['profile_name', 'acc_email', 'fname', 'lname', 'tel', 'address_city', 'address_state'];
  let html = '';

  displayFields.forEach(field => {
    if (profile[field]) {
      html += `<strong>${field}:</strong> ${profile[field]}<br>`;
    }
  });

  container.innerHTML = html || 'No profile data';
}

function showCsvStatus(message, type) {
  const status = document.getElementById('csv-status');
  if (!status) return;

  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';

  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}
