const fs = require("fs");
const path = require("path");
const { flatten } = require("./localeUtils");

const root = path.join(__dirname, "..", "..");
const en = JSON.parse(fs.readFileSync(path.join(__dirname, "en.json"), "utf8"));
const enFlat = flatten(en);

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts|jsx|js)$/.test(name)) acc.push(p);
  }
  return acc;
}

const files = [
  ...walk(path.join(root, "screens")),
  ...walk(path.join(root, "components")),
];
const keyRe = /\bt\(\s*["'`]([^"'`]+)["'`]/g;
const used = new Set();

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  let m;
  while ((m = keyRe.exec(src))) used.add(m[1]);
}

const missing = [...used].filter((k) => !(k in enFlat)).sort();
const staticKeys = missing.filter(
  (k) => !k.includes("${") && !k.startsWith("${"),
);

fs.writeFileSync(
  path.join(__dirname, "_missing_screen_keys.json"),
  JSON.stringify({ total: missing.length, static: staticKeys.length, keys: missing, staticKeys }, null, 2),
);
console.log("Total missing:", missing.length);
console.log("Static missing:", staticKeys.length);
console.log(staticKeys.join("\n"));
