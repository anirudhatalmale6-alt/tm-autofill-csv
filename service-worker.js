console.log(
  "This prints to the console of the service worker (background script)"
);

// Importing and using functionality from external files is also possible.
importScripts("service-worker-utils.js");

// If you want to import a file that is deeper in the file hierarchy of your
// extension, simply do `importScripts('path/to/file.js')`.
// The path should be relative to the file `manifest.json`.

// const TM_SERVER_URL = "http://localhost:3000/api";
const TM_SERVER_URL = "http://3.131.54.37:3000/api"; // Dev Server
const FORWARDING_SERVER_URL = "http://3.135.68.49:3000/api"; // Forwarding Server
const OTP_SERVER_URL = "http://3.130.191.60:3000/api"; // New OTP Server For Production

const PHONE_OTP_URL = "https://api.smsgateway.xyz/v1/all-sms";
const EMAIL_OTP_URL = OTP_SERVER_URL + "/getOtp";
const QUEUE_URL = TM_SERVER_URL + "/accounts";
const sync_interval = 5;

/* const spreadsheet_id = "1HIMmokAUP2TlnWOtbFPWDdH3scbFhksayJctHTqRqNE";
const sheet = 'Master'; */

// Background service worker

let intervalId;
let timeoutId;
let profileId = "";


/**
 * Function to inject script to autofill card payment options for IFrame input
 * @param {*} tabId
 * @param {*} card
 */

function debugLog(message) {
  // Always log to service worker console
  console.log(message);
  
  // Store in storage for popup to display
  chrome.storage.local.get(['debug_logs'], function(result) {
    const logs = result.debug_logs || [];
    logs.push({
      timestamp: new Date().toISOString(),
      message: message
    });
    // Keep only last 50 logs
    if (logs.length > 50) logs.shift();
    chrome.storage.local.set({debug_logs: logs});
  });
}
const executeOnAllFramesForCard = (tabId, card) => {
  chrome.webNavigation.getAllFrames(
    {
      tabId,
    },
    function (frames) {
      for (const frame of frames) {
        chrome.scripting
          .executeScript({
            target: { tabId, frameIds: [frame.frameId] },
            func: dynamicFunctionForCard,
            args: [card],
          })
          .then(() => console.log("script injected in all frames"));
      }
    }
  );
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchProfileData") {
    loadProfileData1();
  }

  if (message.action === "getEmailOTP") {
    console.log("getEmailOTP Event", message);
    const { email, otpType } = message.data;
    const { tab } = sender;
    handleEmailOTP(email, otpType, tab.id);
  }

  if (message.action === "getPhoneOTP") {
    console.log("getPhoneOtp Event", message);
    const { phone, otpType } = message.data;
    console.log("phone: ", phone);
    const { tab } = sender;
    handlePhoneOTP(phone.replace(/[-\s]/g, ""), otpType, tab.id);
  }
  /**
   * Message Hanlder to return User Email
   */
  if (message.action === "getProfileInfo") {
    chrome.identity.getProfileUserInfo(function (userInfo) {
      if (chrome.runtime.lastError) {
        // Handle errors, if any
        console.error(chrome.runtime.lastError);
      } else {
        // Respond with the user information
        console.log("userInfo: ", userInfo);
        userEmail = userInfo.email;
        sendResponse(userInfo);
      }
    });
  }

  /**
   * Message Handler to return tabs
   */
  if (message.action === "queryTabs") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // Do something with the tabs and send a response back to the content script
      sendResponse({ tabs: tabs });
    });
    return true; // Required to indicate that we will send a response asynchronously
  }

  /**
   * Message handler to autofill card detail in IFrame
   */
  if (message.action === "executeOnAllFramesForCard") {
    const { tabId, card } = message.data;
    executeOnAllFramesForCard(tabId, card);
  }

  /**
   * Message Handler to get OTP
   */
  if (message.action === "fetchLinkFromServer") {
    chrome.storage.sync.get(["profileInfo"], function (data) {
      if (!data.profileInfo) return;
      profileInfo = JSON.parse(data.profileInfo);
      const userEmail = profileInfo["acc_email"]?.toLowerCase();
      console.log("Background Script: Received message to fetch data");

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (intervalId) {
        clearInterval(intervalId);
      }

      console.log(userEmail);

      function fetchData() {
        const url = FORWARDING_SERVER_URL + "/emails";
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: userEmail.trim() }),
        })
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Network response was not ok");
            }
          })
          .then((data) => {
            if (data.link) {
              console.log("Fetch::", data);

              clearInterval(intervalId);
              clearTimeout(timeoutId);

              chrome.windows.create(
                {
                  url: data.link,
                  incognito: true,
                },
                (window) => {
                  console.log(`Incognito window: ${window}`);
                }
              );
            }
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }

      intervalId = setInterval(fetchData, 5000);
      timeoutId = setTimeout(() => clearInterval(intervalId), 30000);
    });
  }

  if (message.action === "focusTab") {
    const { tabId } = message.data;
    console.log("tab to focus:", tabId);
    chrome.tabs.update(
      tabId,
      { active: true, highlighted: true },
      function (updatedTab) {
        if (!chrome.runtime.lastError) {
          console.log(`Tab with ID ${tabId} has been focused.`);
        } else {
          console.error(
            `Error focusing on tab with ID ${tabId}: ${chrome.runtime.lastError}`
          );
        }
      }
    );
  }

  /**
   * Message handler to register TM Account into Queue
   */
  if (message.action === "registerQueue") {
    const data = message.data;
    registerQueue(data);
  }

  if (message.action === "passwordUpdate") {
    const { newPassword } = message.data;
    updateTMPassword(newPassword);
  }

  /**
   * Message hanlder to send purchase history
   */
  if (message.action == "sendPurchaseHistory") {
    const { purchaseInfo } = message.data;
    sendPurchaseHistory(purchaseInfo);
  }

  /**
   * Added by O
   */

  if (message.action == "cardInfo") {
    console.log(profileId);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      fetch(`${TM_SERVER_URL}/cards`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          sendResponse({ data, profileId });
        });
    });
    return true;
  }

  if (message.action == "citiCard") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const requestData = { profileId };

      fetch(`${TM_SERVER_URL}/cards/citiCard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })
        .then((response) => response.json())
        .then((data) => {
          sendResponse({ data });
        });
    });
    return true;
  }

  if (message.action == "setCard") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const card = message.card;
      console.log('PROFILEID', profileId);
      const requestData = { card, profileId };

      fetch(`${TM_SERVER_URL}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })
        .then((response) => response.json())
        .then((data) => {
          sendResponse({ ...data });
        });
    });
    return true;
  }
  //////////////////////////////////
});

/**
 * Function to update TM Password
 * @param {} newPassword
 */
function updateTMPassword(newPassword) {
  chrome.storage.sync.get(["profile_name"], function (data) {
    if (!data.profile_name) return;
    const URL =
      TM_SERVER_URL +
      "/extensions/changeTicketPassword/" +
      data.profile_name +
      "/old";
    const requestData = {
      newPassword: newPassword,
    };
    fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server Error: ${res.status}`);
        // refetch profile data
        loadProfileData1();
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

/**
 * Function to send purchaseInfo to system
 * @param {*} purchaseInfo
 */
function sendPurchaseHistory(purchaseInfo) {
  chrome.storage.local.get(["eventId", "profileInfo"], function (data) {
    if (!data.profileInfo) return;
    const profileInfo = JSON.parse(data.profileInfo);
    const requestData = {
      eventId: data.eventId,
      profileId: profileInfo.uuid,
      ...purchaseInfo,
    };
    const PURCHASE_HISTORY_URL =
      TM_SERVER_URL + "/extensions/savePurchaseHistory/";
    fetch(PURCHASE_HISTORY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server Error: ${res.status}`);
        console.log("history saved", res);
      })
      .catch((err) => {
        console.log("error: ", err);
      });
  });
}

function loadProfileData(profile_name) {
  // First check if we have CSV data stored locally
  chrome.storage.local.get(['csvProfiles'], function(localData) {
    const csvProfiles = localData.csvProfiles || [];

    if (csvProfiles.length > 0) {
      // Try to find profile in CSV data
      const csvProfile = csvProfiles.find(p => p.profile_name === profile_name);

      if (csvProfile) {
        console.log("Loading profile from CSV data:", profile_name);
        profileId = csvProfile.uuid || profile_name;
        chrome.storage.sync.set({ profileInfo: JSON.stringify(csvProfile) });
        debugLog("Profile loaded from CSV: " + profile_name);
        return;
      }
    }

    // Fallback to server if no CSV data or profile not found
    const EXTENSION_ENDPOINT =
      TM_SERVER_URL + "/extensions/getFillingDataByName/" + profile_name + "/old";
    console.log("EXTENSION_ENDPOINT: ", EXTENSION_ENDPOINT);
    fetch(EXTENSION_ENDPOINT)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("response: ", data);
        profileId = data.uuid;
        chrome.storage.sync.set({ profileInfo: JSON.stringify(data) });
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        debugLog("Error loading profile from server: " + error.message);
      });
  });
}

/**
 * Function to get a Multilogin Profile Name
 */
function initialize() {
  console.log("initialize");
  chrome.storage.sync.get(["profile_name"], function (result) {
    console.log("result profilename: ", result.profile_name);
    if (!result.profile_name) {
      
      // Check if MultiLogin X (scan existing tabs)
      checkMultiLoginX().then(profile_name => {
        if (profile_name) {
          debugLog("MultiLogin X profile name: " + profile_name);
          chrome.storage.sync.set({ profile_name });
          loadProfileData(profile_name);
          return;
        }
        
        // Fallback to regular MultiLogin detection
        var br = "ch";
        chrome.management.getAll(function (exts) {
          console.log("exts: ", exts);
          for (var ext of exts) {
            if (ext["name"] == "Multilogin") {
              var host;
              if (br == "ff") {
                for (per of ext["hostPermissions"]) {
                  if (per.match(/^moz-extension:/)) {
                    host = per.replace("*", "");
                    break;
                  }
                }
              } else host = "chrome-extension://" + ext["id"] + "/";
              host = host + "conf.js";
              fetch(host)
                .then((response) => response.text())
                .then((res) => {
                  var reg = res.match(/url: '([^']+?)',.+?sid: '([^']+?)'/is);

                  var mla = {};
                  mla.url = reg[1];
                  mla.sid = reg[2];

                  if (mla && "url" in mla && "sid" in mla) {
                    var url = mla.url + "s/g/" + mla.sid;
                    fetch(url)
                      .then((response) => response.text())
                      .then((res) => {
                        var response = JSON.parse(res);
                        if (
                          "status" in response &&
                          response["status"] == "OK" &&
                          "value" in response &&
                          "bed" in response["value"] &&
                          "sn" in response["value"]["bed"] &&
                          response["value"]["bed"]["sn"].length > 0
                        ) {
                          var profile_name = response["value"]["bed"]["sn"]
                            .toString()
                            .slice(-4);
                          debugLog("profile name: " + profile_name);
                          chrome.storage.sync.set({ profile_name });
                          loadProfileData(profile_name);
                        }
                      });
                  }
                })
                .catch((error) => {
                  console.log("Error: ", error);
                });
            }
          }
        });
      });
    }
  });
}

async function checkMultiLoginX() {
  try {
    // Scan all open tabs for whoerip multilogin URLs
    const allTabs = await chrome.tabs.query({});
    
    for (let tab of allTabs) {
      if (tab.url && tab.url.includes('whoerip.com/multilogin/')) {
        const profileId = extractProfileFromURL(tab.url);
        if (profileId) {
          debugLog("Found MultiLogin X profile in tab: " + profileId);
          return profileId;
        }
      }
    }
    
    // Check extension storage as fallback
    return new Promise((resolve) => {
      chrome.storage.sync.get(['mlx_profile'], (result) => {
        resolve(result.mlx_profile || null);
      });
    });
    
  } catch (error) {
    console.log("MultiLogin X check failed:", error);
    return null;
  }
}

function extractProfileFromURL(url) {
  try {
    // Extract profile ID from URL like https://whoerip.com/multilogin/01JA
    const match = url.match(/whoerip\.com\/multilogin\/([A-Za-z0-9]+)/);
    if (match && match[1]) {
      // Store it for future use
      chrome.storage.sync.set({ mlx_profile: match[1] });
      return match[1];
    }
    return null;
  } catch (error) {
    console.log("URL extraction failed:", error);
    return null;
  }
}

/**
 * Function to load information related to Profile Id for Autofill.
 */

function loadProfileData1() {
  chrome.storage.sync.get(["profile_name"], function (data) {
    if (!data.profile_name) return;
    loadProfileData(data.profile_name);
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("extension onInstalled");
  initialize();
  fetchCsvFromUrl(); // Auto-fetch CSV from saved URL
  setTimeout(() => loadProfileData1(), 1000);
  chrome.alarms.create("SYNC_DB", { periodInMinutes: sync_interval });
});

chrome.runtime.onStartup.addListener(() => {
  console.log("extension onStartup");
  initialize();
  fetchCsvFromUrl(); // Auto-fetch CSV from saved URL
  setTimeout(() => loadProfileData1(), 1000);
  chrome.alarms.create("SYNC_DB", { periodInMinutes: sync_interval });
});

/**
 * Fetch CSV data from saved Google Sheets URL
 */
async function fetchCsvFromUrl() {
  try {
    const data = await chrome.storage.local.get(['csvUrl']);
    if (!data.csvUrl) {
      console.log("No CSV URL saved");
      return;
    }

    console.log("Fetching CSV from URL:", data.csvUrl);
    const response = await fetch(data.csvUrl);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const csvContent = await response.text();
    const profiles = parseCsvContent(csvContent);

    if (profiles.length > 0) {
      await chrome.storage.local.set({ csvProfiles: profiles });
      console.log(`Loaded ${profiles.length} profiles from CSV URL`);
      debugLog(`CSV: Loaded ${profiles.length} profiles from URL`);
    }
  } catch (error) {
    console.error("Error fetching CSV:", error);
    debugLog("CSV fetch error: " + error.message);
  }
}

/**
 * Parse CSV content into profile objects
 */
function parseCsvContent(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const profiles = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

    const profile = {};
    headers.forEach((header, index) => {
      profile[header.trim()] = values[index] ? values[index].trim() : '';
    });

    if (!profile.full_name && profile.fname && profile.lname) {
      profile.full_name = profile.fname + ' ' + profile.lname;
    }

    if (!profile.uuid) {
      profile.uuid = profile.profile_name || 'profile_' + i;
    }

    profiles.push(profile);
  }

  return profiles;
}

function parseCsvLine(line) {
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

/**
 * Functions to get OTP Code from Email and fill OTP Input
 * @param {*} email
 * @param {*} otpType
 * @returns
 */

const MAX_RETRIES = 6;
const RETRY_INTERVAL = 5000; // 5 seconds
let retryCount = 0;
let fetching = false;
let retryTimer;

const fetchEmailOTP = (email, otpType, tabId) => {
  debugLog(`Email OTP: Fetching for ${email}, type: ${otpType}, retry: ${retryCount}`);

  const requestData = { email, otpType };

  fetch(EMAIL_OTP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  })
    .then((res) => {
      debugLog(`Email OTP: Response status ${res.status}`);
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      return res.json();
    })
    .then((res) => {
      const { code } = res;
      if (code) {
        debugLog(`Email OTP: Code received: ${code}`);
        clearTimeout(retryTimer);
        retryCount = 0;
        fetching = false;
        
        chrome.scripting
          .executeScript({
            target: { tabId, allFrames: true },
            func: dynamicFunctionForEmailOTP,
            args: [code],
          })
          .then(() => debugLog(`Email OTP: Script injected successfully`))
          .catch((err) => debugLog(`Email OTP: Script injection failed: ${err.message}`));
      } else {
        debugLog(`Email OTP: No code found, retrying ${retryCount + 1}/${MAX_RETRIES}`);
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          retryTimer = setTimeout(() => fetchEmailOTP(email, otpType, tabId), RETRY_INTERVAL);
        } else {
          debugLog(`Email OTP: Max retries reached`);
          fetching = false;
          retryCount = 0;
        }
      }
    })
    .catch((err) => {
      debugLog(`Email OTP: Error - ${err.message}, retrying ${retryCount + 1}/${MAX_RETRIES}`);
      retryCount++;
      if (retryCount < MAX_RETRIES) {
        retryTimer = setTimeout(() => fetchEmailOTP(email, otpType, tabId), RETRY_INTERVAL);
      } else {
        debugLog(`Email OTP: Max error retries reached`);
        fetching = false;
        retryCount = 0;
      }
    });
};


const handleEmailOTP = (email, otpType, tabId) => {
  debugLog(`Email OTP Handler: Starting for ${email}`);
  if (fetching) {
    debugLog(`Email OTP Handler: Canceling previous request`);
    clearTimeout(retryTimer);
    retryCount = 0;
  }
  fetching = true;
  retryCount = 0;
  fetchEmailOTP(email, otpType, tabId);
};

/**
 * Functions to get OTP Code from Phone and fill OTP Input
 * @param {*} phoneNumber
 * @param {*} otpType
 * @returns
 */

const checkPhoneOTP = (phone, otpType, tabId) => {
  const phoneNumber = phone.includes("+1") ? phone.substring(2) : phone;
  debugLog(`Phone OTP: Checking for ${phoneNumber}, type: ${otpType}, retry: ${retryCount}`);

  const query = `?apikey=lKS8cyz5kTWygLYsLsdi&phonenumber=${phoneNumber}`;
  const fullUrl = PHONE_OTP_URL + query;

  fetch(fullUrl)
    .then((res) => {
      debugLog(`Phone OTP: Response status ${res.status}`);
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      return res.json();
    })
    .then((res) => {
      debugLog(`Phone OTP: Response received, messages: ${res.length}`);
      
      if (res && res.length > 0 && res[0].message) {
        const matches = res[0].message.match(/\d+/g);
        if (matches && matches.length > 0) {
          const code = matches[0];
          debugLog(`Phone OTP: Code extracted: ${code}`);
          clearTimeout(retryTimer);
          retryCount = 0;
          fetching = false;
          
          chrome.scripting
            .executeScript({
              target: { tabId, allFrames: true },
              func: dynamicFunctionForPhoneOTP,
              args: [code, otpType],
            })
            .then(() => debugLog(`Phone OTP: Script injected successfully`))
            .catch((err) => debugLog(`Phone OTP: Script injection failed: ${err.message}`));
        } else {
          debugLog(`Phone OTP: No code found in message: ${res[0].message}`);
          throw new Error("No OTP code found in message");
        }
      } else {
        debugLog(`Phone OTP: Invalid response structure`);
        throw new Error("Invalid response structure");
      }
    })
    .catch((err) => {
      debugLog(`Phone OTP: Error - ${err.message}, retrying ${retryCount + 1}/${MAX_RETRIES}`);
      retryCount++;
      if (retryCount < MAX_RETRIES) {
        retryTimer = setTimeout(() => checkPhoneOTP(phone, otpType, tabId), RETRY_INTERVAL);
      } else {
        debugLog(`Phone OTP: Max retries reached`);
        fetching = false;
        retryCount = 0;
      }
    });
};

const handlePhoneOTP = (phoneNumber, otpType, tabId) => {
  debugLog(`Phone OTP Handler: Starting for ${phoneNumber}`);
  if (fetching) {
    debugLog(`Phone OTP Handler: Canceling previous request`);
    clearTimeout(retryTimer);
    retryCount = 0;
  }
  fetching = true;
  retryCount = 0;
  checkPhoneOTP(phoneNumber, otpType, tabId);
};

chrome.alarms.onAlarm.addListener(function (alarm) {
  //console.log(alarm);
  if (alarm.name == "SYNC_DB") {
    loadProfileData1();
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    if (details.url.includes("account/json/password")) {
      console.log("fetched : ", details);
      // Assuming rawData is the raw data as an ArrayBuffer
      const rawData = details.requestBody.raw[0].bytes; // Example ArrayBuffer data
      console.log("rawData ", rawData);
      if (rawData) {
        // Convert ArrayBuffer to Uint8Array
        const uint8Array = new Uint8Array(rawData);
        // Convert Uint8Array to string
        const decodedString = new TextDecoder().decode(uint8Array);
        // Parse the string as JSON
        try {
          const jsonObject = JSON.parse(decodedString);
          if (jsonObject.newPassword) {
            console.log("jsonObject.newPassword: ", jsonObject.newPassword);
            updateTMPassword(jsonObject.newPassword);
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

initialize();
