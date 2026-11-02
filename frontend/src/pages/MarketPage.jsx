import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { AssetCell } from "../components/AssetCell";
import { apiGet } from "../lib/api";
import { MARKETS, NAV_USD, creditPerUsd, formatBps, formatUsd } from "../lib/risk";

export function MarketPage() {
  const { id = "" } = useParams();
  const query = useQuery({
    queryKey: ["market", id],
    queryFn: () => apiGet(`/markets/${id}`),
    enabled: Boolean(id),
    refetchInterval: 8000,
  });
  const local = MARKETS.find((market) => market.id === id);
  const market = query.data || local;

  if (!market) {
    return (
      <>
        <Link to="/markets" className="back">
          Markets
        </Link>
        <header className="page-head">
          <div>
            <h1>Market not found</h1>
            <p className="lede">That sleeve is not in the catalogue.</p>
          </div>
        </header>
      </>
    );
  }

  return (
    <>
      <Link to="/markets" className="back">
        Markets
      </Link>
      <section className="detail">
        <article className="panel identity">
          <AssetCell name={market.token} token={market.token} />
          <h1>{market.name}</h1>
          <p className="lede">{market.description}</p>
          <span className={market.borrowEnabled ? "pill is-live" : "pill"}>
            {market.borrowEnabled ? "Live" : "Catalogue"}
          </span>
          <div className="actions">
            <Link className="btn" to={market.borrowEnabled ? `/borrow?market=${market.id}` : "/borrow?market=us-treasury"}>
              {market.borrowEnabled ? "Open a line" : "Open the HNVWA line"}
            </Link>
          </div>
        </article>
        <div>
          {!market.borrowEnabled && (
            <p className="notice">This sleeve is catalogue-only. The live draw uses the HNVWA pool.</p>
          )}
          <div className="panel spec">
            <div>
              <span>Credit / $1</span>
              <b>{creditPerUsd(market.ltvBps)}</b>
            </div>
            <div>
              <span>Asset yield</span>
              <b>{market.apy}%</b>
            </div>
            <div>
              <span>Max LTV</span>
              <b>{formatBps(market.ltvBps)}</b>
            </div>
            <div>
              <span>Liquidation</span>
              <b>{formatBps(market.liquidationThresholdBps)}</b>
            </div>
            <div>
              <span>Oracle NAV</span>
              <b>{market.borrowEnabled ? formatUsd(NAV_USD) : "—"}</b>
            </div>
            <div>
              <span>Valuation</span>
              <b>{market.valuation}</b>
            </div>
            <div>
              <span>Risk</span>
              <b>{market.risk}</b>
            </div>
            <div>
              <span>Settlement</span>
              <b>{market.liquidity}</b>
            </div>
            {market.borrowAprBps != null && (
              <div>
                <span>Borrow APR</span>
                <b>{formatBps(market.borrowAprBps)}</b>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
