let currentSettings = { 
  enabled: true, 
  backSec: 10, 
  forSec: 10, 
  showSpeedUI: true, 
  showLoopUI: true 
};

function removeAllControls() {
  document.querySelectorAll('.custom-overlay-wrapper').forEach(el => el.remove());
  document.querySelectorAll('video').forEach(v => { v.dataset.hasControls = "false"; });
}

chrome.storage.local.get(['enabled', 'backSec', 'forSec', 'showSpeedUI', 'showLoopUI'], (res) => {
  Object.assign(currentSettings, res);
  if (!currentSettings.enabled) removeAllControls();
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "UPDATE_SETTINGS") {
    currentSettings = request.settings;
    removeAllControls(); 
    if (currentSettings.enabled) {
      document.querySelectorAll('video').forEach(addControls);
    }
  }
});

function addControls(video) {
  if (!currentSettings.enabled || video.dataset.hasControls === "true" || video.offsetWidth < 200) return;
  video.dataset.hasControls = "true";

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-overlay-wrapper';
  const stop = (e) => { e.stopPropagation(); };

  // Navigasi
  const createBtn = (isForward) => {
    const btn = document.createElement('div');
    btn.className = isForward ? 'vid-btn-new btn-for' : 'vid-btn-new btn-back';
    btn.innerHTML = isForward 
      ? `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4,15V9H12V4.16L19.84,12L12,19.84V15H4Z"/></svg>`
      : `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20,9V15H12V19.84L4.16,12L12,4.16V9H20Z"/></svg>`;
    btn.onclick = (e) => {
      stop(e);
      video.currentTime += isForward ? currentSettings.forSec : -currentSettings.backSec;
    };
    btn.onmousedown = stop;
    btn.ondblclick = stop;
    return btn;
  };

  wrapper.appendChild(createBtn(false));
  wrapper.appendChild(createBtn(true));

  // Dashboard Lokal
  if (currentSettings.showSpeedUI || currentSettings.showLoopUI) {
    const dashboard = document.createElement('div');
    dashboard.className = 'video-dashboard-local';
    dashboard.onmousedown = stop;
    dashboard.onclick = stop;
    dashboard.ondblclick = stop;

    let content = '';
    if (currentSettings.showSpeedUI) {
      content += `
        <div class="dash-section">
          <label>SPEED</label>
          <input type="number" class="local-speed" min="0.1" max="10" step="0.5" value="${video.playbackRate}">
        </div>`;
    }
    if (currentSettings.showLoopUI) {
      content += `
        <div class="dash-section">
          <button class="set-loop" data-type="start">Start</button>
          <input type="number" class="loop-val start-val" value="0">
          <button class="set-loop" data-type="end">End</button>
          <input type="number" class="loop-val end-val" value="0">
          <div class="loop-toggle-container">
            <label class="dash-switch">
              <input type="checkbox" class="loop-toggle">
              <span class="dash-slider"></span>
            </label>
            <span class="loop-text-label">LOOPS</span>
          </div>
        </div>`;
    }
    dashboard.innerHTML = content;
    wrapper.appendChild(dashboard);

    if (currentSettings.showSpeedUI) {
      const si = dashboard.querySelector('.local-speed');
      si.oninput = () => { if(si.value) video.playbackRate = parseFloat(si.value); };
    }
    if (currentSettings.showLoopUI) {
      const sIn = dashboard.querySelector('.start-val');
      const eIn = dashboard.querySelector('.end-val');
      const lTog = dashboard.querySelector('.loop-toggle');
      dashboard.querySelectorAll('.set-loop').forEach(b => {
        b.onclick = (e) => {
          stop(e);
          if (b.dataset.type === 'start') sIn.value = Math.floor(video.currentTime);
          else eIn.value = Math.floor(video.currentTime);
        };
      });
      video.addEventListener('timeupdate', () => {
        if (lTog.checked) {
          let s = parseFloat(sIn.value), e = parseFloat(eIn.value);
          if (e > s && (video.currentTime >= e || video.currentTime < s)) video.currentTime = s;
        }
      });
    }
  }

  video.insertAdjacentElement('afterend', wrapper);
  const sync = () => {
    const rect = video.getBoundingClientRect();
    wrapper.style.width = rect.width + 'px';
    wrapper.style.height = rect.height + 'px';
    wrapper.style.top = video.offsetTop + 'px';
    wrapper.style.left = video.offsetLeft + 'px';
  };
  new ResizeObserver(sync).observe(video);
  video.addEventListener('loadedmetadata', sync);
  sync();
}

const observer = new MutationObserver(() => {
  if (currentSettings.enabled) document.querySelectorAll('video').forEach(addControls);
});
observer.observe(document.body, { childList: true, subtree: true });