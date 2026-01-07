// TM AutoFill - CSV Settings Page

document.addEventListener('DOMContentLoaded', function() {
    const csvFileInput = document.getElementById('csvFile');
    const csvTextArea = document.getElementById('csvText');
    const loadCsvBtn = document.getElementById('loadCsv');
    const clearDataBtn = document.getElementById('clearData');
    const profileSelect = document.getElementById('profileSelect');
    const loadProfileBtn = document.getElementById('loadProfile');
    const currentProfileDiv = document.getElementById('currentProfile');
    const profileListDiv = document.getElementById('profileList');
    const statusDiv = document.getElementById('status');

    // Load existing data on page load
    loadExistingData();

    // CSV File upload handler
    csvFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                csvTextArea.value = event.target.result;
            };
            reader.readAsText(file);
        }
    });

    // Load CSV button handler
    loadCsvBtn.addEventListener('click', function() {
        const csvContent = csvTextArea.value.trim();
        if (!csvContent) {
            showStatus('Please upload a CSV file or paste CSV content', 'error');
            return;
        }

        try {
            const profiles = parseCSV(csvContent);
            if (profiles.length === 0) {
                showStatus('No valid profiles found in CSV', 'error');
                return;
            }

            // Store profiles in chrome.storage.local
            chrome.storage.local.set({ csvProfiles: profiles }, function() {
                showStatus(`Successfully loaded ${profiles.length} profiles!`, 'success');
                loadExistingData();
            });
        } catch (error) {
            showStatus('Error parsing CSV: ' + error.message, 'error');
        }
    });

    // Clear data button handler
    clearDataBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all profile data?')) {
            chrome.storage.local.remove(['csvProfiles', 'profileInfo', 'profile_name'], function() {
                chrome.storage.sync.remove(['profileInfo', 'profile_name'], function() {
                    showStatus('All profile data cleared', 'info');
                    loadExistingData();
                });
            });
        }
    });

    // Load selected profile button handler
    loadProfileBtn.addEventListener('click', function() {
        const selectedProfile = profileSelect.value;
        if (!selectedProfile) {
            showStatus('Please select a profile', 'error');
            return;
        }

        chrome.storage.local.get(['csvProfiles'], function(data) {
            const profiles = data.csvProfiles || [];
            const profile = profiles.find(p => p.profile_name === selectedProfile);

            if (profile) {
                // Store as active profile in both sync and local storage
                chrome.storage.sync.set({
                    profileInfo: JSON.stringify(profile),
                    profile_name: profile.profile_name
                }, function() {
                    chrome.storage.local.set({
                        profileInfo: JSON.stringify(profile),
                        profile_name: profile.profile_name
                    }, function() {
                        showStatus(`Profile "${selectedProfile}" loaded successfully!`, 'success');
                        displayCurrentProfile(profile);
                    });
                });
            }
        });
    });

    // Parse CSV content into array of profile objects
    function parseCSV(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV must have at least a header row and one data row');
        }

        // Parse header row
        const headers = parseCSVLine(lines[0]);

        // Parse data rows
        const profiles = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

            const profile = {};
            headers.forEach((header, index) => {
                profile[header.trim()] = values[index] ? values[index].trim() : '';
            });

            // Generate full_name if not present
            if (!profile.full_name && profile.fname && profile.lname) {
                profile.full_name = profile.fname + ' ' + profile.lname;
            }

            // Generate uuid from profile_name if not present
            if (!profile.uuid) {
                profile.uuid = profile.profile_name || 'profile_' + i;
            }

            profiles.push(profile);
        }

        return profiles;
    }

    // Parse a single CSV line (handles quoted values with commas)
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);

        return result.map(val => val.replace(/^"|"$/g, '').trim());
    }

    // Load existing data from storage
    function loadExistingData() {
        chrome.storage.local.get(['csvProfiles'], function(localData) {
            const profiles = localData.csvProfiles || [];

            // Update profile dropdown
            profileSelect.innerHTML = '<option value="">-- Select Profile --</option>';
            profiles.forEach(profile => {
                const option = document.createElement('option');
                option.value = profile.profile_name;
                option.textContent = `${profile.profile_name} - ${profile.acc_email || 'No email'}`;
                profileSelect.appendChild(option);
            });

            // Update profile list table
            if (profiles.length > 0) {
                let tableHTML = '<table><thead><tr><th>Profile</th><th>Email</th><th>Name</th><th>Phone</th></tr></thead><tbody>';
                profiles.forEach(profile => {
                    tableHTML += `<tr>
                        <td>${profile.profile_name || '-'}</td>
                        <td>${profile.acc_email || '-'}</td>
                        <td>${profile.fname || ''} ${profile.lname || ''}</td>
                        <td>${profile.tel || '-'}</td>
                    </tr>`;
                });
                tableHTML += '</tbody></table>';
                profileListDiv.innerHTML = tableHTML;
            } else {
                profileListDiv.innerHTML = '<p>No profiles loaded yet</p>';
            }

            // Load current profile
            chrome.storage.sync.get(['profileInfo', 'profile_name'], function(syncData) {
                if (syncData.profileInfo) {
                    try {
                        const currentProfile = JSON.parse(syncData.profileInfo);
                        displayCurrentProfile(currentProfile);

                        // Select current profile in dropdown
                        if (syncData.profile_name) {
                            profileSelect.value = syncData.profile_name;
                        }
                    } catch (e) {
                        currentProfileDiv.innerHTML = '<p>Error loading current profile</p>';
                    }
                } else {
                    currentProfileDiv.innerHTML = '<p>No profile loaded</p>';
                }
            });
        });
    }

    // Display current profile info
    function displayCurrentProfile(profile) {
        const displayFields = [
            'profile_name', 'acc_email', 'fname', 'lname', 'full_name',
            'address_address', 'address_city', 'address_state', 'address_zip',
            'tel', 'visa_num', 'visa_exp', 'amex_num', 'amex_exp'
        ];

        let html = '';
        displayFields.forEach(field => {
            if (profile[field]) {
                let value = profile[field];
                // Mask sensitive data
                if (field.includes('num') && value.length > 4) {
                    value = '****' + value.slice(-4);
                }
                if (field.includes('cvv')) {
                    value = '***';
                }
                html += `<strong>${field}:</strong> ${value}\n`;
            }
        });

        currentProfileDiv.innerHTML = html || '<p>No profile data</p>';
    }

    // Show status message
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusDiv.className = 'status';
        }, 5000);
    }
});
