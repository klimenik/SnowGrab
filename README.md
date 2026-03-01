# SnowGrab

A Firefox extension for ServiceNow power users. Grab the `sys_id` or a clean record URL from any ServiceNow page with a single keyboard shortcut — no more hunting through the address bar.

---

## Features

| Shortcut | Action |
|---|---|
| `Cmd+Shift+I` (Mac) / `Ctrl+Shift+S` (Win/Linux) | Copy `sys_id` from the current URL |
| `Cmd+Shift+U` (Mac) / `Ctrl+Shift+U` (Win/Linux) | Copy a clean `nav_to.do` record URL |

Both shortcuts only activate on `*.service-now.com` pages and are **fully remappable** via Firefox's built-in shortcut manager (`about:addons` → gear icon → Manage Extension Shortcuts).

### URL normalisation

ServiceNow's modern UI wraps record URLs in a frame path like:

```
/now/nav/ui/classic/params/target/incident.do%3Fsys_id%3DXXX%26sysparm_view%3D...
```

SnowGrab decodes and strips that down to the portable `nav_to.do` format that works across any instance and UI version:

```
https://your-instance.service-now.com/nav_to.do?uri=incident.do?sys_id=XXX
```

A small toast notification confirms what was copied.

---

## Installation

SnowGrab is not (yet) listed on addons.mozilla.org. Load it as a temporary or permanent unsigned extension:

### Temporary (development / testing)

1. Open `about:debugging` in Firefox
2. Click **This Firefox** → **Load Temporary Add-on…**
3. Select the `manifest.json` file from this repo
4. The extension is active until Firefox is restarted

### Permanent (unsigned, requires config change)

1. Open `about:config` and set `xpinstall.signatures.required` to `false`
2. Open `about:addons` → gear icon → **Install Add-on From File…**
3. Select the `manifest.json` (or zip the repo contents and select the `.zip`)

---

## Project structure

```
├── manifest.json   — Extension manifest (MV2, Firefox)
├── background.js   — Command listener, URL parsing, nav_to.do construction
├── content.js      — Clipboard write, toast notification UI
└── icons/
    ├── icon-48.png
    └── icon-96.png
```

---

## Development

No build step required — the extension runs directly from source.

After editing any file, go to `about:debugging` → SnowGrab → **Reload** to pick up changes.
