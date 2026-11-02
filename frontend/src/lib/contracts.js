import deployment from "./deployment.json";

const ZERO = "0x0000000000000000000000000000000000000000";

function addr(value, fallback) {
  return value || fallback || ZERO;
}

export const contracts = {
  chainId: Number(import.meta.env.VITE_CHAIN_ID || deployment.chainId || 31337),
  rpcUrl: import.meta.env.VITE_RPC_URL || deployment.rpcUrl || "http://127.0.0.1:8545",
  hnvwa: addr(import.meta.env.VITE_HNVWA_ADDRESS, deployment.hnvwa),
  hnvUsd: addr(import.meta.env.VITE_STABLECOIN_ADDRESS, deployment.hnvUsd),
  lendingPool: addr(import.meta.env.VITE_LENDING_POOL_ADDRESS, deployment.lendingPool),
  oracle: addr(import.meta.env.VITE_ORACLE_ADDRESS, deployment.oracle),
  governance: addr(import.meta.env.VITE_GOVERNANCE_ADDRESS, deployment.governance),
};

export function isDeployed() {
  return contracts.lendingPool !== ZERO && contracts.hnvwa !== ZERO;
}

export function toWei(amount) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n) || n < 0) return 0n;
  return BigInt(Math.round(n * 1e6)) * 10n ** 12n;
}

export function fromWei(value) {
  return Number(value) / 1e18;
}

export function hfFromWad(value) {
  if (value >= 2n ** 128n) return Number.POSITIVE_INFINITY;
  return Number(value) / 1e18;
}
