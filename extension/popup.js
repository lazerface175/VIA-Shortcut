"use strict";

/* ---------- DOM ---------- */
const captureEl   = document.getElementById("capture");
const hintEl      = document.getElementById("hint");
const liveModsEl  = document.getElementById("liveMods");
const resultEl    = document.getElementById("result");
const comboLabel  = document.getElementById("comboLabel");
const codeOut     = document.getElementById("codeOut");
const aliasLine   = document.getElementById("aliasLine");
const copyBtn     = document.getElementById("copyBtn");
const sidedChk    = document.getElementById("sidedMods");
const fullNamesChk= document.getElementById("fullNames");
const historyWrap = document.getElementById("historyWrap");
const historyList = document.getElementById("historyList");
const manualModsEl= document.getElementById("manualMods");
const keySelect   = document.getElementById("keySelect");
const manualGo    = document.getElementById("manualGo");

/* ---------- state ---------- */
// Which modifier sides are physically held, tracked from real key events.
const held = {ctrlL:false,ctrlR:false,shiftL:false,shiftR:false,altL:false,altR:false,guiL:false,guiR:false};
const manual = {ctrl:false,shift:false,alt:false,gui:false};
let armed = false;
let current = null; // {kc, mods:{ctrl,shift,alt,gui}, sided:{ctrlL...}, human}
let history = [];

/* ---------- persistence ---------- */
// Popup unloads on every close — keep history + checkbox prefs in storage.
function saveState() {
  chrome.storage.local.set({
    history,
    prefs: {sided: sidedChk.checked, fullNames: fullNamesChk.checked},
  });
}

async function loadState() {
  const data = await chrome.storage.local.get(["history", "prefs"]);
  if (Array.isArray(data.history)) history = data.history;
  if (data.prefs) {
    sidedChk.checked = !!data.prefs.sided;
    fullNamesChk.checked = !!data.prefs.fullNames;
  }
  if (history.length) {
    historyWrap.hidden = false;
    renderHistory();
  }
}

/* ---------- helpers ---------- */
function activeMods() {
  return {
    ctrl:  held.ctrlL  || held.ctrlR,
    shift: held.shiftL || held.shiftR,
    alt:   held.altL   || held.altR,
    gui:   held.guiL   || held.guiR,
  };
}

function renderResult() {
  if (!current) return;
  const sided = sidedChk.checked;
  const full = fullNamesChk.checked;
  const sidedState = sided ? (current.sided || manualToSided()) : null;
  const chord = displayChord(current.kc, current.mods, sided, sidedState, full);
  codeOut.textContent = chord;
  comboLabel.textContent = current.human;
  const wrapOk = !(hasMods(current.mods) && EXTENDED.has(current.kc));
  copyBtn.disabled = !wrapOk;

  if (!sided && wrapOk) {
    const alias = aliasFor(current.mods, current.kc);
    if (alias) {
      aliasLine.hidden = false;
      aliasLine.innerHTML = "Shorthand alias (identical in VIA): <code>" + alias + "</code>";
    } else {
      aliasLine.hidden = true;
    }
  } else {
    aliasLine.hidden = true;
  }
  current.code = chord;
}

function manualToSided() {
  return {ctrlL:manual.ctrl,ctrlR:false,shiftL:manual.shift,shiftR:false,altL:manual.alt,altR:false,guiL:manual.gui,guiR:false};
}

function setResult(kc, mods, sidedState) {
  const parts = [];
  for (const m of ["ctrl","shift","alt","gui"]) if (mods[m]) parts.push(MOD_LABEL[m]);
  parts.push(kc.replace(/^KC_/, ""));
  current = {kc, mods:{...mods}, sided:{...sidedState}, human: parts.join(" + ")};
  renderResult();
  resultEl.hidden = false;
  pushHistory({human: current.human, kc: current.kc, mods: current.mods, sided: current.sided});
}

function pushHistory(entry) {
  history.unshift(entry);
  if (history.length > 15) history.pop();
  historyWrap.hidden = false;
  renderHistory();
  saveState();
}

function renderHistory() {
  historyList.innerHTML = "";
  for (const h of history) {
    const code = displayChord(h.kc, h.mods, sidedChk.checked, h.sided, fullNamesChk.checked);
    const li = document.createElement("li");
    const combo = document.createElement("span");
    combo.className = "h-combo";
    combo.textContent = h.human;
    const codeEl = document.createElement("span");
    codeEl.className = "h-code";
    codeEl.textContent = code;
    const btn = document.createElement("button");
    btn.className = "ghost";
    btn.textContent = "Copy";
    btn.addEventListener("click", () => navigator.clipboard.writeText(code));
    li.append(combo, codeEl, btn);
    historyList.appendChild(li);
  }
}

function renderLiveMods() {
  const m = activeMods();
  liveModsEl.innerHTML = "";
  for (const k of ["ctrl","shift","alt","gui"]) {
    const el = document.createElement("span");
    el.className = "mod-pill" + (m[k] ? " on" : "");
    el.textContent = MOD_LABEL[k];
    liveModsEl.appendChild(el);
  }
}

/* ---------- capture ---------- */
captureEl.addEventListener("focus", () => {
  armed = true;
  captureEl.classList.add("armed");
  hintEl.innerHTML = "<b>Listening&hellip;</b> press your combination";
});
captureEl.addEventListener("blur", () => {
  armed = false;
  captureEl.classList.remove("armed");
  hintEl.innerHTML = "<b>Click here</b>, then press your key combination";
  for (const k in held) held[k] = false;
  renderLiveMods();
});

window.addEventListener("keydown", e => {
  if (!armed) return;
  e.preventDefault();
  e.stopPropagation();

  const modKey = MOD_CODES[e.code];
  if (modKey) {
    held[modKey] = true;
    renderLiveMods();
    return;
  }

  if (e.repeat) return;

  const kc = CODE_MAP[e.code];
  if (!kc) {
    current = null;
    resultEl.hidden = false;
    comboLabel.textContent = "Unmapped key: " + (e.code || e.key);
    codeOut.textContent = "—";
    aliasLine.hidden = true;
    return;
  }
  // Merge DOM modifier flags with tracked sides (covers keys held before focus).
  const mods = {
    ctrl:  e.ctrlKey  || held.ctrlL  || held.ctrlR,
    shift: e.shiftKey || held.shiftL || held.shiftR,
    alt:   e.altKey   || held.altL   || held.altR,
    gui:   e.metaKey  || held.guiL   || held.guiR,
  };
  setResult(kc, mods, held);
  // Keep `held` — modifiers may still be physically down; keyup/blur clears it.
  renderLiveMods();
}, true);

window.addEventListener("keyup", e => {
  const modKey = MOD_CODES[e.code];
  if (modKey) { held[modKey] = false; renderLiveMods(); }
}, true);

/* ---------- checkboxes ---------- */
sidedChk.addEventListener("change", () => { renderResult(); renderHistory(); saveState(); });
fullNamesChk.addEventListener("change", () => { renderResult(); renderHistory(); saveState(); });

/* ---------- copy ---------- */
copyBtn.addEventListener("click", () => {
  if (!current || copyBtn.disabled) return;
  navigator.clipboard.writeText(codeOut.textContent);
  copyBtn.textContent = "Copied!";
  setTimeout(() => copyBtn.textContent = "Copy", 1200);
});

/* ---------- manual mode ---------- */
for (const m of ["ctrl","shift","alt","gui"]) {
  const el = document.createElement("span");
  el.className = "mod-pill";
  el.textContent = MOD_LABEL[m];
  el.addEventListener("click", () => { manual[m] = !manual[m]; el.classList.toggle("on", manual[m]); });
  manualModsEl.appendChild(el);
}

for (const [g, keys] of Object.entries(GROUPS)) {
  const og = document.createElement("optgroup");
  og.label = g;
  for (const k of keys) {
    const o = document.createElement("option");
    o.value = k; o.textContent = k;
    og.appendChild(o);
  }
  keySelect.appendChild(og);
}

manualGo.addEventListener("click", () => {
  setResult(keySelect.value, manual, manualToSided());
});

/* ---------- init ---------- */
renderLiveMods();
loadState();
captureEl.focus();
