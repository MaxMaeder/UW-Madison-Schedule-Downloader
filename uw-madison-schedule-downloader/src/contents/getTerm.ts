import browser from "webextension-polyfill";

import { GET_TERM_MSG } from "~assets/constants";
import type { AppMessage } from "~types";

browser.runtime.onMessage.addListener(
  (message: AppMessage, sender, sendResponse) => {
    if (message.type === GET_TERM_MSG) {
      try {
        const dropdown = document.querySelector("select#term-code");
        const selectedOption = dropdown.querySelector("option[selected]");
        const detectedSemester = selectedOption.textContent;
        sendResponse({ detectedSemester });
      } catch (error) {
        console.error("Error extracting semester: ", error);
        sendResponse({ detectedSemester: "None" });
      }
      return true;
    }
  }
);
