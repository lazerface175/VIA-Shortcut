"use strict";

/* Shared QMK keycode logic — used by index.html (file://) and the extension popup. */

/* ---------- e.code -> QMK keycode ---------- */
const CODE_MAP = {
  // Letters & digits
  ...Object.fromEntries("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(c => ["Key"+c, "KC_"+c])),
  Digit1:"KC_1",Digit2:"KC_2",Digit3:"KC_3",Digit4:"KC_4",Digit5:"KC_5",
  Digit6:"KC_6",Digit7:"KC_7",Digit8:"KC_8",Digit9:"KC_9",Digit0:"KC_0",
  // Function keys
  ...Object.fromEntries(Array.from({length:24},(_,i)=>["F"+(i+1),"KC_F"+(i+1)])),
  // Editing / navigation
  Enter:"KC_ENT", Escape:"KC_ESC", Backspace:"KC_BSPC", Tab:"KC_TAB", Space:"KC_SPC",
  Delete:"KC_DEL", Insert:"KC_INS", Home:"KC_HOME", End:"KC_END",
  PageUp:"KC_PGUP", PageDown:"KC_PGDN",
  ArrowUp:"KC_UP", ArrowDown:"KC_DOWN", ArrowLeft:"KC_LEFT", ArrowRight:"KC_RIGHT",
  CapsLock:"KC_CAPS", PrintScreen:"KC_PSCR", ScrollLock:"KC_SCRL", Pause:"KC_PAUS",
  // Punctuation (US positions)
  Minus:"KC_MINS", Equal:"KC_EQL", BracketLeft:"KC_LBRC", BracketRight:"KC_RBRC",
  Backslash:"KC_BSLS", Semicolon:"KC_SCLN", Quote:"KC_QUOT", Backquote:"KC_GRV",
  Comma:"KC_COMM", Period:"KC_DOT", Slash:"KC_SLSH",
  // Numpad
  NumLock:"KC_NUM",
  Numpad0:"KC_KP_0",Numpad1:"KC_KP_1",Numpad2:"KC_KP_2",Numpad3:"KC_KP_3",Numpad4:"KC_KP_4",
  Numpad5:"KC_KP_5",Numpad6:"KC_KP_6",Numpad7:"KC_KP_7",Numpad8:"KC_KP_8",Numpad9:"KC_KP_9",
  NumpadAdd:"KC_KP_PLUS", NumpadSubtract:"KC_KP_MINUS", NumpadMultiply:"KC_KP_ASTERISK",
  NumpadDivide:"KC_KP_SLASH", NumpadDecimal:"KC_KP_DOT", NumpadEnter:"KC_KP_ENTER",
  NumpadComma:"KC_KP_COMMA", NumpadEqual:"KC_KP_EQUAL",
  // Media / system (codes Chrome reports on most platforms)
  AudioVolumeUp:"KC_VOLU", VolumeUp:"KC_VOLU",
  AudioVolumeDown:"KC_VOLD", VolumeDown:"KC_VOLD",
  AudioVolumeMute:"KC_MUTE", VolumeMute:"KC_MUTE",
  MediaPlayPause:"KC_MPLY", MediaStop:"KC_MSTP",
  MediaTrackNext:"KC_MNXT", MediaTrackPrevious:"KC_MPRV",
  BrowserBack:"KC_WBAK", BrowserForward:"KC_WFWD", BrowserRefresh:"KC_WREF",
  BrowserHome:"KC_WHOM", BrowserSearch:"KC_WSCH", BrowserFavorites:"KC_WFAV",
  LaunchMail:"KC_MAIL", LaunchApp1:"KC_MSEL", LaunchApp2:"KC_CALC",
  Power:"KC_PWR", Sleep:"KC_SLEP", WakeUp:"KC_WAKE",
  // International / extra
  IntlBackslash:"KC_NUBS", IntlRo:"KC_INT1", IntlYen:"KC_INT3",
  Convert:"KC_INT4", NonConvert:"KC_INT5", KanaMode:"KC_KANA",
  Lang1:"KC_HAEN", Lang2:"KC_HANJ", Lang3:"KC_HENK", Lang4:"KC_MHEN",
};

const MOD_CODES = {
  ControlLeft:"ctrlL", ControlRight:"ctrlR",
  ShiftLeft:"shiftL", ShiftRight:"shiftR",
  AltLeft:"altL", AltRight:"altR",
  MetaLeft:"guiL", MetaRight:"guiR",
  OSLeft:"guiL", OSRight:"guiR",
};
const MOD_LABEL = {ctrl:"Ctrl", shift:"Shift", alt:"Alt", gui:"GUI"};

/* Compound QMK aliases for common combos (order-insensitive). */
const ALIASES = [
  {mods:["ctrl","alt"],          name:"LCA"},
  {mods:["shift","alt"],         name:"LSA"},
  {mods:["ctrl","shift"],        name:"LCS"},
  {mods:["ctrl","gui"],          name:"LCG"},
  {mods:["alt","gui"],           name:"LAG"},
  {mods:["shift","gui"],         name:"SGUI"},  // SCMD on macOS
  {mods:["ctrl","alt","gui"],    name:"LCAG"},
  {mods:["ctrl","shift","alt"],  name:"MEH"},
  {mods:["ctrl","shift","alt","gui"], name:"HYPR"},
];

/* Extended (consumer/system) keycodes can't be wrapped in QMK modifier
   chords — VIA's Any field only encodes basic keycodes inside wrappers. */
const EXTENDED = new Set([
  "KC_MUTE","KC_VOLU","KC_VOLD","KC_MPLY","KC_MSTP","KC_MNXT","KC_MPRV","KC_EJCT",
  "KC_PWR","KC_SLEP","KC_WAKE","KC_MAIL","KC_MSEL","KC_CALC",
  "KC_WHOM","KC_WBAK","KC_WFWD","KC_WREF","KC_WSCH","KC_WFAV",
]);

function modWrapName(mod, sided, fullNames, side) {
  // mod: 'ctrl'|'shift'|'alt'|'gui'; side: 'L'|'R'|null
  const short = {ctrl:"C", shift:"S", alt:"A", gui:"G"}[mod];
  const full  = {ctrl:"CTL", shift:"SFT", alt:"ALT", gui:"GUI"}[mod];
  if (sided && side) return side + full;          // LCTL, RSFT, ...
  return fullNames ? "L"+full : short;            // LCTL vs C
}

// Build the nested QMK chord string.
// Order: outermost -> innermost: Ctrl, Shift, Alt, GUI (matches C(S(A(G(kc))) = HYPR).
function buildChord(kc, mods, sided, sidedState, fullNames) {
  const order = ["ctrl","shift","alt","gui"];
  let out = kc;
  for (let i = order.length - 1; i >= 0; i--) {
    const m = order[i];
    if (!mods[m]) continue;
    let side = null;
    if (sided && sidedState) {
      if (sidedState[m+"L"] && sidedState[m+"R"]) side = "L"; // both held: fall back to left
      else if (sidedState[m+"R"]) side = "R";
      else side = "L";
    }
    out = modWrapName(m, sided, fullNames, side) + "(" + out + ")";
  }
  return out;
}

function hasMods(mods) {
  return mods.ctrl || mods.shift || mods.alt || mods.gui;
}

// Chord for display/copy, or a warning when the combo can't be encoded.
function displayChord(kc, mods, sided, sidedState, fullNames) {
  if (hasMods(mods) && EXTENDED.has(kc)) {
    return "N/A — " + kc + " can't be combined with modifiers (VIA's Any field only wraps basic keycodes)";
  }
  return buildChord(kc, mods, sided, sidedState, fullNames);
}

// Shorthand alias for a mod set, e.g. MEH(KC_Q), or null when none exists.
function aliasFor(mods, kc) {
  const set = order => order.every(m => mods[m]) && Object.keys(MOD_LABEL).filter(k=>mods[k]).length === order.length;
  const a = ALIASES.find(a => set(a.mods));
  return a ? a.name + "(" + kc + ")" : null;
}

const GROUPS = {
  "Letters": "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(c=>"KC_"+c),
  "Number row": "1234567890".split("").map(c=>"KC_"+c),
  "Function keys": Array.from({length:24},(_,i)=>"KC_F"+(i+1)),
  "Editing / Nav": ["KC_BSPC","KC_DEL","KC_ENT","KC_TAB","KC_SPC","KC_ESC","KC_INS","KC_HOME","KC_END","KC_PGUP","KC_PGDN","KC_LEFT","KC_RIGHT","KC_UP","KC_DOWN","KC_CAPS","KC_PSCR","KC_SCRL","KC_PAUS"],
  "Punctuation": ["KC_GRV","KC_MINS","KC_EQL","KC_LBRC","KC_RBRC","KC_BSLS","KC_SCLN","KC_QUOT","KC_COMM","KC_DOT","KC_SLSH"],
  "Numpad": ["KC_NUM","KC_KP_0","KC_KP_1","KC_KP_2","KC_KP_3","KC_KP_4","KC_KP_5","KC_KP_6","KC_KP_7","KC_KP_8","KC_KP_9","KC_KP_ENTER","KC_KP_PLUS","KC_KP_MINUS","KC_KP_ASTERISK","KC_KP_SLASH","KC_KP_DOT","KC_KP_COMMA","KC_KP_EQUAL"],
  "Media / System": ["KC_MUTE","KC_VOLU","KC_VOLD","KC_MPLY","KC_MSTP","KC_MNXT","KC_MPRV","KC_EJCT","KC_PWR","KC_SLEP","KC_WAKE","KC_CALC","KC_MAIL","KC_MSEL","KC_WHOM","KC_WBAK","KC_WFWD","KC_WREF","KC_WSCH","KC_WFAV"],
  "International": ["KC_NUBS","KC_NUHS","KC_INT1","KC_INT2","KC_INT3","KC_INT4","KC_INT5","KC_KANA","KC_HAEN","KC_HANJ","KC_HENK","KC_MHEN","KC_LANG1","KC_LANG2"],
};
