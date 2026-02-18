"use strict";

// Click extension icon → toggle side panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Keyboard shortcut → open side panel
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open-scratchpad") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  }
});
