// Create button
let button = document.createElement("button");
button.innerText = "Download Schedule";
button.id = "ext-download";

// Add button to page
let scheduleContainer = document.getElementById("portalPageBodyColumns");
scheduleContainer.appendChild(button);

// Load a extension style document from local path
const loadStyle = (path) => {
  let styleDocument = document.createElement("link");
  styleDocument.setAttribute("rel", "stylesheet");
  styleDocument.setAttribute("href", chrome.runtime.getURL(path));
  document.head.appendChild(styleDocument)
}

// Load a extension script document from local path
const loadScript = (path) => {
  let downloadScript = document.createElement("script");
  downloadScript.setAttribute("src", chrome.runtime.getURL(path));
  document.body.appendChild(downloadScript)
}

loadStyle("style/styles.css");
loadScript("scripts/downloader.js");
loadScript("scripts/ics.deps.min.js");
loadScript("scripts/luxon.min.js");