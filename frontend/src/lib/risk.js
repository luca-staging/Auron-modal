export const DEFAULT_LTV_BPS = 7000;
export const LIQUIDATION_THRESHOLD_BPS = 8000;
export const NAV_USD = 1;

export const MARKETS = [
  {
    id: "us-treasury",
    name: "US Treasury",
    token: "HNVWA",
    role: "Collateral",
    apy: 4.2,
    risk: "Low",
    liquidity: "hnvUSD on this chain",
    ltvBps: 7000,
    liquidationThresholdBps: 8000,
    borrowEnabled: true,
    valuation: "Mock NAV $1.00",
    description:
      "Tokenized US Treasury exposure used as collateral. One token is $1.00 NAV. Posting it opens an hnvUSD line, the stablecoin liquidity this asset unlocks.",
  },
  {
    id: "private-credit",
    name: "Private Credit",
    token: "HNVPC",
    role: "Collateral",
    apy: 8.1,
    risk: "Medium",
    liquidity: "Catalogue only",
    ltvBps: 6000,
    liquidationThresholdBps: 7500,
    borrowEnabled: false,
    valuation: "Catalogue only",
    description:
      "A higher-yield real-world book, listed so its credit limit can be compared. It does not settle on the local pool yet.",
  },
  {
    id: "tokenized-fund",
    name: "Tokenized Fund",
    token: "HNVTF",
    role: "Collateral",
    apy: 6.7,
    risk: "Medium",
    liquidity: "Catalogue only",
    ltvBps: 6500,
    liquidationThresholdBps: 7750,
    borrowEnabled: false,
    valuation: "Catalogue only",
    description:
      "Fund exposure priced as collateral, listed for the same credit comparison. It does not settle on the local pool yet.",
  },
];

export function healthFactor(collateralUsd, debtUsd, liquidationThresholdBps = LIQUIDATION_THRESHOLD_BPS) {
  if (debtUsd <= 0) return Number.POSITIVE_INFINITY;
  return (collateralUsd * (liquidationThresholdBps / 10000)) / debtUsd;
}

export function maxBorrowUsd(collateralUsd, ltvBps = DEFAULT_LTV_BPS) {
  return collateralUsd * (ltvBps / 10000);
}

export function formatUsd(value) {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  });
}

export function formatHf(hf) {
  if (!Number.isFinite(hf)) return "∞";
  return hf.toFixed(2);
}

export function parseHf(label, fallback = Number.NaN) {
  if (label == null || label === "") return fallback;
  if (label === "∞") return Number.POSITIVE_INFINITY;
  const parsed = Number(label);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function bpsToPct(bps) {
  return bps / 100;
}

export function creditPerUsd(ltvBps) {
  return (ltvBps / 10000).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatBps(bps) {
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

export function currentLtvPct(collateralUsd, debtUsd) {
  if (collateralUsd <= 0) return 0;
  return (debtUsd / collateralUsd) * 100;
}

export function liquidationBufferUsd(
  collateralUsd,
  debtUsd,
  liquidationThresholdBps = LIQUIDATION_THRESHOLD_BPS,
) {
  if (collateralUsd <= 0) return 0;
  const maxDebt = collateralUsd * (liquidationThresholdBps / 10000);
  return Math.max(0, maxDebt - debtUsd);
}

export function hfAfterNavShock(collateralUsd, debtUsd, navDropPct, liquidationThresholdBps) {
  return healthFactor(collateralUsd * (1 - navDropPct / 100), debtUsd, liquidationThresholdBps);
}

export function riskStatus(hf, debtUsd) {
  if (debtUsd <= 0) {
    return { id: "clear", label: "No debt", note: "Borrowing capacity is unused." };
  }
  if (!Number.isFinite(hf) || hf >= 1.5) {
    return { id: "healthy", label: "Healthy", note: "Collateral covers the line with room to move." };
  }
  if (hf >= 1.1) {
    return { id: "margin", label: "Margin", note: "Repay or add collateral before a small move matters." };
  }
  if (hf >= 1) {
    return { id: "call", label: "Margin call", note: "A modest NAV drop reaches the liquidation threshold." };
  }
  return { id: "liquid", label: "Liquidatable", note: "Debt is no longer covered at the liquidation threshold." };
}

export function gaugePercent(hf, debtUsd) {
  if (debtUsd <= 0 || !Number.isFinite(hf)) return 100;
  const clamped = Math.min(3, Math.max(0.7, hf));
  return ((clamped - 0.7) / 2.3) * 100;
}
