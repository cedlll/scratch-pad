"use strict";

// Click extension icon → open scratchly in a new tab
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html") });
});

// Keyboard shortcut → open scratchly in a new tab
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-scratchpad") {
    chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html") });
  }
});
