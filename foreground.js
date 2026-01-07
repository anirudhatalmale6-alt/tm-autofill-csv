// This script gets injected into any opened page
// whose URL matches the pattern defined in the manifest
// (see "content_script" key).
// Several foreground scripts can be declared
// and injected into the same or different pages.

console.log(
  "This prints to the console of the page (injected only if the page url matched)"
);

let userEmail = "";
const EMAIL_OTP_ONLY = true
const getUserInformation = async () => {
  const hostname = location.hostname

  const payload = {
    headers: {
      accept: "*/*",
    },
    referrer: `https://${hostname}/`,
    method: "GET",
    mode: "cors",
    credentials: "include",
  };
  const req = await fetch(
    `https://${hostname.replace('www','identity')}/json/user?hard=false`,
    payload
  );
  const data = await req.json();

  return {
    accountId: data.hmacUserId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.emailAddress,
    phone: data.phoneNumber,
  };
};

// make a delay of ms
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// get queue data
const getQueueDetails = async (url, userData) => {
  const urlObj = new URL(url);
  urlObj.searchParams.set("sets", +new Date());
  url = urlObj.toString();

  const iframe_src = document.querySelector(".child_frame").src;
  const payload = {
    targetUrl: iframe_src,
    customUrlParams: "",
    layoutVersion: 167320467812,
    layoutName: "gateway-ui-22321a",
    isClientRedayToRedirect: true,
    isBeforeOrIdle: false,
  };
  const req = await fetch(url, {
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9,fr;q=0.8,fr-FR;q=0.7,en-GB;q=0.6",
      "content-type": "application/json",
      "custom-request": "true",
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    body: JSON.stringify(payload),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });

  const data = await req.json();
  return {
    queueNumber: data.ticket.queueNumber,
    userData,
    secondsToStart: data?.ticket?.secondsToStart,
  };
};

// get current data
const get_current_date = () => new Date().toLocaleString();

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type == "callFunction") {
    var functionName = message.functionName;
    var args = message.args;
    // Ensure the function exists and is a function
    if (typeof window[functionName] === "function") {
      // Call the function in a safer way
      var result = window[functionName].apply(null, args);
      // Optionally, you can send the result back to the sender
      sendResponse(result);
    } else {
      console.error("Function does not exist: " + functionName);
    }
  }

  if (message.type == "scrapePurchaseInfo") {
    console.log("scrapePurchaseInfo action from service worker");
    // scrapeUntilEventNameNotEmpty();
  }
  return true;
});

/**
 * Function to simulate User Input
 */
function changeValueReact(el, value) {
  if (!el) return;
  let input = el;
  let lastValue = input.value;
  input.value = value;
  let event = new Event("input", { bubbles: true });
  event.simulated = true;
  let tracker = input._valueTracker;
  if (tracker) {
    tracker.setValue(lastValue);
  }
  input.dispatchEvent(event);
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function changeValueReactWithDelay(el, value) {
  if (!el) return;

  let input = el;
  let lastValue = "";
  const minDelay = 20;
  const maxDelay = 50;
  // Simulate typing with a delay (e.g., 50 milliseconds per character)
  // Usage
  for (let i = 0; i < value.length; i++) {
    let delay = getRandomDelay(minDelay, maxDelay);
    lastValue += value.charAt(i); // Append the next character
    input.value = lastValue;

    let event = new Event("input", { bubbles: true });
    event.simulated = true;
    let tracker = input._valueTracker;
    if (tracker) {
      tracker.setValue(lastValue);
    }
    input.dispatchEvent(event);

    // Wait for the specified delay before typing the next character
    await sleep(delay);
  }
}

let evt = new Event("change", { bubbles: true });
function fillInput(el, value) {
  if (!el) return false;
  el.value = value;
  return true;
}

function changeValueReact_select(el, value) {
  if (!el) return;
  let input = el;
  let lastValue = input.value;
  input.value = value;
  let event = new Event("input", { bubbles: true });
  event.simulated = true;
  let tracker = input._valueTracker;
  if (tracker) {
    tracker.setValue(lastValue);
  }
  input.dispatchEvent(event);
  let event2 = new Event("change", { bubbles: true });
  event2.simulated = true;
  input.dispatchEvent(event2);
}

function generateRandomDateOfBirth() {
    const currentYear = new Date().getFullYear();
    const age = Math.floor(Math.random() * 46) + 20; // Random age 20-65
    const birthYear = currentYear - age;
    const birthMonth = Math.floor(Math.random() * 12) + 1; // 1-12
    const birthDay = Math.floor(Math.random() * 28) + 1; // 1-28 (safe for all months)
    
    return {
        year: birthYear,
        month: birthMonth,
        day: birthDay
    };
}


const fifaAutofillHandler = (profileInfo, tab, card) => {
  const FIFA_PWD = 'NicketsFootbol24#';
  
  const setReactValue = (element, value) => {
  if (!element) return;
  if(element.type.toLowerCase() ==='hidden') return;
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set;

  const nativeCheckboxSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'checked'
  )?.set;

  const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    'value'
  )?.set;

  /* =========================
     CHECKBOX  ✅ (OLD WAY)
  ========================== */
  if (element.type === 'checkbox') {
    nativeCheckboxSetter.call(element, !!value);
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  /* =========================
     SELECT  ✅ (OLD WAY)
  ========================== */
  if (element.tagName === 'SELECT') {
    nativeSelectValueSetter.call(element, value);
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  /* =========================
     INPUT / TEXT / HIDDEN  ✅ (NEW WAY)
  ========================== */
  const lastValue = element.value;
  element.value = value;

  const tracker = element._valueTracker;
  if (tracker) {
    tracker.setValue(lastValue);
  }

  const event = new Event('input', { bubbles: true });
  event.simulated = true;
  element.dispatchEvent(event);
};


  // text inputs
  setReactValue(document.querySelector('#email'), profileInfo['acc_email']);
  setReactValue(document.querySelector('#password'), FIFA_PWD);
  setReactValue(document.querySelector('#confirm-password'), FIFA_PWD);

  setReactValue(document.querySelector('#firstname'), profileInfo['fname']);
  setReactValue(document.querySelector('#lastname'), profileInfo['lname']);
  setReactValue(document.querySelector('#preferredLanguage'), 'en-GB');
  setReactValue(document.querySelector('#country'), 'USA');
  setReactValue(document.querySelector('#gender'), 'prefer-not-to-say');



  // dob
  const { day, month, year } = generateRandomDateOfBirth();
  setReactValue(document.querySelector('#day'), day.toString());
  setReactValue(document.querySelector('#month'), month.toString());
  setReactValue(document.querySelector('#year'), year.toString());

  // Checkboxes
  setReactValue(document.querySelector('#TandC'), true);

  const consent18Yo = document.querySelector('#contactCriteria\\[AGEVAL\\]');
  if (consent18Yo) {
    setReactValue(consent18Yo, true);
    
    setReactValue(
      document.querySelector('#contactCriteriaFanOF26\\.values0'),
      'USA'
    );

    
    changeValueReact(document.querySelector('#address_line_1'), profileInfo['address_address'].replace('#',''));
    changeValueReact(document.querySelector('#address_town_standalone'), profileInfo['address_city']);
    changeValueReact(document.querySelector('#address_zipcode_standalone'), profileInfo['address_zip']);
    changeValueReact(document.querySelector('#locality_STATE'), profileInfo['address_state']);
    changeValueReact(document.querySelector('#mobile_number'), profileInfo['tel']?.replace(/[^0-9]/g, ''));
  }

  const agreeTermCheckbox = document.querySelector("#contactCriteriaEXTDELlD\\.values1");
  if (agreeTermCheckbox) {
    setReactValue(agreeTermCheckbox, true);
  }
  const form = document.querySelector("#register_request_form")
  if(form) form.submit()
  
  chrome.runtime.sendMessage({
    action: 'executeOnAllFramesForCard',
    data: { tabId: tab.id, card },
  });

  const otp = document.querySelector('#otp');
  if (otp) {
    chrome.runtime.sendMessage({
      action: 'getEmailOTP',
      data: { email: profileInfo['acc_email'], otpType: 'fifa' },
    });
  }
};

async function selectRandomOption(listboxId) {
  for (let i = 0; i < 10; i++) { // retry a few times in case rendering is delayed
    const options = document.querySelectorAll(`#${listboxId} [role="option"]`);
    if (options.length) {
      const random = Math.floor(Math.random() * options.length);
      options[random].scrollIntoView({ block: 'center' });
      options[random].click();
      return;
    }
    await sleep(200); // wait a bit before retrying
  }
}

let codeTabId;

/**
 * Function to autofill payment form with provided card info
 * @param {*} profileInfo
 * @param {*} card
 */
function autofill_payment_options(profileInfo, card, tabId) {
  if (document.querySelector("input[name='cardholderName']")) {
    changeValueReact(
      document.querySelector("input[name='cardholderName']"),
      profileInfo["full_name"]
    );
  }
  if (document.querySelector("input[name='email']"))
    changeValueReact(
      document.querySelector("input[name='email']"),
      profileInfo["acc_email"]
    );
  if (document.querySelector("input[name='password']"))
    changeValueReact(
      document.querySelector("input[name='password']"),
      profileInfo["tm_pass"]
    );
  if (
    document.querySelector("input[name='rememberMe']") &&
    !document.querySelector("input[name='rememberMe']")?.checked
  )
    document.querySelector("input[name='rememberMe']").click();

  if (document.querySelector("div#country-dropdown div.dropdown__items")) {
    document
      .querySelector(
        'div#country-dropdown div.dropdown__items span[value="US"]'
      )
      .click();

    setTimeout(() => {
      document
        .querySelector("div#country-dropdown div.dropdown__items")
        .classList.remove("dropdown--clicked", "dropdown--overflow");

      if (document.querySelector("input[name='address']"))
        changeValueReact(
          document.querySelector("input[name='address']"),
          profileInfo["address_address"]
        );
      if (document.querySelector("input[name='city']"))
        changeValueReact(
          document.querySelector("input[name='city']"),
          profileInfo["address_city"]
        );
      if (document.querySelector("input[name='postalCode']"))
        changeValueReact(
          document.querySelector("input[name='postalCode']"),
          profileInfo["address_zip"]
        );
      if (document.querySelector("input[name='phone']"))
        changeValueReact(
          document.querySelector("input[name='phone']"),
          profileInfo["tel"]
        );
      if (
        document.querySelector(
          `div#state-dropdown span[value="${profileInfo["address_state"]}"]`
        )
      ) {
        document
          .querySelector(
            `div#state-dropdown span[value="${profileInfo["address_state"]}"]`
          )
          .click();

        setTimeout(() => {
          document
            .querySelector("div#state-dropdown div.dropdown__items")
            .classList.remove("dropdown--clicked", "dropdown--overflow");
        }, 1000);
      }
    });
  }

  if (document.querySelector("input[name='address']"))
    changeValueReact(
      document.querySelector("input[name='address']"),
      profileInfo["address_address"]
    );
  if (document.querySelector("input[name='city']"))
    changeValueReact(
      document.querySelector("input[name='city']"),
      profileInfo["address_city"]
    );
  if (document.querySelector("input[name='postalCode']"))
    changeValueReact(
      document.querySelector("input[name='postalCode']"),
      profileInfo["address_zip"]
    );
  if (document.querySelector("input[name='phone']"))
    changeValueReact(
      document.querySelector("input[name='phone']"),
      profileInfo["tel"]
    );
  if (
    document.querySelector(
      `div[aria-describedby="state_error"] span[value="${profileInfo["address_state"]}"]`
    )
  ) {
    document
      .querySelector(
        `div[aria-describedby="state_error"] span[value="${profileInfo["address_state"]}"]`
      )
      .click();
  }
  var selectedCountry = document.querySelector('div[data-tid="country"] span');
  if (selectedCountry && selectedCountry.innerText === "") {
    document.querySelector('span[value="US"]').click();
  }

  if (document.querySelector('div[data-tid="state"] label')) {
    setTimeout(() => {
      document.querySelector('div[data-tid="state"] label').click();
    }, 500);
  }

  if (document.querySelector("iframe#Cardinal-CCA-IFrame")) {
    let totalDiv = document.querySelector(
      ".style__LeftSplitContent-sc-1gxk6db-3"
    );
    let priceInformation = totalDiv.childNodes[1].wholeText
      .split("$")[1]
      .trim();
    chrome.runtime.sendMessage({ action: "amex", id: priceInformation });
  }
  // Send Message to Service worker to autofill card detail in Iframe
  setTimeout(
    () =>
      chrome.runtime.sendMessage({
        action: "executeOnAllFramesForCard",
        data: { tabId, card },
      }),
    300
  );
}

/**
 * Function to autofill seatgeek payment option
 * @param {*} profileInfo  Profile Object
 * @param {*} card  Card Info
 * @param {*} tabId Active Tab Id
 */
function autofill_payment_seatgeek(profileInfo, card, tabId) {
  // Billing Address INput

  if (
    fillInput(
      document.querySelector("select[name='billingAddress.state']"),
      profileInfo["address_state"]
    )
  )
    document
      .querySelector("select[name='billingAddress.state']")
      .dispatchEvent(evt);

  changeValueReact(
    document.querySelector("input[name='billingAddress.first_name']"),
    profileInfo["fname"]
  );
  changeValueReact(
    document.querySelector("input[name='billingAddress.last_name']"),
    profileInfo["lname"]
  );
  changeValueReact(
    document.querySelector("input[name='billingAddress.address1']"),
    profileInfo["address_address"]
  );
  changeValueReact(
    document.querySelector("input[name='billingAddress.city']"),
    profileInfo["address_city"]
  );
  changeValueReact(
    document.querySelector("input[name='billingAddress.zip']"),
    profileInfo["address_zip"]
  );

  chrome.runtime.sendMessage({
    action: "executeOnAllFramesForCard",
    data: { tabId: tabId, card },
  });
}

/**
 * Function to auotfill mlb payment detail
 * @param {*} profileInfo
 * @param {*} card
 */
function autofill_payment_mlb(profileInfo, card) {
  // Section to autofill billing information
  const exp = card.exp.split("/");
  changeValueReact(document.querySelector("#card-number"), card.num);
  if (fillInput(document.querySelector("#cc-exp-month"), exp[0]))
    document.querySelector("#cc-exp-month").dispatchEvent(evt);
  if (fillInput(document.querySelector("#cc-exp-year"), `20${exp[1]}`))
    document.querySelector("#cc-exp-year").dispatchEvent(evt);
  if (
    fillInput(
      document.querySelector("#card-state"),
      profileInfo["address_state"]
    )
  )
    document.querySelector("#card-state").dispatchEvent(evt);
  changeValueReact(
    document.querySelector("#card-nameoncard"),
    profileInfo["full_name"]
  );
  changeValueReact(
    document.querySelector("#card-city"),
    profileInfo["address_city"]
  );
  changeValueReact(
    document.querySelector("#card-zip"),
    profileInfo["address_zip"]
  );
  changeValueReact(
    document.querySelector("#card-address-one"),
    profileInfo["address_address"]
  );
  changeValueReact(
    document.querySelector("#card-mobilePhone"),
    profileInfo["tel"]
  );

  changeValueReact(document.querySelector("input[name='cvvInput']"), card.cvv);

  // Check agree box
  var checkbox = document.getElementById("agreelabel");
  if (checkbox && !checkbox.checked) {
    let event = new Event("click", { bubbles: true });
    event.simulated = true;
    checkbox.dispatchEvent(event);
  }
}

/**
 * Function to autofill on evenue.net checkout
 * @param {*} profileInfo
 * @param {*} card
 */
function autofill_payment_evenue(profileInfo, card) {
  changeValueReact(
    document.querySelector('input[type="tel"]'),
    profileInfo["tel"]
  );
  changeValueReact(
    document.querySelector("#billing\\.streetAddress"),
    profileInfo["address_address"]
  );
  changeValueReact(
    document.querySelector("#billing\\.zipPostalCode"),
    profileInfo["address_zip"]
  );
  // changeValueReact(
  //   document.querySelector('select[name="state"]'),
  //   profileInfo["address_state"]
  // );
  document.querySelector("#new-billing-address-form-state-input").click()
  setTimeout(
    () => document.querySelector(`[data-value="${profileInfo['address_state']}"]`).click(),
    500
  ); 

  changeValueReact(
    document.querySelector("#billing\\.city"),
    profileInfo["address_city"]
  );
  changeValueReact(
    document.querySelector('#payment\\.nameoncard'),
    profileInfo["fname"] + " " + profileInfo["lname"]
  );

  changeValueReact(document.querySelector("#payment\\.cardNumber"), card.num);
  changeValueReact(document.querySelector('#payment\\.securityCode'), card.cvv);
  switch (card.type) {
    case "visa":
      changeValueReact(document.querySelector('select[name="card-type"]'), "V");
      break;
    case "amex":
      changeValueReact(document.querySelector('select[name="card-type"]'), "A");
      break;
    /*  case 'extra':
             changeValueReact(document.querySelector('select[name="card-type"]'), 'V')
             break; */
    default:
      changeValueReact(document.querySelector('select[name="card-type"]'), "V");
      break;
  }
  const expInput = document.querySelector("#payment\\.expirationDate")
  changeValueReact(
    expInput,
    card.exp
  );
   setTimeout(
    () => expInput.blur(),
    200
  ); 
  document.querySelector("#tg-placeholder").shadowRoot.querySelector("#tg-button-opt-out")?.click()

}

/**
 * Function to autofill on axs checkout card detail
 * @param {*} profileInfo
 * @param {*} card
 */
function autofill_payment_axs(profileInfo, card) {
  changeValueReact(
    document.querySelector("input[name='cardNumber'], #card-input"),
    card["num"]
  );
  changeValueReact(
    document.querySelector("#field-cardholderName, #nameOnCard-input, #cardName-1"),
    profileInfo["full_name"]
  );
  changeValueReact(
    document.querySelector("#exp-new, #expirationDate-input"),
    card["exp"]
  );
  setTimeout(() => {
    changeValueReact(
      document.querySelector("input[name='expDate']"),
      card["exp"]
    );
  }, 200);
  changeValueReact(
    document.querySelector("#cvv-new, #cvv-input, #cvv-1"),
    card["cvv"]
  );
  // Save Card info for future use
  (function () {
    const saveCardRb = document.querySelector("#save")
    if(saveCardRb && !saveCardRb.checked){
      saveCardRb.click()
    }

  })();
  document.querySelector("#No\\,-do-not-protect-my-\\$83\\.57-ticket-purchase")?.click()
  document.querySelector("#checkbox-terms-agreement")?.click()
}

function requestOtpCodeIfReady(profileInfo) {
 const otpConfigs = [
   {
     input: 'input#mfa-code-input-field-input',
     detector: '[data-bdd="mfa-last-four-digits"]'
   },
   {
     input: 'input#otp-input',
     detector: '[data-bdd="one-time-code-text"]'
   }
 ];

 otpConfigs.forEach(({ input, detector }) => {
   if (document.querySelector(input)) {
     const isEmail = document.querySelector(detector)?.textContent.includes('@');
     const mfaType = isEmail ? 'email' : 'phone';
     
     chrome.runtime.sendMessage({
       action: `get${mfaType === 'email' ? 'Email' : 'Phone'}OTP`,
       data: {
         [mfaType]: profileInfo[mfaType === 'email' ? 'acc_email' : 'tel'],
         otpType: 'ticketmaster'
       }
     });
   }
 });
}

/**
 * Function to handle command Alt +Z  || Ctrl+Shift+Z
 */
function _handleCommand1(tab) {
  chrome.storage.sync.get(["profileInfo"], function (data) {
    if (!data.profileInfo) return;
    profileInfo = JSON.parse(data.profileInfo);
    if (
      tab.url.match(/ticketmaster\.[a-z.]+\/wallet/gim) ||
      tab.url.match(/checkout\.ticketmaster\.[a-z.]+/gim) ||
      tab.url.match(/livenation\.[a-z.]+\/member\/payment_options/gim) ||
      tab.url.match(/checkout\.livenation\.[a-z.]+/gim)
    ) {
      const card = {
        num: profileInfo["amex_num"],
        exp: profileInfo["amex_exp"],
        cvv: profileInfo["amex_cvv"],
      };
      autofill_payment_options(profileInfo, card, tab.id);
    } else if (tab.url.includes("seatgeek.com/account/payment")) {
      const card = {
        num: profileInfo["amex_num"],
        exp: profileInfo["amex_exp"],
        cvv: profileInfo["amex_cvv"],
      };
      autofill_payment_seatgeek(profileInfo, card, tab.id);
    } else if (tab.url.match(/^https:\/\/mail.google.com\//)) {
      /**
       * Code to Autofill the Fields while processing Email Forwarding
       * Forwarding Email should be sales + Email + @nickets.com
       * Add Predefined Filter for forwarding.
       */
      console.log("google");
      const filter = `{"order"} OR {"tickets"} OR {"Verify Your Device With AXS"} OR {"Verify Your Email With AXS"} OR {"You Got Tickets"} OR {"Authentication Code"} OR {"confirmation"} OR {"ticket purchase"} OR {"Print your"} OR {"Print at Home"} OR {"Thank You For Your Purchase"} OR {"View and Save Your Tickets"} OR {"Tickets have arrived"} OR {"E-Tickets"} OR {"Your Ticket Purchase from"} OR {"Your Purchase"} OR {"Thank you for purchasing tickets"} OR {"You Just Scored Tickets"} OR {"Got Your Order"} OR {"Thank You for Your Order"} OR {"Eticket"} OR {"cash"} OR {"ready to print"} OR {"Etickets"} OR {"Your Mobile"} OR {"Electronic Ticket(s)"} OR {"Receipt"} OR {"Opera Ticket"} OR {"Print-at-Home Tickets"} OR {"Purchase is Complete"} OR {"verification code"} OR {"Ticket Delivery"} OR {"Replay Purchase"} OR {"Print@Home"} OR {"Ticket Request"} OR {(Your AROUND 20 Tickets)} OR {"Online Ticket"} OR {"Thank You from"} OR {"Verify Your"} OR {"Your request to reset password"} OR {"Tickets are Here"} OR {"Your Tickets for"} OR {"tickets were delivered"} OR {"Purchase"} OR {"Here are your Tickets"} OR {"You're all set to see"}`;
      const forwardEmailAddress = "sales@nickets.com";
      if (userEmail === "" || userEmail === undefined || userEmail === null) {
        userEmail = profileInfo["acc_email"]?.toLowerCase();
        console.log(userEmail);
      }

      const realForwardEmailAddress =
        forwardEmailAddress.split("@")[0] +
        "+" +
        userEmail?.split("@")[0] +
        "@" +
        forwardEmailAddress.split("@")[1];

      if (!!document.querySelector("div.PN"))
        changeValueReact(
          document.querySelector("div.PN > input"),
          realForwardEmailAddress
        );
      if (
        !!document.querySelector("div.PN") &&
        document.querySelector("div.PN > input").value
      ) {
        let event = new Event("click", { bubbles: true });
        event.simulated = true;
        document.querySelector('button[name="next"]').dispatchEvent(event);
      }
      if (!!document.querySelector('button[name="ok"]')) {
        let event = new Event("click", { bubbles: true });
        event.simulated = true;
        document.querySelector('button[name="ok"]').dispatchEvent(event);
        console.log("Sent link.");
        chrome.runtime.sendMessage({ action: "fetchLinkFromServer" });
      }
      if (!!document.querySelector('span[act="resend"]')) {
        document
          .querySelector('span[act="resend"]')
          .addEventListener("click", () => {
            console.log("Resending request...");
            chrome.runtime.sendMessage({ action: "fetchLinkFromServer" });
          });
      }
      if (!!document.querySelector("div[class='w-Nw boo']")) {
        changeValueReact(
          document
            .querySelectorAll("div[class='w-Nw boo']")[2]
            .querySelector("input"),
          filter
        );
      }
    } else if (tab.url.match(/^https:\/\/mail-settings.google.com\//)) {
      if (!!document.querySelector("input[value='Proceed']"))
        document.querySelector("input[value='Proceed']").click();
    } else if (tab.url.match(/^https:\/\/mlb.tickets.com\//)) {
      const card = {
        num: profileInfo["amex_num"],
        exp: profileInfo["amex_exp"],
        cvv: profileInfo["amex_cvv"],
      };
      autofill_payment_mlb(profileInfo, card);
    } else if (tab.url.match(/evenue.net/i)) {
      const card = {
        type: "amex",
        num: profileInfo["amex_num"],
        exp: profileInfo["amex_exp"],
        cvv: profileInfo["amex_cvv"],
      };
      autofill_payment_evenue(profileInfo, card);
    } else if (tab.url.match(/^https:\/\/[^\/]+?.axs.com\//)) {
      const card = {
        type: "amex",
        num: profileInfo["amex_num"],
        exp: profileInfo["amex_exp"],
        cvv: profileInfo["amex_cvv"],
      };
      autofill_payment_axs(profileInfo, card);
    }
    if (tab.url.includes("ticketstoday.com")) {
      const card = {
        type: "amex",
        num: profileInfo["amex_num"],
        exp: profileInfo["amex_exp"],
        cvv: profileInfo["amex_cvv"],
      };
      // Card Detail
      chrome.runtime.sendMessage({
        action: "executeOnAllFramesForCard",
        data: { tabId: tab.id, card },
      });
    }

    // Fill CVV , No Insuracne Option, Accept Terms and Policy Option on TM Checkout
    if (
      tab.url.match(
        /^https?:\/\/(www\.ticketmaster|ticketmaster|concerts.livenation|www\.	|livenation)\.com\/checkout\/order/
      ) ||
      tab.url.match(
        /^https?:\/\/(www\.checkout|checkout)\.(ticketmaster|livenation)\.com/
      ) ||
      tab.url.match(
        /^https?:\/\/(www\.ticketmaster|ticketmaster|concerts.livenation|www\.livenation|livenation)\.com\/resale\/checkout\/order/
      )
    ) {
      //cvv

      if (
        !!document.querySelector("input#placeOrderOptIn1input") &&
        !document.querySelector("input#placeOrderOptIn1input").checked
      )
        document.querySelector("label[for='placeOrderOptIn1input']").click(); // resale accept
      if (
        !!document.querySelector("input#cta-opt-in") &&
        !document.querySelector("input#cta-opt-in").checked
      )
        document
          .querySelector("label[for='cta-opt-in']")
          .click(); /*normal accept*/
      if (!!document.querySelector("input[name='insurance'][value='false']"))
        document
          .querySelector("input[name='insurance'][value='false']")
          .click();
      /*normal insurance*/ else if (
        !!document.querySelector("input[name='insurance'][value='']")
      )
        document.querySelector("input[name='insurance'][value='']").click();
      /*normal insurance*/ else if (
        !!document.querySelector(
          "input[name='insurance'][data-event-value='0']"
        )
      )
        document
          .querySelector("input[name='insurance'][data-event-value='0']")
          .click(); /*normal insurance*/

      // Place order in checkout Page
      /* if (document.querySelector('button[data-tid="place-order-btn"]')) {
                setTimeout(() => {
                    document.querySelector('button[data-tid="place-order-btn"]').click()
                }, 500);
            } */
    } else if (tab.url.match(/fifa.com/i)) {
      const card = {
        type: 'amex',
        holder: profileInfo['full_name'],
        num: profileInfo["amex_num"],
        exp: profileInfo["amex_exp"],
        cvv: profileInfo["amex_cvv"],
      };
      fifaAutofillHandler(profileInfo, tab, card);
    }
  });
}

/**
 * Function to handle command Alt+2 || Ctrl+Shift+2
 */
function _handleCommand2(tab) {
  chrome.storage.sync.get(["profileInfo"], function (data) {
    if (!data.profileInfo) return;
    profileInfo = JSON.parse(data.profileInfo);
    // Autofill Search Filter
    if (tab.url.match(/^https:\/\/mail.google.com\//)) {
      var filter = "waitlist";
      var sender = "registration@email.ticketmaster.com";
      if (!!document.querySelector("div[class='w-Nw boo']")) {
        changeValueReact(
          document
            .querySelectorAll("div[class='w-Nw boo']")[4]
            .querySelector("input"),
          filter
        );
      }
      if (!!document.querySelector("div[class='w-Nw boo']")) {
        changeValueReact(
          document
            .querySelectorAll("div[class='w-Nw boo']")[0]
            .querySelector("input"),
          sender
        );
      }
    }
  });
}

/**
 * Function to handle command Alt+3 || Ctrl+Shift+3
 */
function _handleCommand3(tab) {
  chrome.storage.sync.get(["profileInfo"], function (data) {
    if (!data.profileInfo) return;
    profileInfo = JSON.parse(data.profileInfo);
    if (
      tab.url.match(/ticketmaster\.[a-z.]+\/wallet/gim) ||
      tab.url.match(/checkout\.ticketmaster\.[a-z.]+/gim) ||
      tab.url.match(/livenation\.[a-z.]+\/member\/payment_options/gim) ||
      tab.url.match(/checkout\.livenation\.[a-z.]+/gim)
    ) {
      const { uuid } = profileInfo;

      if (uuid) {
        chrome.runtime.sendMessage(
          {
            action: "citiCard",
          },
          (data) => {
            if (data.data) {
              const card = {
                num: data.data.number,
                exp: data.data.expiration,
                cvv: data.data.pin,
              };

              autofill_payment_options(profileInfo, card, tab.id);
            }
          }
        );
      }
      // const cardNumber = localStorage.get("cardNumber");
      // const cardExp = localStorage.get("cardExp");
      // const cardPin = localStorage.get("cardPin");

      // let card = null;
      // if (cardNumber && cardExp && cardPin) {
      //   card = {
      //     num: cardNumber,
      //     exp: cardExp,
      //     cvv: cardPin,
      //   };
      // } else {
      //   card = {
      //     num: profileInfo["extra_num"],
      //     exp: profileInfo["extra_exp"],
      //     cvv: profileInfo["extra_cvv"],
      //   };
      // }

      // autofill_payment_options(profileInfo, card, tab.id);
    } else if (tab.url.match(/^https:\/\/mail.google.com\//)) {
      var filter = "thanks";
      var sender = "registration@email.ticketmaster.com";
      if (!!document.querySelector("div[class='w-Nw boo']")) {
        changeValueReact(
          document
            .querySelectorAll("div[class='w-Nw boo']")[2]
            .querySelector("input"),
          filter
        );
      }
      if (!!document.querySelector("div[class='w-Nw boo']")) {
        changeValueReact(
          document
            .querySelectorAll("div[class='w-Nw boo']")[0]
            .querySelector("input"),
          sender
        );
      }
    } else if (tab.url.includes("seatgeek.com/account/payment")) {
      const card = {
        num: profileInfo["extra_num"],
        exp: profileInfo["extra_exp"],
        cvv: profileInfo["extra_cvv"],
      };
      autofill_payment_seatgeek(profileInfo, card, tab.id);
    } else if (tab.url.match(/^https:\/\/mlb.tickets.com\//)) {
      const card = {
        num: profileInfo["extra_num"],
        exp: profileInfo["extra_exp"],
        cvv: profileInfo["extra_cvv"],
      };
      // Section to autofill billing information
      autofill_payment_mlb(profileInfo, card);
    } else if (tab.url.match(/evenue.net/i)) {
      const card = {
        type: "extra",
        num: profileInfo["extra_num"],
        exp: profileInfo["extra_exp"],
        cvv: profileInfo["extra_cvv"],
      };
      autofill_payment_evenue(profileInfo, card);
    } else if (tab.url.match(/^https:\/\/[^\/]+?.axs.com\//)) {
      const card = {
        type: "extra",
        num: profileInfo["extra_num"],
        exp: profileInfo["extra_exp"],
        cvv: profileInfo["extra_cvv"],
      };
      autofill_payment_axs(profileInfo, card);
    }
    if (tab.url.includes("ticketstoday.com")) {
      const card = {
        type: "extra",
        num: profileInfo["extra_num"],
        exp: profileInfo["extra_exp"],
        cvv: profileInfo["extra_cvv"],
      };
      // Card Detail
      chrome.runtime.sendMessage({
        action: "executeOnAllFramesForCard",
        data: { tabId: tab.id, card },
      });
    }

    // Fill CVV , No Insuracne Option, Accept Terms and Policy Option on TM Checkout
    if (
      tab.url.match(
        /^https?:\/\/(www\.)?(ticketmaster|concerts\.livenation|livenation)\.[a-z.]+\/checkout\/order/
      ) ||
      tab.url.match(
        /^https?:\/\/(www\.)?(checkout)\.(ticketmaster|livenation)\.[a-z.]+/
      ) ||
      tab.url.match(
        /^https?:\/\/(www\.)?(ticketmaster|concerts\.livenation|livenation)\.[a-z.]+\/resale\/checkout\/order/
      )
    ) {
      //cvv
      chrome.runtime.sendMessage({
        action: "focusTab",
        data: { tabId: tab.id },
      });

      setTimeout(() => {
        if (!!document.querySelector("input#placeOrderOptIn1input"))
          console.log("element visible");
      }, 2000);
      if (
        !!document.querySelector("input#placeOrderOptIn1input") &&
        !document.querySelector("input#placeOrderOptIn1input").checked
      )
        document.querySelector("label[for='placeOrderOptIn1input']").click(); // resale accept
      if (
        !!document.querySelector("input#cta-opt-in") &&
        !document.querySelector("input#cta-opt-in").checked
      )
        document
          .querySelector("label[for='cta-opt-in']")
          .click(); /*normal accept*/
      if (!!document.querySelector("input[name='insurance'][value='false']"))
        document
          .querySelector("input[name='insurance'][value='false']")
          .click();
      /*normal insurance*/ else if (
        !!document.querySelector("input[name='insurance'][value='']")
      )
        document.querySelector("input[name='insurance'][value='']").click();
      /*normal insurance*/ else if (
        !!document.querySelector(
          "input[name='insurance'][data-event-value='0']"
        )
      )
        document
          .querySelector("input[name='insurance'][data-event-value='0']")
          .click(); /*normal insurance*/
    }
  });
}
function getChannel() {
  const val =
    document.querySelector('#iProofOptions')?.value ||
    document.querySelector('input[name="proof"]:checked')?.value ||
    '';

  // If MS gives us the pipe string, it contains "Email" or "Phone/SMS"
  if (val) return /Email/i.test(val) ? 'email' : 'phone';

  // Fallback: the subhead often shows the destination (email or masked phone)
  const text = document.querySelector('#iEnterSubhead')?.innerText || '';
  return /@/.test(text) ? 'email' : 'phone';
}



/**
 * Function to handle command Alt+X || Ctrl+Shift+X
 */
var refetch = false;
function _handleCommand(tab) {
  console.log("_handleCommand: ", tab);
  chrome.storage.sync.get(["profileInfo"], async function (data) {
    if (!data.profileInfo) {
      console.log("profile is not loaded yet! refetching....");
      if (!refetch) {
        chrome.runtime.sendMessage({ action: "fetchProfileData" });
        refetch = true;
      }
      return;
    }
    profileInfo = JSON.parse(data.profileInfo);

    if (tab.url.match(/^https:\/\/[^\/]*\.?(live|microsoftonline)\.com\//)) {
      const { acc_email, gmail_pass, gmail_recovery_email, gmail_recovery_phone, fname, lname   } = profileInfo;

      changeValueReact(document.querySelector('input[name="New email"]'), acc_email.replace('@gmail.com', ''));
      changeValueReact(document.querySelector('#usernameEntry')||document.querySelector("#i0116"), acc_email);
      changeValueReact(document.querySelector('input[type="password"]'), gmail_pass);

      // Month
      const monthDropdown = document.querySelector('#BirthMonthDropdown');
      if (monthDropdown) {
        monthDropdown.click();
        await selectRandomOption('fluent-listbox19');
      }

      // Day
      const dayDropdown = document.querySelector('#BirthDayDropdown');
      if (dayDropdown) {
        dayDropdown.click();
        await selectRandomOption('fluent-listbox20');
      }

      // Year
      const { year } = generateRandomDateOfBirth();
      changeValueReact(document.querySelector('#floatingLabelInput21'), year);

      changeValueReact(document.querySelector("#firstNameInput"),fname)
      changeValueReact(document.querySelector("#lastNameInput"),lname)
      changeValueReact(document.querySelector("#EmailAddress"),gmail_recovery_email)
    const otpInput = document.querySelector('#iOttText');

    if (otpInput) {
      const isPhoneField = channel === 'phone';

      chrome.runtime.sendMessage({
        action: isPhoneField ? 'getPhoneOTP' : 'getEmailOTP',
        data: isPhoneField
          ? {
              phone: gmail_recovery_phone,
              otpType: 'microsoft',
            }
          : {
              email: gmail_recovery_email,
              otpType: 'microsoft',
            },
      });
    }

      changeValueReact(document.querySelector('input[name="proofField"], input[placeholder*="Phone"]'), gmail_recovery_phone)

      if (document.querySelector('#enter-code-input')) {
        chrome.runtime.sendMessage({
          action: 'getPhoneOTP',
          data: {
            phone: gmail_recovery_phone,
            otpType: 'microsoft',
          },
        });
      }

    
      
    } else if (tab.url.match(/^https:\/\/accounts.google.com\//)) {
      /**
       * Code to Autofill the Gmail and Password to Validate Gmail Account.
       * Autofill Input Fields: Mail, Password, Recovery mail, Recovery Phone number
       */
      // To do - Get data from API using Profile Id
      const { acc_email, gmail_pass, gmail_recovery_email, gmail_recovery_phone } = profileInfo;

      if (!!document.querySelector('input#identifierId'))
        changeValueReact(document.querySelector('input#identifierId'), acc_email);
      if (!!document.querySelector("input[type='password']"))
        changeValueReact(document.querySelector("input[type='password']"), gmail_pass);
      if (!!document.querySelector('input#knowledge-preregistered-email-response'))
        changeValueReact(
          document.querySelector('input#knowledge-preregistered-email-response'),
          gmail_recovery_email
        );
      if (!!document.querySelector('input#phoneNumberId'))
        changeValueReact(document.querySelector('input#phoneNumberId'), gmail_recovery_phone);
      // End
    } else if (
      tab.url.match(/^https:\/\/auth\.ticketmaster\.[a-z.]+\//) ||
      tab.url.match(/^https:\/\/verifiedfan\.ticketmaster\.[a-z.]+\//) ||
      tab.url.match(/^https:\/\/verifiedfan\.livenation\.[a-z.]+\//) ||
      tab.url.match(/^https:\/\/registration\.ticketmaster\.[a-z.]+\//) ||
      tab.url.match(/^https:\/\/registration\.livenation\.[a-z.]+\//)
    ) {
      console.log('aaaa', profileInfo);
      requestOtpCodeIfReady(profileInfo);
      /**
       *  Function to handle Autofill in Login/Registration Form
       * */
      // if (
      //   typeof profileInfo["acc_email"] == "undefined" ||
      //   profileInfo["acc_email"] == "" ||
      //   typeof profileInfo["tm_pass"] == "undefined" ||
      //   profileInfo["tm_pass"] == ""
      // )
      //   return;
      /* if (!!document.querySelector("input[name='email']")) changeValueReact(document.querySelector("input[name='email']"), profileInfo['acc_email']);
            if (!!document.querySelector("input[name='password']")) changeValueReact(document.querySelector("input[name='password']"), profileInfo['tm_pass']); */
      changeValueReactWithDelay(
        document.querySelector("input[name='email']"),
        profileInfo['acc_email']
      );
      changeValueReactWithDelay(
        document.querySelector("input[name='password']"),
        profileInfo['tm_pass']
      );
      if (
        document.querySelector("input[name='rememberMe']") &&
        !document.querySelector("input[name='rememberMe']")?.checked
      )
        document.querySelector("input[name='rememberMe']").click();
      changeValueReactWithDelay(
        document.querySelector("input[name='firstName']"),
        profileInfo['fname']
      );
      changeValueReactWithDelay(
        document.querySelector("input[name='lastName']"),
        profileInfo['lname']
      );
      changeValueReactWithDelay(
        document.querySelector("input[name='postalCode']"),
        profileInfo['address_zip']
      );
      changeValueReactWithDelay(
        document.querySelector("input[name='phoneNumber']"),
        profileInfo['tel']
      );
      changeValueReactWithDelay(
        document.querySelector("input[name='zip']"),
        profileInfo['address_zip']
      );
      changeValueReactWithDelay(
        document.querySelector('#intl-phone-number'),
        '+1 ' + profileInfo['tel']
      );

      // if (!!document.querySelector("input#otp-input-input")|| !!document.querySelector("input[name='otp']")) {
      //   // console.log("otp-input-input");
      //   // if(document.querySelector("h1[data-bdd='asvd-authenticate-header']").textContent.includes("Phone")) {
      //   //   console.log("asvd-authenticate-header");
      //   //   chrome.runtime.sendMessage({
      //   //     action: "getPhoneOTP",
      //   //     data: {
      //   //       phone: profileInfo["tel"],
      //   //       otpType: "ticketmaster"
      //   //     },
      //   //   });

      //   //   return;
      //   // }

      //   // chrome.runtime.sendMessage({
      //   //   action: "getEmailOTP",
      //   //   data: { email: profileInfo["acc_email"], otpType: "ticketmaster" },
      //   // });
      //   chrome.runtime.sendMessage({
      //   action: EMAIL_OTP_ONLY ? 'getEmailOTP' : 'getPhoneOTP',
      //   data: EMAIL_OTP_ONLY
      //     ? { email: profileInfo['acc_email'], otpType: 'ticketmaster' }
      //     : { phone: profileInfo['tel'], otpType: 'ticketmaster' },
      // });
      // }
      // if(!!document.querySelector("input#mfa-code-input-field-input")){
      //   const mfaType = document.querySelector('[data-bdd="mfa-last-four-digits"]')?.textContent.includes('@') ? 'email' : 'phone';
      //   chrome.runtime.sendMessage({
      //   action: mfaType === 'email' ? 'getEmailOTP' : 'getPhoneOTP',
      //   data: mfaType === 'email'
      //     ? { email: profileInfo['acc_email'], otpType: 'ticketmaster' }
      //     : { phone: profileInfo['tel'], otpType: 'ticketmaster' },
      // });
      // }

      /* if (document.querySelector("#market")) {
                let items = Array.from(document.querySelector("#market").options)
                items.shift()
                const randomItem = items[Math.floor(Math.random() * items.length)];
                document.querySelector("#market").value = randomItem.value
                document.querySelector("#market").dispatchEvent(new Event('change', { bubbles: true }));
            } */

      // Password Reset OTP
      // if (!!document.querySelector("input[name='otp']") && profileInfo['acc_email'] != '' && profileInfo['acc_email'] != "undefined") chrome.runtime.sendMessage({ action: 'getEmailOTP', data: { email: profileInfo['acc_email'], otpType: "ticketmaster" } });

      if (!!document.querySelector("fieldset#phone-number input[type='tel']")) {
        console.log('phone number');

        changeValueReactWithDelay(
          document.querySelector("fieldset#phone-number input[type='tel']"),
          profileInfo['tel']
        );

        document.querySelector('div#opted-in-checkbox label').click();
      }
    } else if (
      tab.url.match(/ticketmaster\.[a-z.]+\/wallet/gim) ||
      tab.url.match(/checkout\.ticketmaster\.[a-z.]+/gim) ||
      tab.url.match(/livenation\.[a-z.]+\/member\/wallet/gim) ||
      tab.url.match(/checkout\.livenation\.[a-z.]+/gim)
    ) {
      /**
       *  Function to handle Autofill in Payment Option Form
       */
      console.log('payment page');
      const card = {
        num: profileInfo['visa_num'],
        exp: profileInfo['visa_exp'],
        cvv: profileInfo['visa_cvv'],
      };

      autofill_payment_options(profileInfo, card, tab.id);
    } else if (tab.url.match(/(ticketmaster|livenation)\.[a-z.]+\//)) {
      console.log('ticketmaster');
      requestOtpCodeIfReady(profileInfo);

      /**
       *  Function to handle Autofill in OTP, Popup ...
       */
      if (typeof profileInfo['event_pass'] != 'undefined' && profileInfo['event_pass'] != '') {
        //event password
        if (!!document.querySelector('input#offerCode-input'))
          document.querySelectorAll('input#offerCode-input').forEach(function (item) {
            changeValueReact(item, profileInfo['event_pass']);
          });
      }

      // TODO popup login
      if (!!document.querySelector("input[name='email']"))
        changeValueReact(document.querySelector("input[name='email']"), profileInfo['acc_email']);
      if (!!document.querySelector("input[name='password']"))
        changeValueReact(document.querySelector("input[name='password']"), profileInfo['tm_pass']);
      if (
        !!document.querySelector("input[name='rememberMe']") &&
        !document.querySelector("input[name='rememberMe']").checked
      )
        document.querySelector("input[name='rememberMe']").click();

      // QUEUE OTP PHONE
      if (!!document.querySelector('input#mfa-code-input-field')) {
        console.log('TICKETMASTER QUEUE OTP');
        getUserInformation()
          .then((userInfo) => {
            const email = userInfo.email;
            chrome.runtime.sendMessage({
              action: 'getEmailOTP',
              data: { email: email, otpType: 'ticketmaster' },
            });
          })
          .catch((error) => {
            console.log('Failed to get user information from API, falling back to storage:', error);

            chrome.storage.sync.get(['profileInfo'], (data) => {
              if (!data.profileInfo) return;

              const profileInfo = JSON.parse(data.profileInfo);
              const email = profileInfo.acc_email || profileInfo.email;

              chrome.runtime.sendMessage({
                action: 'getEmailOTP',
                data: { email: email, otpType: 'ticketmaster' },
              });
            });
          });
      }
      // TODO Phone OTP
      // if (
      //   !!document.querySelector("input[name='otp']") &&
      //   profileInfo["tel"] != "" &&
      //   profileInfo["tel"] != "undefined"
      // )
      //   chrome.runtime.sendMessage({
      //     action: "getPhoneOTP",
      //     data: { phone: profileInfo["tel"], otpType: "ticketmaster" },
      //   });
    } else if (tab.url.includes('seatgeek.com')) {
      const card = {
        num: profileInfo['visa_num'],
        exp: profileInfo['visa_exp'],
        cvv: profileInfo['visa_cvv'],
      };

      changeValueReactWithDelay(
        document.querySelector("input[name='email']"),
        profileInfo['acc_email']
      );
      changeValueReactWithDelay(
        document.querySelector("input[name='password']"),
        profileInfo['seatgeek_pass']
      );
      changeValueReactWithDelay(
        document.querySelector("input[name='firstName']"),
        profileInfo['fname']
      );
      changeValueReactWithDelay(
        document.querySelector("input[name='lastName']"),
        profileInfo['lname']
      );
      changeValueReactWithDelay(document.querySelector("input[name='phone']"), profileInfo['tel']);

      if (!!document.querySelector('#get-ready-panel-input'))
        changeValueReact(
          document.querySelector('#get-ready-panel-input'),
          profileInfo['event_pass']
        );
      if (!!document.querySelector('#access-code-modal-input'))
        changeValueReact(
          document.querySelector('#access-code-modal-input'),
          profileInfo['event_pass']
        );

      setInterval(() => {
        if (window.location.href.includes('seatgeek.com/checkout')) {
          document
            .querySelectorAll("input[name='email']")
            .forEach((el) => changeValueReact(el, profileInfo['acc_email']));
          changeValueReact(
            document.querySelector("input[name='password']"),
            profileInfo['seatgeek_pass']
          );
        }
      }, 500);

      autofill_payment_seatgeek(profileInfo, card, tab.id);
    } else if (tab.url.match(/^https:\/\/mlb.tickets.com\//)) {
      // Section to autofill signin/signup page
      changeValueReact(document.querySelector('#email'), profileInfo['acc_email']);
      changeValueReact(document.querySelector('#username'), profileInfo['acc_email']);
      changeValueReact(document.querySelector('#firstName'), profileInfo['fname']);
      changeValueReact(document.querySelector('#lastName'), profileInfo['lname']);
      changeValueReact(document.querySelector('#password'), profileInfo['tm_pass']);
      changeValueReact(document.querySelector('#confirmPassword'), profileInfo['tm_pass']);
      if (document.querySelector('#acceptTerms')) document.querySelector('#acceptTerms').click();
      // Section to autofill Offer Code
      changeValueReact(
        document.querySelector('input[name="code-input"]'),
        profileInfo['event_pass']
      );
      // Section to autofill billing information

      const card = {
        num: profileInfo['visa_num'],
        exp: profileInfo['visa_exp'],
        cvv: profileInfo['visa_cvv'],
      };
      autofill_payment_mlb(profileInfo, card);
    } else if (tab.url.match(/^https:\/\/[^\/]+?.axs.com\//)) {
      const card = {
        num: profileInfo['visa_num'],
        exp: profileInfo['visa_exp'],
        cvv: profileInfo['visa_cvv'],
      };

      // Login
      changeValueReact(document.querySelector('input#axs_email_login'), profileInfo['acc_email']);
      changeValueReact(document.querySelector('input#axs_pass_login'), profileInfo['axs_pass']);

      // Promo Code
      changeValueReact(
        document.querySelector("input[name='restrictions']"),
        profileInfo['event_pass']
      );

      // Section for Register
      changeValueReact(document.querySelector('input#axs_email_create'), profileInfo['acc_email']);
      changeValueReact(document.querySelector('input#axs_pass_create'), profileInfo['axs_pass']);
      changeValueReact(document.querySelector('input#axs_fname_create'), profileInfo['fname']);
      changeValueReact(document.querySelector('input#axs_lname_create'), profileInfo['lname']);

      // Section for Card Info
      autofill_payment_axs(profileInfo, card);

      // Section to fill billing information
      changeValueReact(
        document.querySelector("#field-billingAddress\\.address1, #address1-1"),
        profileInfo['address_address'].replace(',', '')
      );
      changeValueReact(document.querySelector("#field-billingAddress\\.city, #city-1"), profileInfo['address_city']);
      changeValueReact(
        document.querySelector("#field-billingAddress\\.postalCode, #postCode-1"),
        profileInfo['address_zip']
      );
      changeValueReact(
        document.querySelector("#field-billingAddress\\.phone-national-number, #phoneNumberPrimary-1"),
        profileInfo['tel']
      );
      changeValueReact_select(
        document.querySelector("#field-billingAddress\\.state, #regionCode-1"),
        profileInfo['address_state']
      );

      // Check Terms of Use
      if (!!document.querySelector('.istermsConditionsCheckbox .svg-check.unchecked')) {
        let event = new Event('click', { bubbles: true });
        event.simulated = true;
        document
          .querySelector('.istermsConditionsCheckbox .svg-check.unchecked')
          .dispatchEvent(event);
      }
      // Check protect ticket
      if (!!document.querySelector(".non-refundable-ticket-v2 div[type='radio']"))
        document.querySelector(".non-refundable-ticket-v2 div[type='radio']").click();

      if (
        !!document.querySelector(
          ".marketingConsentCheckbox[id*='marketingConsent'] .svg-check.unchecked"
        )
      ) {
        let event = new Event('click', { bubbles: true });
        event.simulated = true;
        document
          .querySelector(".marketingConsentCheckbox[id*='marketingConsent'] .svg-check.unchecked")
          .dispatchEvent(event);
      }
      if (!!document.querySelector("input[name='insuranceOptions']#insuranceOption2"))
        document.querySelector("input[name='insuranceOptions']#insuranceOption2").click();
    } else if (tab.url.match(/evenue.net/i)) {
      console.log('evenue log');
      const EVENUE_PWD = 'Nicketsevenue2025#'
      const card = {
        type: 'visa',
        num: profileInfo['visa_num'],
        exp: profileInfo['visa_exp'],
        cvv: profileInfo['visa_cvv'],
      };
      changeValueReact(
        document.querySelector("#input-promo-password"),
        'TUS5G34F5C'
      );

      changeValueReact(
        document.querySelector('input[type="email"],[data-testid="emailInput"]'),
        profileInfo['acc_email']
      );
      changeValueReact(document.querySelector('input[type="password"]'), EVENUE_PWD);
      changeValueReact(
        document.querySelector('[data-testid="firstNameInput"]'),
        profileInfo['fname']
      );
      changeValueReact(
        document.querySelector('[data-testid="lastNameInput"]'),
        profileInfo['lname']
      );
      changeValueReact(document.querySelector('input[type="tel"]'), profileInfo['tel']);

      autofill_payment_evenue(profileInfo, card);
    } else if (tab.url.includes('ticketstoday.com')) {
      const card = {
        type: 'visa',
        num: profileInfo['visa_num'],
        exp: profileInfo['visa_exp'],
        cvv: profileInfo['visa_cvv'],
      };
      changeValueReact(
        document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlBillingAddress_txtFirstName'
        ),
        profileInfo['fname']
      );
      changeValueReact(
        document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlBillingAddress_txtLastName'
        ),
        profileInfo['lname']
      );
      changeValueReact(
        document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlBillingAddress_txtStreet1'
        ),
        profileInfo['address_address']
      );
      const country = 1;
      changeValueReact_select(
        document.querySelector(
          'select#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlBillingAddress_ddlCountry'
        ),
        country
      );
      changeValueReact(
        document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlBillingAddress_txtCity'
        ),
        profileInfo['address_city']
      );
      changeValueReact(
        document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlBillingAddress_txtZip'
        ),
        profileInfo['address_zip']
      );
      changeValueReact(
        document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlBillingAddress_txtPhone1'
        ),
        profileInfo['tel']
      );
      changeValueReact(
        document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlEmailConfirm_txtEmail'
        ),
        profileInfo['acc_email']
      );
      changeValueReact(
        document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlEmailConfirm_txtEmailConfirm'
        ),
        profileInfo['acc_email']
      );
      document.querySelector(
        'select#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlBillingAddress_ddlState'
      ).value = profileInfo['address_state'];
      setTimeout(
        () =>
          changeValueReact_select(
            document.querySelector(
              'select#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlBillingAddress_ddlState'
            ),
            profileInfo['address_state']
          ),
        500
      );

      if (
        !!document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox1'
        ) &&
        !document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox1'
        ).checked
      )
        document
          .querySelector(
            'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox1'
          )
          .click();
      if (
        !!document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox2'
        ) &&
        !document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox2'
        ).checked
      )
        document
          .querySelector(
            'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox2'
          )
          .click();
      if (
        !!document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox3'
        ) &&
        !document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox3'
        ).checked
      )
        document
          .querySelector(
            'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox3'
          )
          .click();
      if (
        !!document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox4'
        ) &&
        !document.querySelector(
          'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox4'
        ).checked
      )
        document
          .querySelector(
            'input#ctl00_bodyContentPlaceHolder_ucDisplayAddress_ctlCheckoutCheckBoxes_chkCheckoutCheckbox4'
          )
          .click();

      // Card Detail
      chrome.runtime.sendMessage({
        action: 'executeOnAllFramesForCard',
        data: { tabId: tab.id, card },
      });
    } else if (tab.url.includes('login.verizonwireless.com')) {
      const verizonAccount = {
        username: 'axwern@gmail.com',
        password: 'Pogi234!',
        secretQuestion: 'nicole',
      };

      changeValueReact(
        document.querySelector('input[name="IDToken1"][type="text"]'),
        verizonAccount.username
      );
      changeValueReact(document.querySelector('[name="IDToken2"]'), verizonAccount.password);
      changeValueReact(
        document.querySelector('input[name="IDToken1"][type="password"]'),
        verizonAccount.secretQuestion
      );
    } else if (tab.url.includes('go.seated.com')) {
      changeValueReact(document.querySelector('[data-test-first-name]'), profileInfo['fname']);
      changeValueReact(document.querySelector('[data-test-last-name]'), profileInfo['lname']);
      changeValueReact(document.querySelector('[data-test-email]'), profileInfo['acc_email']);
      changeValueReact(document.querySelector("input[data-phone-number='']"), profileInfo['tel']);

      if (!!document.querySelector('input#ember161-digit1')) {
        chrome.runtime.sendMessage({
          action: 'getPhoneOTP',
          data: {
            phone: profileInfo['tel'],
            otpType: 'seated',
          },
        });
      }
    } else if (tab.url.match(/fifa.com/i)) {
      const card = {
        type: 'visa',
        holder: profileInfo['full_name'],
        num: profileInfo['visa_num'],
        exp: profileInfo['visa_exp'],
        cvv: profileInfo['visa_cvv'],
      };
      fifaAutofillHandler(profileInfo, tab, card);
    }

    // Fill CVV , No Insuracne Option, Accept Terms and Policy Option on TM Checkout
    if (
      tab.url.match(
        /^https?:\/\/(www\.)?(ticketmaster|concerts\.livenation|livenation)\.[a-z.]+\/checkout\/order/
      ) ||
      tab.url.match(
        /^https?:\/\/(www\.)?(checkout)\.(ticketmaster|livenation)\.[a-z.]+/
      ) ||
      tab.url.match(
        /^https?:\/\/(www\.)?(ticketmaster|concerts\.livenation|livenation)\.[a-z.]+\/resale\/checkout\/order/
      )
    ) {
      //cvv
      // chrome.runtime.sendMessage({ action: 'focusTab', data: { tabId: tab.id } });

      const globalDocument = window.top.document;

      if (
        !!globalDocument.querySelector("input#placeOrderOptIn1input") &&
        !globalDocument.querySelector("input#placeOrderOptIn1input").checked
      )
        globalDocument
          .querySelector("label[for='placeOrderOptIn1input']")
          .click(); // resale accept
      if (
        !!globalDocument.querySelector("input#cta-opt-in") &&
        !globalDocument.querySelector("input#cta-opt-in").checked
      )
        globalDocument
          .querySelector("label[for='cta-opt-in']")
          .click(); /*normal accept*/
      if (
        !!globalDocument.querySelector("input[name='insurance'][value='false']")
      )
        globalDocument
          .querySelector("input[name='insurance'][value='false']")
          .click();
      /*normal insurance*/ else if (
        !!globalDocument.querySelector("input[name='insurance'][value='']")
      )
        globalDocument
          .querySelector("input[name='insurance'][value='']")
          .click();
      /*normal insurance*/ else if (
        !!globalDocument.querySelector(
          "input[name='insurance'][data-event-value='0']"
        )
      )
        globalDocument
          .querySelector("input[name='insurance'][data-event-value='0']")
          .click(); /*normal insurance*/

      // Place order in checkout Page
      /* if (document.querySelector('button[data-tid="place-order-btn"]')) {
                setTimeout(() => {
                    document.querySelector('button[data-tid="place-order-btn"]').click()
                }, 500);
            } */
    }
  });
}

// Set Focus on Checkout Modal on
// https://somethingcorporate.shop.ticketstoday.com/basket.aspx?Action=DisplayBasket
const checkoutModal = document.getElementById("divCyberSourceModal");
if (checkoutModal) {
  const isVisible = checkoutModal.getAttribute("display") === "block";
  if (isVisible) checkoutModal.focus();
}

// Key Event
async function handleIdentityIframeActions() {
  let email, phone;
  try {
    const userInfo = await getUserInformation();
    email = userInfo.email;
    phone = userInfo.phone;
  } catch (error) {
    console.log('Failed to get user information from API, falling back to storage:', error);
    
    const data = await new Promise(resolve => {
      chrome.storage.sync.get(["profileInfo"], resolve);
    });
    
    if (!data.profileInfo) return;
    
    const profileInfo = JSON.parse(data.profileInfo);
    email = profileInfo.acc_email || profileInfo.email;
    phone = profileInfo.tel || profileInfo.phone;
  }
  
  // Handle MFA flow with the obtained user information
  if (!!document.querySelector("input#mfa-code-input-field-input")) {
    const mfaType = document.querySelector('[data-bdd="mfa-last-four-digits"]')?.textContent.includes('@') ? 'email' : 'phone';
    chrome.runtime.sendMessage({
      action: mfaType === 'email' ? 'getEmailOTP' : 'getPhoneOTP',
      data: mfaType === 'email'
        ? { email: email, otpType: 'ticketmaster' }
        : { phone: phone, otpType: 'ticketmaster' },
    });
  }
}
let htmlInterface = null; // Added by O
let flag = false; // Added by O
let radios = null; //Added by O
document.addEventListener(
  "keydown",
  function (e) {
    console.log("keydown focus");
    if (e.altKey && e.code && e.code == 'KeyX') {
      if (window.location.hostname.includes('identity.ticketmaster')) {
        handleIdentityIframeActions();
      } else {
        chrome.runtime.sendMessage({ action: 'queryTabs' }, function (response) {
          let tab = response.tabs[0];
          _handleCommand(tab);
        });
      }
    } else if (e.altKey && e.code && e.code == 'KeyS') {
      chrome.runtime.sendMessage({ action: 'cardInfo' }, function (response) {
        const { data, profileId } = response;
        flag = !flag;

        if (!htmlInterface) {
          htmlInterface = document.createElement('span');
          htmlInterface.style.position = 'fixed';
          htmlInterface.style.top = '2%';
          htmlInterface.style.left = '40%';
          htmlInterface.style.width = '30%';
          htmlInterface.style.height = '30%';
          htmlInterface.style.overflowY = 'auto';
          htmlInterface.style.backgroundColor = 'white';
          htmlInterface.style.zIndex = '10000';
          htmlInterface.style.border = '2px solid black';
          htmlInterface.style.borderRadius = '10px';
          htmlInterface.style.fontSize = '20px';
          htmlInterface.style.padding = '10px';

          htmlInterface.innerHTML += '<label id="card-information"></label> <br /> <br />';

          const parentCards = data.map((item) => item.parentCard);
          const uniqueParentCards = [...new Set(parentCards)];

          uniqueParentCards.forEach((item) => {
            const content = `
                        <label>
                            <input type="radio" name="card" value="${item}" ${
              item.isSelected ? 'checked' : ''
            }> ${item}
                        </label><br />
                    `;
            htmlInterface.innerHTML += content;
          });

          htmlInterface.innerHTML += `<button style="position: absolute; bottom: 10px; right: 10px; border-radius: 10px;" id="btn-change">Change</button>`;
          document.body.appendChild(htmlInterface);

          const cardInformation = document.getElementById('card-information');

          const radios = document.querySelectorAll('input[name="card"]');
          const card = data.find((item) => item.profileID === profileId);

          if (card) {
            cardInformation.textContent = `${card.parentCard}: ***${card.number.slice(
              -4
            )} is assigned`;

            localStorage.setItem('cardNumber', card.number);
            localStorage.setItem('cardExp', card.expiration);
            localStorage.setItem('cardPin', card.pin);

            for (const radio of radios) {
              if (radio.value === card.parentCard) {
                radio.checked = true;
                break;
              }
            }
          } else {
            cardInformation.textContent = 'No Citi card is assigned';
          }

          document.getElementById('btn-change').addEventListener('click', () => {
            let selectedValue = '';
            for (const radio of radios) {
              if (radio.checked) {
                selectedValue = radio.value;
                break;
              }
            }

            if (selectedValue) {
              chrome.runtime.sendMessage(
                { action: 'setCard', card: selectedValue },
                function (response) {
                  const { set, parent, card, cardNumber, cardExp, cardPin } = response;

                  localStorage.setItem('cardNumber', cardNumber);
                  localStorage.setItem('cardExp', cardExp);
                  localStorage.setItem('cardPin', cardPin);

                  if (set) {
                    cardInformation.textContent = parent + ': ***' + card + ' is assigned';
                  } else {
                    cardInformation.textContent = 'No card to assign';
                  }
                }
              );
            }
          });
        }

        htmlInterface.style.display = flag ? 'block' : 'none';
      });
    }
    //////////////////////////////////
    else if (e.altKey && e.code && e.code == 'KeyZ') {
      chrome.runtime.sendMessage({ action: 'queryTabs' }, function (response) {
        tab = response.tabs[0];
        _handleCommand1(tab);
      });
    } else if (e.altKey && e.code && e.code == 'Digit2') {
      chrome.runtime.sendMessage({ action: 'queryTabs' }, function (response) {
        tab = response.tabs[0];
        _handleCommand2(tab);
      });
    } else if (e.altKey && e.code && e.code == 'Digit3') {
      chrome.runtime.sendMessage({ action: 'queryTabs' }, function (response) {
        tab = response.tabs[0];
        _handleCommand3(tab);
      });
    }
  },
  true
);

// Create a MutationObserver instance
const observer = new MutationObserver(function (mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      // Check for added nodes with the class "Kj-JD"
      const addedNodes = Array.from(mutation.addedNodes);
      for (const node of addedNodes) {
        if (node instanceof HTMLElement && node.classList.contains("Kj-JD")) {
          // Handle the dynamically added element here
          document
            .querySelector(".Kj-JD")
            .addEventListener("keydown", function (e) {
              if (e.altKey && e.code && e.code == "KeyZ") {
                chrome.runtime.sendMessage(
                  { action: "queryTabs" },
                  function (response) {
                    tab = response.tabs[0];
                    _handleCommand1(tab);
                  }
                );
              }
            });
        }
      }
    }
  }
});

// Define the target node to observe (e.g., the entire document or a specific element)
const targetNode = document; // You can change this to a specific element if needed

// Define the type of mutations to observe
const config = { childList: true, subtree: true };

// Start observing the target node
observer.observe(targetNode, config);

window.addEventListener("load", function () {
  console.log("WindowLoaded");
  // Password Update Detection and automatically send to server.

  // Scrape purchase information and send to server
  /* if ((window.location.href.includes('checkout.ticketmaster.com/confirmation')) || (window.location.href.includes('checkout.livenation.com/confirmation'))) {
        console.log('url detected checkout.ticketmaster.com/confirmation')
        // Call the function to initiate the scraping process
        scrapeUntilEventNameNotEmpty();
    } */

  if (window.location.href.includes("/wallet")) {
    const buttonObserver = new MutationObserver((mutations) => {
      const button = document.querySelector("button.bNqXxX");
      if (button) {
        button.addEventListener("click", () => {
          const observer = new MutationObserver((mutations) => {
            const iframe = document.querySelector("iframe[title='fan_wallet']");
            if (iframe) {
              iframe.focus();
              observer.disconnect();
            }
          });

          observer.observe(document.body, { childList: true, subtree: true });
        });
      }
    });

    buttonObserver.observe(document.body, { childList: true, subtree: true });
  }
});

function areAllPropertiesUpdated(purchaseInfo) {
  for (const key in purchaseInfo) {
    if (purchaseInfo[key] === "") {
      return false; // If any property is empty, return false
    }
  }
  return true; // All properties are updated
}

function scrapePurchaseInformation() {
  const purchaseInfo = {
    cardType: "",
    cardLastFourDigit: "",
    totalPrice: "",
    eventName: "",
    seatSection: "",
    orderNumber: "",
    deliveryName: "",
  };

  const cardSectionElement = document.querySelector(
    '[data-tid="card-section"]'
  );
  // Check if the element exists before trying to access its children
  if (cardSectionElement) {
    // Get the second child using the children property
    const secondChild = cardSectionElement.children[1];
    if (secondChild) {
      const targetElement = secondChild.children[0];
      if (targetElement) {
        const cardString = targetElement.textContent
          ?.replace(/\s/g, "")
          .split("-");
        purchaseInfo.cardType = cardString[0] ? cardString[0] : "";
        purchaseInfo.cardLastFourDigit = cardString[1] ? cardString[1] : "";
      }
    }
  }

  const totalPriceElement = document.querySelector(
    '[data-tid="summary-grand-total-price"]'
  );
  if (totalPriceElement) {
    purchaseInfo.totalPrice = totalPriceElement.textContent
      ?.trim()
      .replace(/\$/g, "");
  }

  const eventNameElement = document.querySelector('[data-tid="event-name"]');
  if (eventNameElement) {
    purchaseInfo.eventName = eventNameElement.textContent?.trim();
  }

  const seatSectionElement = document.querySelector(
    '[data-tid="seat-section"]'
  );
  if (seatSectionElement) {
    // Get all children of seatSectionElement
    const children = seatSectionElement.children;

    // Initialize an array to store text content of each child
    const textContents = [];

    // Iterate over each child and add its text content to the array
    for (let i = 0; i < children.length; i++) {
      textContents.push(children[i].textContent);
    }

    // Join the text content using a separator (e.g., comma)
    purchaseInfo.seatSection = textContents.join(", ");
  }

  const orderNumberElement = document.querySelector(
    '[data-tid="order-number"]'
  );
  if (orderNumberElement) {
    purchaseInfo.orderNumber = orderNumberElement.textContent
      ?.split(":")[1]
      ?.trim();
  }

  const deliveryNameElement = document.querySelector(
    '[data-tid="delivery-name"]'
  );
  if (deliveryNameElement) {
    purchaseInfo.deliveryName = deliveryNameElement.textContent
      ?.split(":")[1]
      ?.trim();
  }
  return purchaseInfo;
}

function scrapeUntilEventNameNotEmpty() {
  // Counter to keep track of the number of timeout calls
  let timeoutCounter = 0;

  const scrapeAndCheck = () => {
    const purchaseInfo = scrapePurchaseInformation();
    console.log("Inside scrapeAndCheck - Purchase", purchaseInfo);

    if (areAllPropertiesUpdated(purchaseInfo)) {
      // If eventName is not empty, do something with the result
      console.log("purchaseInfo: ", purchaseInfo);
      chrome.runtime.sendMessage({
        action: "sendPurchaseHistory",
        data: { purchaseInfo },
      });
    } else {
      // If eventName is still empty, increment the counter
      timeoutCounter++;

      console.log("Timeout called", timeoutCounter, "times");

      if (timeoutCounter < 5) {
        // If less than 5 times, wait for a specified interval and then try again
        setTimeout(scrapeAndCheck, 1000); // Adjust the interval (in milliseconds) as needed
      } else {
        // If 3 times or more, trigger a page refresh
        console.log("Refreshing the page...");
        location.reload();
      }
    }
  };

  // Start the recursive function
  scrapeAndCheck();
}
