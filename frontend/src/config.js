import { createConfig, http } from "wagmi";
import { anvil } from "viem/chains";
import { contracts } from "./lib/contracts";
import { walletChoices } from "./lib/wallets";

const chain = {
  ...anvil,
  id: contracts.chainId,
  rpcUrls: { default: { http: [contracts.rpcUrl] } },
};

export const config = createConfig({
  chains: [chain],
  connectors: walletChoices.map((wallet) => wallet.connector),
  transports: {
    [chain.id]: http(contracts.rpcUrl),
  },
  multiInjectedProviderDiscovery: true,
  ssr: false,
});
