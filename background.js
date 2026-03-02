/**
 * Extract sys_id from a URL, handling two common ServiceNow patterns:
 *
 *  1. Standard query string:
 *     https://x.service-now.com/incident.do?sys_id=abc123
 *
 *  2. Encoded query string (the whole ?key=val block is percent-encoded in the path):
 *     https://x.service-now.com/sys_remote_update_set.do%3Fsys_id%3Dabc123%26...
 *
 * In case 2 the browser's URL parser treats everything after .do as part of the
 * pathname (no real query string), so url.searchParams comes back empty.
 * Decoding the raw URL string first recovers the real key=value pairs.
 */
/**
 * Fully decode a percent-encoded URL string, handling single and double encoding.
 * e.g. %3F → ?, %3D → =, %26 → &
 */
function decodeUrl(rawUrl) {
  let decoded = rawUrl;
  try {
    let prev;
    do {
      prev = decoded;
      decoded = decodeURIComponent(decoded);
    } while (decoded !== prev);
  } catch {
    // partial decode is better than nothing
  }
  return decoded;
}

/**
 * Extract sys_id from a ServiceNow URL.
 * Handles both standard (?sys_id=) and encoded (%3Fsys_id%3D) query strings.
 */
function extractSysId(rawUrl) {
  const decoded = decodeUrl(rawUrl);
  try {
    const sysId = new URL(decoded).searchParams.get("sys_id");
    if (sysId) return sysId;
  } catch { /* fall through */ }
  const match = decoded.match(/[?&]sys_id=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * Build a clean nav_to.do URL from any ServiceNow record URL.
 *
 * Input examples:
 *   /now/nav/ui/classic/params/target/sys_remote_update_set.do%3Fsys_id%3DXXX%26sysparm_view%3D...
 *   /incident.do?sys_id=XXX&sysparm_nostack=true
 *
 * Output:
 *   https://instance.service-now.com/nav_to.do?uri=sys_remote_update_set.do?sys_id=XXX
 */
function buildNavUrl(rawUrl) {
  const decoded = decodeUrl(rawUrl);
  let url;
  try {
    url = new URL(decoded);
  } catch {
    return null;
  }

  // Match the .do table name from any path depth
  //   /tablename.do                                 — direct
  //   /now/nav/ui/classic/params/target/tablename.do — framed UI
  const tableMatch = url.pathname.match(/\/([\w.]+\.do)$/);
  if (!tableMatch) return null;

  const table = tableMatch[1];
  const sysId = url.searchParams.get("sys_id");
  const uri   = sysId ? `${table}?sys_id=${sysId}` : table;

  return `${url.origin}/nav_to.do?uri=${uri}`;
}

browser.commands.onCommand.addListener(async (command) => {
  if (!["copy-sys-id", "copy-url", "theme-dark", "theme-light"].includes(command)) return;

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  // Guard: only act on service-now.com tabs.
  if (!tab.url.includes("service-now.com")) return;

  if (command === "copy-sys-id") {
    browser.tabs.sendMessage(tab.id, {
      type: "snutils:copy-sys-id",
      sysId: extractSysId(tab.url),
    });
  } else if (command === "copy-url") {
    browser.tabs.sendMessage(tab.id, {
      type: "snutils:copy-url",
      url: buildNavUrl(tab.url) ?? tab.url,
    });
  } else {
    browser.tabs.sendMessage(tab.id, {
      type: "snutils:set-theme",
      dark: command === "theme-dark",
    });
  }
});
