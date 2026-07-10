/** Flatten nested locale JSON; array indices become dotted numeric keys. */
function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item != null && typeof item === "object") {
          Object.assign(out, flatten(item, `${key}.${i}`));
        } else {
          out[`${key}.${i}`] = item;
        }
      });
    } else if (v && typeof v === "object") {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

module.exports = { flatten };
