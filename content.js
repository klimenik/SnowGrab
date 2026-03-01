// ── Toast UI ────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById("snutils-styles")) return;
  const style = document.createElement("style");
  style.id = "snutils-styles";
  style.textContent = `
    #snutils-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-radius: 8px;
      font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
      font-size: 13px;
      line-height: 1.4;
      color: #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 200ms ease, transform 200ms ease;
      pointer-events: none;
      width: max-content;
      max-width: min(580px, calc(100vw - 48px));
    }
    #snutils-toast.snutils-show {
      opacity: 1;
      transform: translateY(0);
    }
    #snutils-toast.snutils-success { background: #1a6b3c; }
    #snutils-toast.snutils-error   { background: #8b1a1a; }
    #snutils-toast .snutils-icon   { flex-shrink: 0; font-size: 16px; }
  `;
  document.documentElement.appendChild(style);
}

let toastEl = null;
let hideTimer = null;

function showToast(message, type = "success") {
  injectStyles();

  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "snutils-toast";
    document.documentElement.appendChild(toastEl);
  }

  clearTimeout(hideTimer);

  toastEl.className = `snutils-${type}`;
  toastEl.innerHTML = `
    <span class="snutils-icon">${type === "success" ? "✓" : "✕"}</span>
    <span>${message}</span>
  `;

  // Force reflow so the transition fires even if toast is already visible
  toastEl.offsetHeight; // eslint-disable-line no-unused-expressions
  toastEl.classList.add("snutils-show");

  hideTimer = setTimeout(() => {
    toastEl.classList.remove("snutils-show");
  }, 2800);
}

// ── Clipboard helper ─────────────────────────────────────────────────────────

function copyText(text, successMsg) {
  navigator.clipboard
    .writeText(text)
    .then(() => showToast(successMsg, "success"))
    .catch(() => showToast("Failed to copy to clipboard", "error"));
}

// ── Message handler ──────────────────────────────────────────────────────────

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "snutils:copy-sys-id") {
    const { sysId } = message;
    if (!sysId) {
      showToast("No sys_id found in URL", "error");
      return;
    }
    copyText(sysId, `Copied sys_id: ${sysId}`);
  } else if (message.type === "snutils:copy-url") {
    copyText(message.url, "URL copied");
  }
});
