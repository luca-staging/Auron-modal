import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AssetCell } from "../components/AssetCell";
import { apiGet } from "../lib/api";
import { MARKETS, NAV_USD, creditPerUsd, formatBps, formatUsd } from "../lib/risk";

function yieldLabel(apy) {
  return `${Number(apy).toFixed(2)} %`;
}

export function MarketsPage() {
  const query = useQuery({
    queryKey: ["markets"],
    queryFn: () => apiGet("/markets"),
    refetchInterval: 8000,
  });
  const markets = query.data || MARKETS;
  const live = markets.find((market) => market.borrowEnabled) || markets[0];
  const [text, setText] = useState("");
  const [book, setBook] = useState("all");
  const [showCatalogue, setShowCatalogue] = useState(true);

  const rows = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return markets.filter((market) => {
      const hay = `${market.name} ${market.token} ${market.role}`.toLowerCase();
      if (needle && !hay.includes(needle)) return false;
      if (book === "live" && !market.borrowEnabled) return false;
      if (book === "catalogue" && market.borrowEnabled) return false;
      if (book === "all" && !showCatalogue && !market.borrowEnabled) return false;
      return true;
    });
  }, [markets, text, book, showCatalogue]);

  return (
    <>
      <section className="market-hero">
        <div className="market-id">
          <div className="market-title">
            <AssetCell name="" token={live.token} />
            <h1>{live.name}</h1>
            <span className="version-chip">Live</span>
          </div>
          <p className="lede">
            A real-world asset priced as collateral. One dollar unlocks {creditPerUsd(live.ltvBps)} of hnvUSD, the stablecoin liquidity you can use. The other sleeves are listed so the limits can be compared.
          </p>
        </div>
        <div className="market-metrics">
          <div>
            <span>Credit / $1</span>
            <strong>{creditPerUsd(live.ltvBps)}</strong>
          </div>
          <div>
            <span>Max LTV</span>
            <strong>{formatBps(live.ltvBps)}</strong>
          </div>
          <div className="market-metrics-split">
            <div>
              <span>Liquidation</span>
              <strong>{formatBps(live.liquidationThresholdBps)}</strong>
            </div>
            <div>
              <span>Oracle NAV</span>
              <strong>{formatUsd(NAV_USD)}</strong>
            </div>
            <div>
              <span>Asset yield</span>
              <strong>{yieldLabel(live.apy)}</strong>
            </div>
            {live.borrowAprBps != null && (
              <div>
                <span>Borrow APR</span>
                <strong>{formatBps(live.borrowAprBps)}</strong>
              </div>
            )}
            <div>
              <span>Sleeves</span>
              <strong>{markets.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-card">
        <div className="feature-copy">
          <AssetCell name="Unlock hnvUSD" token={live.token} />
          <p>Stablecoin liquidity against {live.name} collateral.</p>
        </div>
        <div>
          <span>Max LTV</span>
          <strong>{formatBps(live.ltvBps)}</strong>
        </div>
        <div>
          <span>Credit / $1</span>
          <strong>{creditPerUsd(live.ltvBps)}</strong>
        </div>
        <Link className="btn secondary" to={`/borrow?market=${live.id}`}>
          Borrow
        </Link>
      </section>

      <div className="market-tools">
        <input
          className="market-search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search asset name or symbol"
          aria-label="Search asset name or symbol"
        />
        <select aria-label="Sleeve filter" value={book} onChange={(event) => setBook(event.target.value)}>
          <option value="all">All sleeves</option>
          <option value="live">Live</option>
          <option value="catalogue">Catalogue</option>
        </select>
        <label className="check">
          <input
            type="checkbox"
            checked={showCatalogue}
            onChange={(event) => setShowCatalogue(event.target.checked)}
          />
          Show catalogue sleeves
        </label>
      </div>

      <section className="panel market-table-wrap">
        <table className="table market-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>NAV</th>
              <th className="num-col">Asset yield</th>
              <th className="num-col">Credit / $1</th>
              <th className="num-col">Max LTV</th>
              <th className="num-col">Liquidation</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="empty" colSpan={6}>
                  No sleeves match.
                </td>
              </tr>
            )}
            {rows.map((market) => (
              <tr key={market.id}>
                <td>
                  <AssetCell name={market.name} token={market.token} to={`/markets/${market.id}`} />
                  <span className={market.borrowEnabled ? "row-status is-live" : "row-status"}>
                    {market.borrowEnabled ? "Live" : "Catalogue"}
                  </span>
                </td>
                <td>
                  <span className="stack-num">
                    <b>{market.borrowEnabled ? formatUsd(NAV_USD) : "—"}</b>
                    <span>{market.borrowEnabled ? "Per token" : "Not priced"}</span>
                  </span>
                </td>
                <td className="num-col">{yieldLabel(market.apy)}</td>
                <td className="num-col">{creditPerUsd(market.ltvBps)}</td>
                <td className="num-col">{formatBps(market.ltvBps)}</td>
                <td className="num-col">{formatBps(market.liquidationThresholdBps)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
