export function TxLine({ pendingLabel, confirming, error, lastHash }) {
  if (!pendingLabel && !confirming && !error && !lastHash) return null;
  return (
    <p className={error ? "tx is-error" : "tx"} role="status">
      {pendingLabel && `${pendingLabel}…`}
      {!pendingLabel && confirming && "Waiting for the chain…"}
      {!pendingLabel && !confirming && lastHash && `Confirmed ${lastHash.slice(0, 10)}…${lastHash.slice(-4)}`}
      {error ? ` ${error}` : ""}
    </p>
  );
}
