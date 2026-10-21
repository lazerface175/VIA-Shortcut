# VIA-Shortcut

A zero-dependency tool that turns any pressed key combination into the exact QMK syntax for [usevia.app](https://usevia.app) → **Special → Any**.

## Usage

**As a web page:** open `index.html` in any browser (double-click it — it loads `extension/qmk.js`, or serve the folder with any static file server).

**As a browser extension (Chromium):** all extension files live in [`extension/`](extension/).

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder.
4. Click the extension's toolbar icon — or press `Ctrl+Shift+K` (`Cmd+Shift+K` on macOS) — to open the popup.

Then, either way:

1. Click the capture box.
2. Press your key combination (e.g. `Ctrl+Shift+Esc`).
3. Copy the generated string (e.g. `C(S(KC_ESC))`) into VIA's **Special → Any** input.

## Features

- Live modifier tracking while you hold keys.
- Compound aliases shown when one exists: `LCA`, `MEH`, `HYPR`, `SGUI`, `LCS`, `LCG`, `LSA`, `LAG`, `LCAG`.
- Optional left/right modifier output (`LCTL`, `RSFT`, …) and full modifier names (`LCTL` instead of `C`).
- Manual picker for OS-reserved shortcuts the browser can't capture (Win+D, Ctrl+Alt+Del, Cmd+Space).
- Full key map: letters, digits, F1–F24, navigation/editing, punctuation, numpad, media/system, and international keys.
- History of captured combos with one-click copy (persisted across popup opens in the extension).
