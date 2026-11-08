/*
 * Minecraft Discord Manager
 * Original project author: Philip (Fips2010)
 * Discord user ID: 1312508991162683436
 * Please retain this attribution when redistributing or adapting this project.
 */

const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function read(file, fallback) {
  const full = path.join(dataDir, file);
  try { return JSON.parse(fs.readFileSync(full, "utf8")); }
  catch { return fallback; }
}
function write(file, value) {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(value, null, 2), "utf8");
}
module.exports = { read, write };