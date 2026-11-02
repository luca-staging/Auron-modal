const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function binDir() {
  return path.join(os.homedir(), ".foundry", "bin");
}

function prependPath() {
  const dir = binDir();
  const exe = process.platform === "win32" ? "forge.exe" : "forge";
  if (!fs.existsSync(path.join(dir, exe))) return false;
  const parts = (process.env.PATH || "").split(path.delimiter);
  const present = parts.some(function same(entry) {
    return entry.toLowerCase() === dir.toLowerCase();
  });
  if (!present) process.env.PATH = dir + path.delimiter + process.env.PATH;
  return true;
}

function executable(tool) {
  const exe = process.platform === "win32" ? tool + ".exe" : tool;
  const local = path.join(binDir(), exe);
  return fs.existsSync(local) ? local : tool;
}

if (require.main === module) {
  const tool = process.argv[2];
  const args = process.argv.slice(3);
  if (!tool) {
    console.error("Usage: node contracts/foundry.cjs <forge|anvil> [args]");
    process.exit(1);
  }
  const child = spawn(executable(tool), args, { stdio: "inherit" });
  child.on("exit", function done(code) {
    process.exit(code == null ? 1 : code);
  });
}

module.exports = { prependPath, executable };
