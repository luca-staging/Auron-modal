#!/usr/bin/env node
/**
 * Deploy contracts to local Anvil and write addresses for the frontend.
 * Prerequisites: `npm run chain` and Foundry (`forge`) on PATH.
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { prependPath } = require("./foundry.cjs");

prependPath();

const ROOT = path.resolve(__dirname, "..");
const CONTRACTS = __dirname;
const DEPLOYER_KEY =
  process.env.DEPLOYER_PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const RPC = process.env.RPC_URL || "http://127.0.0.1:8545";

function run(cmd, cwd, env) {
  console.log("> " + cmd);
  execSync(cmd, {
    stdio: "inherit",
    cwd: cwd || ROOT,
    env: { ...process.env, ...env },
  });
}

function runCapture(cmd) {
  return execSync(cmd, { encoding: "utf8", cwd: ROOT });
}

function ensureForge() {
  try {
    runCapture("forge --version");
  } catch {
    console.error("Forge not found. Install Foundry: https://book.getfoundry.sh/getting-started/installation");
    process.exit(1);
  }
}

async function ensureRpc() {
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_blockNumber",
        params: [],
      }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.result) throw new Error("bad rpc response");
  } catch (error) {
    console.error("Anvil not reachable at " + RPC + ". Start it with: npm run chain");
    console.error(String(error.message || error));
    process.exit(1);
  }
}

function ensureLibs() {
  const stdReady = fs.existsSync(path.join(CONTRACTS, "lib", "forge-std", "src"));
  const ozReady = fs.existsSync(path.join(CONTRACTS, "lib", "openzeppelin-contracts", "contracts"));
  if (stdReady && ozReady) return;
  run("git submodule update --init --recursive", ROOT);
}

function readBroadcastAddresses() {
  const broadcast = path.join(CONTRACTS, "broadcast", "Deploy.s.sol", "31337", "run-latest.json");
  if (!fs.existsSync(broadcast)) throw new Error("Missing broadcast file: " + broadcast);
  const data = JSON.parse(fs.readFileSync(broadcast, "utf8"));
  const creates = (data.transactions || []).filter(function keep(tx) {
    return tx.transactionType === "CREATE";
  });
  if (creates.length < 5) throw new Error("Expected 5 CREATE txs, found " + creates.length);
  return {
    hnvwa: creates[0].contractAddress,
    hnvUsd: creates[1].contractAddress,
    oracle: creates[2].contractAddress,
    lendingPool: creates[3].contractAddress,
    governance: creates[4].contractAddress,
  };
}

function writeEnv(addrs) {
  const lines = [
    "VITE_CHAIN_ID=31337",
    "VITE_RPC_URL=" + RPC,
    "VITE_HNVWA_ADDRESS=" + addrs.hnvwa,
    "VITE_STABLECOIN_ADDRESS=" + addrs.hnvUsd,
    "VITE_LENDING_POOL_ADDRESS=" + addrs.lendingPool,
    "VITE_ORACLE_ADDRESS=" + addrs.oracle,
    "VITE_GOVERNANCE_ADDRESS=" + addrs.governance,
    "VITE_API_URL=http://localhost:8080",
  ];
  const webEnv = path.join(ROOT, "frontend", ".env.local");
  fs.writeFileSync(webEnv, lines.join("\n") + "\n");
  console.log("Wrote " + webEnv);

  const jsonPath = path.join(ROOT, "frontend", "src", "lib", "deployment.json");
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        chainId: 31337,
        rpcUrl: RPC,
        hnvwa: addrs.hnvwa,
        hnvUsd: addrs.hnvUsd,
        oracle: addrs.oracle,
        lendingPool: addrs.lendingPool,
        governance: addrs.governance,
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Wrote " + jsonPath);
}

async function main() {
  ensureForge();
  await ensureRpc();
  ensureLibs();
  run("forge script script/Deploy.s.sol:Deploy --rpc-url " + RPC + " --broadcast", CONTRACTS, {
    DEPLOYER_PRIVATE_KEY: DEPLOYER_KEY,
  });
  writeEnv(readBroadcastAddresses());
  console.log("\nDeploy complete. Restart `npm run dev` if it is already running.");
}

main().catch(function fail(error) {
  console.error(error);
  process.exit(1);
});
