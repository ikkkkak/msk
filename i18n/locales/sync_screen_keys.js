/**
 * Add screen t() keys missing from locale files.
 * Extracts defaultValue from t('key', { defaultValue: '...' }) when present.
 * Run: node sync_screen_keys.js
 */
const fs = require("fs");
const path = require("path");
const { flatten } = require("./localeUtils");

const dir = __dirname;
const root = path.join(dir, "..", "..");
const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
const fr = JSON.parse(fs.readFileSync(path.join(dir, "fr.json"), "utf8"));
const ar = JSON.parse(fs.readFileSync(path.join(dir, "ar.json"), "utf8"));

function getAt(obj, dotted) {
  const parts = dotted.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setPath(obj, dotted, value) {
  const parts = dotted.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] != null && typeof cur[p] !== "object") return false;
    if (!cur[p]) cur[p] = {};
    cur = cur[p];
  }
  const last = parts[parts.length - 1];
  if (cur[last] != null && typeof cur[last] === "object") return false;
  cur[last] = value;
  return true;
}

function walk(d, acc = []) {
  for (const name of fs.readdirSync(d)) {
    const p = path.join(d, name);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts)$/.test(name)) acc.push(p);
  }
  return acc;
}

const keyRe =
  /\bt\(\s*["'`]([^"'`${}]+)["'`](?:\s*,\s*(?:["'`]((?:\\.|[^"'`\\])*)["'`]|(\{[^}]*(?:\{[^}]*\}[^}]*)*\}))(?:\s*,\s*\{[^}]*\})*)?\s*\)/gs;
const trRe =
  /\btr\(\s*["'`]([^"'`${}]+)["'`](?:\s*,\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`((?:\\.|[^`\\])*)`))?/gs;
const defaultRe = /defaultValue:\s*["'`]((?:\\.|[^"'`\\])*)["'`]/;

function collectKeys(src, used) {
  let m;
  while ((m = keyRe.exec(src))) {
    const key = m[1];
    if (key.includes("${")) continue;
    let def = null;
    if (m[2]) def = m[2];
    else if (m[3]) {
      const dm = defaultRe.exec(m[3]);
      if (dm) def = dm[1];
    }
    if (def) def = def.replace(/\\(.)/g, "$1");
    if (!used.has(key) || (def && !used.get(key))) used.set(key, def);
  }
  while ((m = trRe.exec(src))) {
    const key = m[1];
    if (key.includes("${")) continue;
    const raw = m[2] ?? m[3] ?? m[4] ?? null;
    let def = raw ? raw.replace(/\\(.)/g, "$1") : null;
    if (!used.has(key) || (def && !used.get(key))) used.set(key, def);
  }
}

const used = new Map(); // key -> defaultValue | null

for (const file of [
  ...walk(path.join(root, "screens")),
  ...walk(path.join(root, "components")),
  ...walk(path.join(root, "navigation")),
]) {
  const src = fs.readFileSync(file, "utf8");
  collectKeys(src, used);
}

const enFlat = flatten(en);
const SKIP_KEYS = new Set([
  // Namespace root; use auth.signUp.label for the button string
  "auth.signUp",
]);
const missing = [...used.keys()]
  .filter((k) => !(k in enFlat) && !SKIP_KEYS.has(k))
  .sort();

console.log("Screen/component t()/tr() keys:", used.size);
console.log("Missing from en.json:", missing.length);

// Resolve EN text: defaultValue from code, or lookup aliases
const ALIAS_FROM = {
  "auth.firstName": "auth.signUp.firstName",
  "auth.lastName": "auth.signUp.lastName",
  "auth.signInWithEmail": "auth.signIn.signInWithEmail",
  "auth.signUpWithPhone": "auth.signUp.signUpWithPhone",
  "auth.alreadyHaveAccount": "auth.signUp.alreadyHaveAccount",
  "auth.validation.emailRequired": "auth.signUp.validation.emailRequired",
  "auth.validation.firstNameRequired": "auth.signUp.validation.firstNameRequired",
  "auth.validation.lastNameRequired": "auth.signUp.validation.lastNameRequired",
  "auth.validation.passwordRequired": "auth.signUp.validation.passwordRequired",
  "auth.validation.passwordComplexity": "auth.signUp.validation.passwordMinLength",
  "auth.validation.emailInvalid": "auth.signUp.validation.emailInvalid",
  "filters.selectCityFirst": "search.filterModal.selectCityFirst",
  "filters.selectZoneFirst": "listing.landmark.steps.quartier.selectZoneFirst",
  "filters.zones": "filters.zone",
};

function resolveEn(key) {
  if (used.get(key)) return used.get(key);
  const aliasPath = ALIAS_FROM[key];
  if (aliasPath) {
    const v = getAt(en, aliasPath);
    if (typeof v === "string") return v;
    if (enFlat[aliasPath]) return enFlat[aliasPath];
  }
  const suffix = key.split(".").pop();
  const candidates = Object.entries(enFlat).filter(
    ([k, v]) => k.endsWith("." + suffix) && typeof v === "string",
  );
  if (candidates.length === 1) return candidates[0][1];
  return null;
}

let added = 0;
let refreshed = 0;
const unresolved = [];

for (const key of missing) {
  const text = resolveEn(key);
  if (!text) {
    unresolved.push(key);
    continue;
  }
  if (setPath(en, key, text)) added++;
}

// Refresh EN from code defaults when tr()/t() fallback is longer (fixes truncated apostrophe keys)
for (const [key, def] of used.entries()) {
  if (!def || SKIP_KEYS.has(key)) continue;
  const cur = enFlat[key];
  if (typeof cur === "string" && cur.length >= def.length) continue;
  if (setPath(en, key, def)) refreshed++;
}

// Re-load en flat after additions
const enFlat2 = flatten(en);

// FR/AR: copy from existing nested keys if available, else use EN (flag for manual)
for (const key of missing) {
  const text = enFlat2[key];
  if (!text) continue;
  const frFlat = flatten(fr);
  const arFlat = flatten(ar);
  if (!(key in frFlat)) {
    const aliasPath = ALIAS_FROM[key];
    const frVal = aliasPath ? getAt(fr, aliasPath) : undefined;
    setPath(fr, key, typeof frVal === "string" ? frVal : text);
  }
  if (!(key in flatten(ar))) {
    const aliasPath = ALIAS_FROM[key];
    const arVal = aliasPath ? getAt(ar, aliasPath) : undefined;
    setPath(ar, key, typeof arVal === "string" ? arVal : text);
  }
}

fs.writeFileSync(path.join(dir, "en.json"), JSON.stringify(en, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "fr.json"), JSON.stringify(fr, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "ar.json"), JSON.stringify(ar, null, 2) + "\n");

console.log("Added to EN:", added);
console.log("Refreshed EN from code defaults:", refreshed);
console.log("Unresolved (no defaultValue):", unresolved.length);
const unresolvedPath = path.join(dir, "_unresolved_screen_keys.json");
if (unresolved.length) {
  fs.writeFileSync(unresolvedPath, JSON.stringify(unresolved, null, 2));
  console.log("Sample:", unresolved.slice(0, 15).join(", "));
} else if (fs.existsSync(unresolvedPath)) {
  fs.unlinkSync(unresolvedPath);
}
