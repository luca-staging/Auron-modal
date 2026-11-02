import { Link } from "react-router-dom";

const TONE = {
  HNVWA: "green",
  HNVPC: "blue",
  HNVTF: "amber",
  hnvUSD: "ink",
};

const MARK = {
  HNVWA: "WA",
  HNVPC: "PC",
  HNVTF: "TF",
  hnvUSD: "$",
};

export function AssetCell({ name, token, to }) {
  const body = (
    <span className="asset">
      <span className={`token is-${TONE[token] || "ink"}`}>{MARK[token] || token.slice(0, 2)}</span>
      <span>
        <span className="asset-name">{name}</span>
        {token !== name && <span className="asset-token">{token}</span>}
      </span>
    </span>
  );
  if (!to) return body;
  return (
    <Link to={to} className="asset-link">
      {body}
    </Link>
  );
}
