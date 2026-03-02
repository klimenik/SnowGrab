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

// ── Theme ─────────────────────────────────────────────────────────────────────

// OOB sys_ids — consistent across all ServiceNow instances (base platform records).
const POLARIS_THEME = "31bf91ae07203010e03948f78ad30095";
const DARK_VARIANT  = "e09ef7ae07103010e03948f78ad3002c";

const THEME_MUTATION = "mutation snCanvasAppshellRoot($name:String!$value:String!)" +
  "{now{userPreference{updateUserPreference(name:$name value:$value){name value}}}}";

async function setTheme(dark) {
  const variant = dark ? DARK_VARIANT : "";
  const label   = dark ? "Dark" : "Light";

  async function gql(name, value) {
    const res = await fetch(`${location.origin}/api/now/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operationName: "snCanvasAppshellRoot",
        query: THEME_MUTATION,
        variables: { name, value },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[SnowGrab] GraphQL error body:", body);
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 120)}`);
    }
  }

  try {
    await gql("glide.ui.polaris.theme", POLARIS_THEME);
    await gql("glide.ui.polaris.theme.variant", variant);

    showToast(`Switched to ${label} mode — reloading…`, "success");
    setTimeout(() => location.reload(), 900);
  } catch (err) {
    console.error("[SnowGrab] Theme change failed:", err);
    showToast(`Theme change failed: ${err.message}`, "error");
  }
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
  } else if (message.type === "snutils:set-theme") {
    setTheme(message.dark);
  }
});
