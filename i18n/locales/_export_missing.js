const fs = require("fs");
const path = require("path");

const dir = __dirname;
const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
const missingFr = JSON.parse(fs.readFileSync(path.join(dir, "_missing_fr.json"), "utf8"));
const missingAr = JSON.parse(fs.readFileSync(path.join(dir, "_missing_ar.json"), "utf8"));

function get(obj, dotted) {
  return dotted.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function exportMissing(missing) {
  const out = {};
  for (const key of missing) {
    out[key] = get(en, key);
  }
  return out;
}

fs.writeFileSync(
  path.join(dir, "_missing_fr_en_values.json"),
  JSON.stringify(exportMissing(missingFr), null, 2),
);
fs.writeFileSync(
  path.join(dir, "_missing_ar_en_values.json"),
  JSON.stringify(exportMissing(missingAr), null, 2),
);

console.log("Exported", missingFr.length, "FR and", missingAr.length, "AR missing EN values");
