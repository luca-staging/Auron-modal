import { useEffect, useState } from "react";
import { useConnection, useConnect, useDisconnect } from "wagmi";
import { walletChoices, walletPresence } from "../lib/wallets";

function short(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletButton() {
  const connection = useConnection();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [presence, setPresence] = useState({ metaMask: false, phantom: false, rabby: false });

  useEffect(() => {
    const read = () => setPresence(walletPresence());
    read();
    window.addEventListener("eip6963:announceProvider", read);
    const timer = window.setTimeout(read, 400);
    return () => {
      window.removeEventListener("eip6963:announceProvider", read);
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (connection.isConnected && connection.address) {
    return (
      <div>
        <button type="button" className="btn secondary" onClick={() => setAccountOpen((value) => !value)}>
          {short(connection.address)}
        </button>
        {accountOpen && (
          <div className="account-pop">
            <p>
              Connected with <code>{connection.connector?.name || "wallet"}</code>
            </p>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                disconnect.mutate();
                setAccountOpen(false);
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button type="button" className="btn secondary" onClick={() => setOpen(true)}>
        Connect wallet
      </button>
      {open && (
        <div className="modal-back" onClick={() => setOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="wallet-title">Connect a wallet</h2>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                Close
              </button>
            </header>
            <p className="lede">MetaMask, Phantom, or Rabby. Install one if it is not in this browser.</p>
            <div className="wallet-list">
              {walletChoices.map((wallet) => {
                const installed = presence[wallet.id];
                const monogram = wallet.name.slice(0, 1);
                if (!installed) {
                  return (
                    <a key={wallet.id} className="wallet-row" href={wallet.installUrl} target="_blank" rel="noreferrer">
                      <span className={`mark is-${wallet.id}`}>{monogram}</span>
                      <span>
                        {wallet.name}
                        <small>{wallet.detail}</small>
                      </span>
                      <span className="wallet-state">Install</span>
                    </a>
                  );
                }
                return (
                  <button
                    key={wallet.id}
                    type="button"
                    className="wallet-row"
                    disabled={connect.isPending}
                    onClick={() =>
                      connect.mutate(
                        { connector: wallet.connector },
                        { onSuccess: () => setOpen(false) },
                      )
                    }
                  >
                    <span className={`mark is-${wallet.id}`}>{monogram}</span>
                    <span>
                      {wallet.name}
                      <small>{wallet.detail}</small>
                    </span>
                    <span className="wallet-state">{connect.isPending ? "Waiting" : "Connect"}</span>
                  </button>
                );
              })}
            </div>
            {connect.error && <p className="tx is-error">{connect.error.message.slice(0, 180)}</p>}
          </div>
        </div>
      )}
    </>
  );
}
