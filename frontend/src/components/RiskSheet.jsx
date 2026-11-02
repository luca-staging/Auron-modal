import {
  bpsToPct,
  formatBps,
  currentLtvPct,
  formatHf,
  formatUsd,
  gaugePercent,
  hfAfterNavShock,
  liquidationBufferUsd,
  riskStatus,
} from "../lib/risk";

export function RiskSheet({
  collateralUsd,
  debtUsd,
  healthFactor,
  ltvBps,
  liquidationThresholdBps = 8000,
  maxBorrow,
  title = "Risk",
}) {
  const status = riskStatus(healthFactor, debtUsd);
  const ltvNow = currentLtvPct(collateralUsd, debtUsd);
  const ltvHeadroom = bpsToPct(ltvBps) - ltvNow;
  const buffer = liquidationBufferUsd(collateralUsd, debtUsd, liquidationThresholdBps);
  const shock = hfAfterNavShock(collateralUsd, debtUsd, 5, liquidationThresholdBps);
  const mark = gaugePercent(healthFactor, debtUsd);

  return (
    <aside className="sheet" aria-label="Risk">
      <div className="sheet-top">
        <div>
          <h2>{title}</h2>
          <p className="note">{status.note}</p>
        </div>
        <span className={`badge is-${status.id}`}>{status.label}</span>
      </div>
      <div className="gauge" aria-hidden="true">
        <div className="gauge-track">
          <span className="gauge-mark" style={{ left: `${mark}%` }} />
        </div>
        <div className="gauge-scale">
          <span>Liquidation</span>
          <span>Margin</span>
          <span>Healthy</span>
        </div>
      </div>
      <div className="sheet-row">
        <span>Health factor</span>
        <b className={`status-${status.id}`}>{formatHf(healthFactor)}</b>
      </div>
      <div className="sheet-row">
        <span>Current LTV</span>
        <b>{collateralUsd > 0 ? `${ltvNow.toFixed(1)}%` : "—"}</b>
      </div>
      <div className="sheet-row">
        <span>Max LTV</span>
        <b>{formatBps(ltvBps)}</b>
      </div>
      <div className="sheet-row">
        <span>LTV headroom</span>
        <b>{collateralUsd > 0 ? `${ltvHeadroom.toFixed(1)}%` : "—"}</b>
      </div>
      <div className="sheet-row">
        <span>Liquidation threshold</span>
        <b>{formatBps(liquidationThresholdBps)}</b>
      </div>
      <div className="sheet-row">
        <span>Buffer to liquidation</span>
        <b>{formatUsd(buffer)}</b>
      </div>
      {maxBorrow != null && (
        <div className="sheet-row">
          <span>Borrowing capacity</span>
          <b>{formatUsd(maxBorrow)}</b>
        </div>
      )}
      <div className="sheet-row">
        <span>Health if NAV −5%</span>
        <b>{formatHf(shock)}</b>
      </div>
    </aside>
  );
}
