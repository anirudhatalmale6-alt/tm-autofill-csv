console.log("External file is also loaded!")

function dynamicFunctionForCard(card) {
function changeValueReact(el, value) {
  if (!el) return;
  
  if (el.tagName === 'SELECT') {
    // Handle select elements differently
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  } else {
    let input = el; 
    let lastValue = input.value; 
    input.value = value;
    let event = new Event('input', { bubbles: true }); 
    event.simulated = true;
    let tracker = input._valueTracker;
    if (tracker) {
      tracker.setValue(lastValue);
    }
    input.dispatchEvent(event);
  }
}

  function fillInput(el, value) { if (!el) return false; el.value = value; return true; }

  // TicketMaster Payment 
  if (document.querySelector("input[name='credit-card-number']")) {
    changeValueReact(document.querySelector("input[name='credit-card-number']"), card.num);
  }
  if (document.querySelector("input[name='expiration']")) {
    changeValueReact(document.querySelector("input[name='expiration']"), card.exp);
  }
  if (document.querySelector("input[name='cvv']")) {
    changeValueReact(document.querySelector("input[name='cvv']"), card.cvv);
  }

  // Seatgeek Payment Form
  let evt = new Event('change', { bubbles: true })
  const year = `${new Date().getFullYear().toString().slice(0, 2) + card.exp?.split('/')[1]}`;
  const month = `${card.exp?.split('/')[0] * 1}`
  if (fillInput(document.querySelector("select[name='expiration_year']"), year))
    document.querySelector("select[name='expiration_year']").dispatchEvent(evt)

  if (fillInput(document.querySelector("select[name='expiration_month']"), month))
    document.querySelector("select[name='expiration_month']").dispatchEvent(evt)

  changeValueReact(document.querySelector("input[name='card_number']"), card.num);
  changeValueReact(document.querySelector("#cvv"), card.cvv);

  // ticketstoday Payment Modal Form
  if (card.type && card.type == 'visa')
    if (!!document.querySelector("input#card_type_001")) document.querySelector("input#card_type_001").click();

  if (card.type && card.type == 'amex')
    if (!!document.querySelector("input#card_type_003")) document.querySelector("input#card_type_003").click();

  fillInput(document.querySelector("input#card_number"), card.num)

  /*  if (fillInput(document.querySelector("input#card_number"), card.num))
        document.querySelector("input#card_number").focus(); */

  changeValueReact(document.querySelector("select#card_expiry_month"), card.exp?.split('/')[0])

  changeValueReact(document.querySelector("select#card_expiry_year"), year)

  fillInput(document.querySelector("input#card_cvn"), card.cvv)

    changeValueReact(document.querySelector('#card_number'),card.num);
    changeValueReact(document.querySelector('#card_holder'),card.holder);
    changeValueReact(document.querySelector('#card_cvv'),card.cvv);
    changeValueReact(document.querySelector('#card_expiration_date_month'),card.exp?.split('/')[0]);
    changeValueReact(document.querySelector('#card_expiration_date_year'),'20' + card.exp?.split('/')[1]);

  /*  if (fillInput(document.querySelector("input#card_cvn"), card.cvv))
       document.querySelector("input#card_cvn").focus(); */
}


function dynamicFunctionForEmailOTP(code) {
 function changeValueReact(el, value) {
   if (!el) return false;
   
   let input = el;
   let lastValue = input.value;
   input.value = value;
   
   let event = new Event('input', { bubbles: true });
   event.simulated = true;
   
   let tracker = input._valueTracker;
   if (tracker) {
     tracker.setValue(lastValue);
   }
   
   input.dispatchEvent(event);
   return true;
 }
 
 const selectors = [
   "input#mfa-code-input-field",
   "input[name='otp']",
   "input#otp-input-input",
   "input#mfa-code-input-field-input",
   'input#otp',
   'input#iOttText'
 ];
 
 let filled = false;
 
 selectors.forEach(selector => {
   const elements = document.querySelectorAll(selector);
   if (elements.length > 0) {
     elements.forEach(element => {
       if (changeValueReact(element, code)) {
         filled = true;
       }
     });
   }
 });
 
 return filled;
}

function dynamicFunctionForPhoneOTP(code, otpType) {
  function changeValueReact(el, value) {
    let input = el;
    if (!input) return;
    let lastValue = input.value;
    input.value = value;
    let event = new Event('input', { bubbles: true });
    event.simulated = true;
    let tracker = input._valueTracker;
    if (tracker) {
      tracker.setValue(lastValue);
    }
    input.dispatchEvent(event);
  }
  if (!!document.querySelector("input#mfa-code-input-field-input")) {
    changeValueReact(document.querySelector("input#mfa-code-input-field-input"), code);
  }
  if(!!document.querySelector("input#otp-input-input")) {
    changeValueReact(document.querySelector("input#otp-input-input"), code);
  }
  changeValueReact(document.querySelector("#enter-code-input"), code);
  changeValueReact(document.querySelector("#iOttText"), code);

  if(otpType == "seated") {
    document.querySelector("input#ember161-digit1").value = code.charAt(0);
    document.querySelector("input#ember161-digit2").value = code.charAt(1);
    document.querySelector("input#ember161-digit3").value = code.charAt(2);
    document.querySelector("input#ember161-digit4").value = code.charAt(3);
  }
}

function getEventFromUrl(url) {
  const urlObject = new URL(url);
  const pathname = urlObject.pathname;
  const pathSegments = pathname.split('/');
  const filteredSegments = pathSegments.filter(segment => segment.trim() !== '');
  const lastSegment = filteredSegments[filteredSegments.length - 1];
  return lastSegment
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("ChangeInfo", changeInfo);
  const { status, url } = changeInfo;

  // Regular expression to match the specified formats
  const eventRegex1 = /^https:\/\/concerts\.livenation\.com(?:\/[^\/]+)?\/event\/([a-zA-Z0-9]+)$/;
  const eventRegex2 = /^https:\/\/www\.ticketmaster\.com(?:\/[^\/]+)?\/event\/([a-zA-Z0-9]+)$/;
  if (url) {
    // Function to check if the URL matches either format
    if (eventRegex1.test(url) || eventRegex2.test(url)) {
      const eventId = getEventFromUrl(url);
      console.log('eventId: ', eventId);
      chrome.storage.sync.set({ eventId: eventId });
    }
    if ((url.includes('checkout.ticketmaster.com/confirmation')) || (url.includes('checkout.livenation.com/confirmation'))) {
      chrome.tabs.sendMessage(tabId, {
        type: 'scrapePurchaseInfo'
      })
    }
  }

});
