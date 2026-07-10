const fs = require("fs");
const path = require("path");
const { flatten } = require("./localeUtils");

const dir = __dirname;
const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
const fr = JSON.parse(fs.readFileSync(path.join(dir, "fr.json"), "utf8"));
const ar = JSON.parse(fs.readFileSync(path.join(dir, "ar.json"), "utf8"));

function groupByTop(keys) {
  const g = {};
  for (const k of keys) {
    const top = k.split(".")[0];
    if (!g[top]) g[top] = [];
    g[top].push(k);
  }
  return Object.fromEntries(
    Object.entries(g).sort((a, b) => b[1].length - a[1].length),
  );
}

const fe = flatten(en);
const ff = flatten(fr);
const fa = flatten(ar);
const enKeys = Object.keys(fe).sort();
const frKeys = new Set(Object.keys(ff));
const arKeys = new Set(Object.keys(fa));

const missingFr = enKeys.filter((k) => !frKeys.has(k));
const missingAr = enKeys.filter((k) => !arKeys.has(k));

console.log("EN keys:", enKeys.length);
console.log("FR missing vs EN:", missingFr.length);
console.log("AR missing vs EN:", missingAr.length);

const frByNs = groupByTop(missingFr);
const arByNs = groupByTop(missingAr);

console.log("\n--- FR missing by namespace (top 25) ---");
Object.entries(frByNs)
  .slice(0, 25)
  .forEach(([ns, keys]) => console.log(`${ns}: ${keys.length}`));

console.log("\n--- AR missing by namespace (top 25) ---");
Object.entries(arByNs)
  .slice(0, 25)
  .forEach(([ns, keys]) => console.log(`${ns}: ${keys.length}`));

fs.writeFileSync(path.join(dir, "_missing_fr.json"), JSON.stringify(missingFr, null, 2));
fs.writeFileSync(path.join(dir, "_missing_ar.json"), JSON.stringify(missingAr, null, 2));
fs.writeFileSync(
  path.join(dir, "_missing_fr_by_ns.json"),
  JSON.stringify(frByNs, null, 2),
);
fs.writeFileSync(
  path.join(dir, "_missing_ar_by_ns.json"),
  JSON.stringify(arByNs, null, 2),
);

// Keys in EN that are empty strings
const emptyEn = enKeys.filter((k) => fe[k] === "");
console.log("\nEmpty EN values:", emptyEn.length);
