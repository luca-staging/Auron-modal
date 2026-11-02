import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AssetCell } from "../components/AssetCell";
import { RiskSheet } from "../components/RiskSheet";
import { apiGet } from "../lib/api";
import { useProtocolPosition } from "../lib/protocol";
import { LIQUIDATION_THRESHOLD_BPS, MARKETS, creditPerUsd, formatBps, formatHf, formatUsd, riskStatus } from "../lib/risk";

const STEPS = [
  { n: "01", title: "Post the asset", body: "A real-world asset token is the collateral. HNVWA stands in for treasury exposure until you deposit it." },
  { n: "02", title: "Price the NAV", body: "The oracle marks one HNVWA at $1.00. The line is sized off that value." },
  { n: "03", title: "Open the line", body: "Max LTV is how much hnvUSD one dollar of collateral unlocks. The liquidation threshold is where the line breaks." },
  { n: "04", title: "Use the liquidity", body: "Drawn hnvUSD sits in the wallet. That stablecoin balance is the liquidity the asset just made usable." },
];

export function DeskPage() {
  const position = useProtocolPosition();
  const poolQuery = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => apiGet("/portfolio"),
    refetchInterval: 4000,
  });
  const marketsQuery = useQuery({
    queryKey: ["markets"],
    queryFn: () => apiGet("/markets"),
    refetchInterval: 8000,
  });
  const pool = poolQuery.data;
  const book = marketsQuery.data || MARKETS;
  const poolHf = pool && pool.healthFactor != null ? Number(pool.healthFactor) : Number.NaN;
  const collateral = position.isConnected ? position.walletHnvwaUsd + position.collateralUsd : 0;
  const debt = position.isConnected ? position.debtUsd : 0;
  const stable = position.isConnected ? position.walletHnvUsdBal : 0;
  const status = riskStatus(position.healthFactor, debt);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h1>Credit desk</h1>
          <p className="lede">Post a real-world asset, draw hnvUSD up to the LTV, and use that stablecoin as liquidity. Health factor is the buffer.</p>
        </div>
        <Link className="btn" to="/borrow">
          Open a line
        </Link>
      </header>

      {!position.isConnected && <p className="notice">Connect a wallet to read balances from the local pool.</p>}

      <section className="stat-grid">
        <div className="stat">
          <span>RWA collateral</span>
          <strong>{position.isConnected ? formatUsd(collateral) : "—"}</strong>
          <em>Wallet plus posted</em>
        </div>
        <div className="stat">
          <span>Credit capacity</span>
          <strong>{position.isConnected ? formatUsd(position.maxBorrow) : "—"}</strong>
          <em>{position.isConnected ? `${creditPerUsd(position.ltvBps || 7000)} per $1 posted` : "Opens after you post"}</em>
        </div>
        <div className="stat">
          <span>Stablecoin liquidity</span>
          <strong>{position.isConnected ? formatUsd(stable) : "—"}</strong>
          <em>{position.isConnected ? `${formatUsd(debt)} drawn` : "hnvUSD after you draw"}</em>
        </div>
        <div className="stat">
          <span>Health</span>
          <strong className={position.isConnected ? `status-${status.id}` : undefined}>
            {position.isConnected ? status.label : "—"}
          </strong>
          <em>{position.isConnected ? status.note : "Connect to score the line"}</em>
        </div>
      </section>

      <section className="panel pool-strip">
        <div className="panel-head">
          <div>
            <h2>Shared book</h2>
            <p>{pool && pool.source === "chain" ? "Every RWA posted on this chain, and the hnvUSD drawn against it." : "The chain is not answering."}</p>
          </div>
        </div>
        <div className="stat-grid pool-grid">
          <div className="stat">
            <span>Posted collateral</span>
            <strong>{pool && pool.source === "chain" ? formatUsd(pool.collateralUsd) : "—"}</strong>
          </div>
          <div className="stat">
            <span>Debt</span>
            <strong>{pool && pool.source === "chain" ? formatUsd(pool.debtUsd) : "—"}</strong>
          </div>
          <div className="stat">
            <span>Pool health</span>
            <strong>{pool && pool.source === "chain" ? formatHf(poolHf) : "—"}</strong>
          </div>
          <div className="stat">
            <span>Borrow APR</span>
            <strong>{pool && pool.borrowAprBps != null ? formatBps(pool.borrowAprBps) : "—"}</strong>
          </div>
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Markets</h2>
              <p>Credit per dollar of collateral. The live sleeve uses the pool LTV when the chain is up.</p>
            </div>
            <Link className="linkish" to="/markets">
              View all
            </Link>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th className="num-col">Credit / $1</th>
                <th className="num-col">Max LTV</th>
                <th className="num-col">Liquidation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {book.map((market) => (
                <tr key={market.id}>
                  <td>
                    <AssetCell name={market.name} token={market.token} to={`/markets/${market.id}`} />
                  </td>
                  <td className="num-col">{creditPerUsd(market.ltvBps)}</td>
                  <td className="num-col">{formatBps(market.ltvBps)}</td>
                  <td className="num-col">{formatBps(market.liquidationThresholdBps)}</td>
                  <td className="num-col">
                    <Link className="linkish" to={market.borrowEnabled ? "/borrow" : `/markets/${market.id}`}>
                      {market.borrowEnabled ? "Borrow" : "View"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <RiskSheet
          title="Open line"
          collateralUsd={position.collateralUsd}
          debtUsd={position.debtUsd}
          healthFactor={position.healthFactor}
          ltvBps={position.ltvBps || 7000}
          liquidationThresholdBps={LIQUIDATION_THRESHOLD_BPS}
          maxBorrow={position.maxBorrow}
        />
      </div>

      <section className="how-grid">
        {STEPS.map((step) => (
          <article key={step.n} className="how-card">
            <span>{step.n}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </section>
    </>
  );
}
