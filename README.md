# VIA-Shortcut

A single-file, zero-dependency web app that turns any pressed key combination into the exact QMK syntax for [usevia.app](https://usevia.app) → **Special → Any**.

## Usage

Open `index.html` in any browser (double-click it, or serve it with any static file server).

1. Click the capture box.
2. Press your key combination (e.g. `Ctrl+Shift+Esc`).
3. Copy the generated string (e.g. `C(S(KC_ESC))`) into VIA's **Special → Any** input.

## Features

- Live modifier tracking while you hold keys.
- Compound aliases shown when one exists: `LCA`, `MEH`, `HYPR`, `SGUI`, `LCS`, `LCG`, `LSA`, `LAG`, `LCAG`.
- Optional left/right modifier output (`LCTL`, `RSFT`, …) and full modifier names (`LCTL` instead of `C`).
- Manual picker for OS-reserved shortcuts the browser can't capture (Win+D, Ctrl+Alt+Del, Cmd+Space).
- Full key map: letters, digits, F1–F24, navigation/editing, punctuation, numpad, media/system, and international keys.
- History of captured combos with one-click copy.
