/**
 * Strip spurious wrapping quotes from locale string values
 * (e.g. "\"Hello\"" → "Hello") after a bad sync pass.
 */
const fs = require("fs");
const path = require("path");

const dir = __dirname;

function sanitizeTree(node) {
  if (Array.isArray(node)) {
    return node.map(sanitizeTree);
  }
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = sanitizeTree(v);
    }
    return out;
  }
  if (typeof node === "string" && node.length >= 2) {
    if (
      (node.startsWith('"') && node.endsWith('"')) ||
      (node.startsWith("'") && node.endsWith("'"))
    ) {
      return node.slice(1, -1);
    }
  }
  return node;
}

for (const lang of ["en", "fr", "ar"]) {
  const file = path.join(dir, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, JSON.stringify(sanitizeTree(data), null, 2) + "\n");
  console.log(`Sanitized ${lang}.json`);
}
