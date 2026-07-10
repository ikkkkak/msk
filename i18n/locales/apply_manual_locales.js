/**
 * Apply hand-written broker screen translations (no code scanning).
 * Run: node apply_manual_locales.js
 */
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const manualDir = path.join(dir, "manual");

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== "object") target[k] = {};
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

function loadJson(name) {
  const p = path.join(manualDir, name);
  if (!fs.existsSync(p)) {
    console.warn("Skip missing:", name);
    return {};
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
let fr = JSON.parse(fs.readFileSync(path.join(dir, "fr.json"), "utf8"));
let ar = JSON.parse(fs.readFileSync(path.join(dir, "ar.json"), "utf8"));

const enAdditions = loadJson("en_additions.json");
const listingFr = loadJson("listing_fr.json");
const listingAr = loadJson("listing_ar.json");
const listingAiFr = loadJson("listingAi_fr.json");
const listingAiAr = loadJson("listingAi_ar.json");
const organizationFr = loadJson("organization_fr.json");
const organizationAr = loadJson("organization_ar.json");
const brokerFr = loadJson("broker_fr.json");
const brokerAr = loadJson("broker_ar.json");

deepMerge(en, enAdditions);
deepMerge(fr, listingFr);
deepMerge(fr, listingAiFr);
deepMerge(fr, organizationFr);
deepMerge(fr, brokerFr);
deepMerge(ar, listingAr);
deepMerge(ar, listingAiAr);
deepMerge(ar, organizationAr);
deepMerge(ar, brokerAr);

fs.writeFileSync(path.join(dir, "en.json"), JSON.stringify(en, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "fr.json"), JSON.stringify(fr, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "ar.json"), JSON.stringify(ar, null, 2) + "\n");

console.log("Manual broker locales applied.");
