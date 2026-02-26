document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['enabled', 'backSec', 'forSec', 'showSpeedUI', 'showLoopUI'], (res) => {
    document.getElementById('enabled').checked = res.enabled ?? true;
    document.getElementById('backSec').value = res.backSec ?? 10;
    document.getElementById('forSec').value = res.forSec ?? 10;
    document.getElementById('showSpeedUI').checked = res.showSpeedUI ?? true;
    document.getElementById('showLoopUI').checked = res.showLoopUI ?? true;
  });
});

document.getElementById('save').onclick = () => {
  const settings = {
    enabled: document.getElementById('enabled').checked,
    backSec: parseInt(document.getElementById('backSec').value),
    forSec: parseInt(document.getElementById('forSec').value),
    showSpeedUI: document.getElementById('showSpeedUI').checked,
    showLoopUI: document.getElementById('showLoopUI').checked
  };
  
  chrome.storage.local.set(settings, () => {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {type: "UPDATE_SETTINGS", settings}).catch(() => {});
      });
    });
    window.close();
  });
};