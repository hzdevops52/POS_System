#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

python3 <<'PY'
from pathlib import Path
from datetime import datetime
import shutil

vite = Path("frontend/vite.config.js")
app = Path("frontend/src/App.jsx")
css = Path("frontend/src/app.css")

files = [vite, app, css]
for file in files:
    if not file.is_file():
        raise SystemExit(f"Missing required file: {file}")

v = vite.read_text()
a = app.read_text()
c = css.read_text()

# Validate the expected starting structure before changing anything.
if "proxy:" not in v and "strictPort: true" not in v:
    raise SystemExit("Unexpected Vite configuration; no files changed.")

if "useEffect" not in a and "useState(() => {" not in a:
    raise SystemExit("Unexpected App.jsx event-listener structure; no files changed.")

if "api-status-checking" not in c and ".api-status" not in c:
    if "demo-disclaimer" not in c:
        raise SystemExit("Unexpected CSS structure; no files changed.")

changes = {}

# Vite API proxy.
if "proxy:" not in v:
    old = "    strictPort: true\n"
    new = """    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      }
    }
"""
    if old not in v:
        raise SystemExit("Could not locate Vite server settings; no files changed.")
    changes[vite] = v.replace(old, new, 1)

# Correct React effect lifecycle.
if "useEffect" not in a.splitlines()[0]:
    a = a.replace(
        "import { useState } from 'react';",
        "import { useEffect, useState } from 'react';",
        1
    )

old_listener = """  useState(() => {
    const handler = event => setActive(event.detail);
    window.addEventListener('pos:navigate', handler);
    return () => window.removeEventListener('pos:navigate', handler);
  });"""

new_listener = """  useEffect(() => {
    const handler = event => setActive(event.detail);
    window.addEventListener('pos:navigate', handler);
    return () => window.removeEventListener('pos:navigate', handler);
  }, []);"""

if old_listener in a:
    a = a.replace(old_listener, new_listener, 1)
elif new_listener not in a:
    raise SystemExit("Could not safely locate the navigation listener; no files changed.")

# Add API status state.
if "const [apiStatus, setApiStatus]" not in a:
    old_state = "  const [search, setSearch] = useState('');"
    new_state = """  const [search, setSearch] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');"""
    if old_state not in a:
        raise SystemExit("Could not locate App state declarations; no files changed.")
    a = a.replace(old_state, new_state, 1)

# Poll the real backend health endpoint.
if "fetch('/api/v1/health')" not in a:
    marker = "  const dateLabel = new Intl.DateTimeFormat("
    effect = """  useEffect(() => {
    let mounted = true;

    async function checkApi() {
      try {
        const response = await fetch('/api/v1/health');
        const result = response.ok ? await response.json() : null;
        if (mounted) {
          setApiStatus(result?.status === 'ok' ? 'connected' : 'disconnected');
        }
      } catch {
        if (mounted) setApiStatus('disconnected');
      }
    }

    checkApi();
    const intervalId = window.setInterval(checkApi, 30000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

"""
    if marker not in a:
        raise SystemExit("Could not locate the topbar date declaration; no files changed.")
    a = a.replace(marker, effect + marker, 1)

# Place the indicator in the existing topbar.
if "className={`api-status api-status-${apiStatus}`}" not in a:
    marker = '            <span className="topbar-date">{dateLabel}</span>'
    indicator = """            <span className={`api-status api-status-${apiStatus}`} role="status" aria-live="polite">
              <i />
              {apiStatus === 'connected' ? 'API Connected' : apiStatus === 'checking' ? 'Checking API' : 'API Offline'}
            </span>"""
    if marker not in a:
        raise SystemExit("Could not locate topbar date markup; no files changed.")
    a = a.replace(marker, marker + "\n" + indicator, 1)

# Add restrained styles without replacing existing CSS.
if ".api-status {" not in c:
    c += """

/* Backend connection indicator */
.api-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  padding: 6px 9px;
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--muted);
  background: var(--surface);
  font-size: 10px;
  font-weight: 650;
}
.api-status i {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #C28A36;
}
.api-status-connected i { background: #27834B; }
.api-status-disconnected i { background: #B5473C; }

@media (max-width: 700px) {
  .api-status { padding: 6px 7px; font-size: 9px; }
}
"""

# Only back up files that actually need changes.
for path, updated in ((vite, changes.get(vite, v)), (app, a), (css, c)):
    if updated != path.read_text():
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup = path.with_name(path.name + f".bak-{stamp}")
        shutil.copy2(path, backup)
        path.write_text(updated)
        print(f"Updated: {path} (backup: {backup})")
    else:
        print(f"Already configured: {path}")

print("API connection update complete.")
PY

printf '\n%s\n' '--- Frontend production build ---'
npm --prefix frontend run build

printf '\n%s\n' '--- Backend direct health check ---'
curl --fail --silent --show-error http://127.0.0.1:5001/api/v1/health

printf '\n\n%s\n' '--- API through the Vite proxy ---'
curl --fail --silent --show-error http://127.0.0.1:5173/api/v1/health

printf '\n'
