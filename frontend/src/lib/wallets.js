import { injected } from "wagmi/connectors";

const announced = new Map();
let listening = false;

export function listenForWallets() {
  if (typeof window === "undefined" || listening) return;
  listening = true;
  window.addEventListener("eip6963:announceProvider", (event) => {
    const detail = event.detail;
    if (!detail?.info?.rdns || !detail.provider) return;
    announced.set(detail.info.rdns, detail.provider);
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

function fromWindow(flag) {
  const ethereum = window.ethereum;
  if (!ethereum) return undefined;
  if (ethereum[flag]) return ethereum;
  if (Array.isArray(ethereum.providers)) {
    return ethereum.providers.find((provider) => provider[flag]);
  }
  return undefined;
}

function providerFor(rdns, flag, extra) {
  return () => {
    if (typeof window === "undefined") return undefined;
    return announced.get(rdns) || extra?.() || fromWindow(flag);
  };
}

export const walletChoices = [
  {
    id: "metaMask",
    name: "MetaMask",
    rdns: "io.metamask",
    detail: "Browser extension",
    installUrl: "https://metamask.io/download/",
    connector: injected({
      shimDisconnect: true,
      target: "metaMask",
    }),
  },
  {
    id: "phantom",
    name: "Phantom",
    rdns: "app.phantom",
    detail: "EVM account",
    installUrl: "https://phantom.com/download",
    connector: injected({
      shimDisconnect: true,
      target: "phantom",
    }),
  },
  {
    id: "rabby",
    name: "Rabby",
    rdns: "io.rabby",
    detail: "Browser extension",
    installUrl: "https://rabby.io/",
    connector: injected({
      shimDisconnect: true,
      target() {
        return {
          id: "io.rabby",
          name: "Rabby",
          provider: providerFor("io.rabby", "isRabby"),
        };
      },
    }),
  },
];

export function walletPresence() {
  if (typeof window === "undefined") {
    return { metaMask: false, phantom: false, rabby: false };
  }
  const ethereum = window.ethereum;
  const phantom = window.phantom?.ethereum;
  return {
    metaMask: announced.has("io.metamask") || Boolean(ethereum?.isMetaMask && !ethereum?.isRabby),
    phantom: announced.has("app.phantom") || Boolean(phantom),
    rabby:
      announced.has("io.rabby") ||
      Boolean(ethereum?.isRabby) ||
      Boolean(ethereum?.providers?.some((provider) => provider.isRabby)),
  };
}
