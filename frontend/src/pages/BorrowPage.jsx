import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RiskSheet } from "../components/RiskSheet";
import { TxLine } from "../components/TxLine";
import { apiGet } from "../lib/api";
import { toWei } from "../lib/contracts";
import { useProtocolActions, useProtocolPosition } from "../lib/protocol";
import { LIQUIDATION_THRESHOLD_BPS, MARKETS, formatHf, healthFactor, maxBorrowUsd, parseHf } from "../lib/risk";

export function BorrowPage() {
  const [params] = useSearchParams();
  const market = MARKETS.find((item) => item.id === params.get("market")) || MARKETS[0];
  const position = useProtocolPosition();
  const actions = useProtocolActions(() => {
    void position.refetch();
  });
  const [depositAmt, setDepositAmt] = useState(10000);
  const [borrowAmt, setBorrowAmt] = useState(6000);

  useEffect(() => {
    if (position.collateralUsd > 0 && position.maxBorrow > 0) {
      setBorrowAmt((prev) => Math.min(prev, Math.floor(position.maxBorrow)));
    }
  }, [position.collateralUsd, position.maxBorrow]);

  const depositWei = toWei(depositAmt);
  const needsApprove = position.hnvwaAllowance < depositWei;
  const hasWallet = position.walletHnvwaUsd >= depositAmt;
  const hasCollateral = position.collateralUsd > 0;
  const previewCollateral = position.collateralUsd > 0 ? position.collateralUsd : depositAmt;
  const previewDebt = position.debtUsd + borrowAmt;
  const ltvBps = position.ltvBps || market.ltvBps;
  const previewMax = maxBorrowUsd(previewCollateral, ltvBps);
  const previewHf = useMemo(
    () => healthFactor(previewCollateral, previewDebt, market.liquidationThresholdBps),
    [previewCollateral, previewDebt, market.liquidationThresholdBps],
  );
  const previewQuery = useQuery({
    queryKey: ["borrow-preview", previewCollateral, previewDebt],
    queryFn: () =>
      apiGet(
        `/positions/preview/borrow?collateralUsd=${encodeURIComponent(previewCollateral)}&borrowUsd=${encodeURIComponent(previewDebt)}`,
      ),
    enabled: Number.isFinite(previewCollateral) && Number.isFinite(previewDebt),
  });
  const remote = previewQuery.data;
  const sheetHf = remote ? parseHf(remote.healthFactor, previewHf) : previewHf;
  const sheetLtv = remote?.ltvBps ?? ltvBps;
  const sheetThreshold = remote?.liquidationThresholdBps ?? market.liquidationThresholdBps ?? LIQUIDATION_THRESHOLD_BPS;
  const sheetMax = remote?.maxBorrowUsd ?? previewMax;
  const overLtv = remote ? remote.withinLtv === false : previewDebt > sheetMax;
  const liveDisabled = !position.isConnected || !position.deployed || actions.busy;
  const steps = [
    { id: "fund", label: "Fund", done: hasWallet || hasCollateral, now: !hasWallet && !hasCollateral },
    { id: "approve", label: "Approve", done: !needsApprove && (hasWallet || hasCollateral), now: hasWallet && needsApprove },
    { id: "deposit", label: "Deposit", done: hasCollateral, now: hasWallet && !needsApprove && !hasCollateral },
    { id: "borrow", label: "Draw", done: position.debtUsd > 0, now: hasCollateral },
  ];

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Borrow</p>
          <h1>Draw against {market.name}</h1>
          <p className="lede">
            {market.borrowEnabled
              ? "Deposit the real-world asset, then draw hnvUSD up to the LTV. Those stablecoins are the liquidity this collateral unlocks. The risk card updates before you sign."
              : `${market.token} is catalogue-only. This form still executes on the HNVWA pool.`}
          </p>
        </div>
      </header>
      <div className="split">
        <form
          className="panel form-card"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <ol className="stepper">
            {steps.map((step, index) => (
              <li key={step.id} className={step.done ? "is-done" : step.now ? "is-now" : ""}>
                <i>{index + 1}</i>
                {step.label}
              </li>
            ))}
          </ol>
          <div className="balances">
            <div className="balance">
              <span>Wallet HNVWA</span>
              <b>{position.walletHnvwaUsd.toLocaleString()}</b>
            </div>
            <div className="balance">
              <span>Posted</span>
              <b>{position.collateralUsd.toLocaleString()}</b>
            </div>
          </div>
          <label className="amount">
            <span className="amount-label">Deposit</span>
            <span className="amount-box">
              <input
                type="number"
                min="0"
                value={depositAmt}
                onChange={(event) => setDepositAmt(Number(event.target.value))}
              />
              <em>HNVWA</em>
            </span>
          </label>
          <label className="amount">
            <span className="amount-label">
              Draw
              <button type="button" className="text-btn" onClick={() => setBorrowAmt(Math.floor(sheetMax))}>
                Max {Math.floor(sheetMax).toLocaleString()}
              </button>
            </span>
            <span className="amount-box">
              <input
                type="number"
                min="0"
                value={borrowAmt}
                onChange={(event) => setBorrowAmt(Number(event.target.value))}
              />
              <em>hnvUSD</em>
            </span>
          </label>
          <p className="note">
            {remote
              ? `Desk preview health ${remote.healthFactor} on ${Number(remote.collateralUsd).toLocaleString()} collateral and ${Number(remote.borrowUsd).toLocaleString()} debt${overLtv ? ", above max LTV" : ""}. Source: ${remote.source}.`
              : `Preview health ${formatHf(previewHf)} on ${previewCollateral.toLocaleString()} collateral and ${previewDebt.toLocaleString()} debt.`}
          </p>
          <TxLine {...actions} />
          <div className="actions">
            <button type="button" className="btn secondary" disabled={liveDisabled} onClick={() => actions.faucet(10000)}>
              Faucet 10,000
            </button>
            {needsApprove ? (
              <button type="button" className="btn secondary" disabled={liveDisabled} onClick={() => actions.approveHnvwa()}>
                Approve HNVWA
              </button>
            ) : (
              <button type="button" className="btn secondary" disabled={liveDisabled || depositAmt <= 0} onClick={() => actions.deposit(depositAmt)}>
                Deposit
              </button>
            )}
            <button
              type="button"
              className="btn"
              disabled={liveDisabled || borrowAmt <= 0 || position.collateralUsd <= 0 || overLtv}
              onClick={() => actions.borrow(borrowAmt)}
            >
              Draw hnvUSD
            </button>
            <Link className="btn secondary" to="/position">
              Position
            </Link>
          </div>
        </form>
        <RiskSheet
          collateralUsd={remote?.collateralUsd ?? previewCollateral}
          debtUsd={remote?.borrowUsd ?? previewDebt}
          healthFactor={sheetHf}
          ltvBps={sheetLtv}
          liquidationThresholdBps={sheetThreshold}
          maxBorrow={sheetMax}
        />
      </div>
    </>
  );
}
