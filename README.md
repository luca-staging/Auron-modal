# Heldnav

Collateral becomes a stablecoin line. An oracle prices the asset, an LTV caps the draw, and a health factor shows the distance to liquidation.

The repo has three project folders:

| Folder | What it is |
| --- | --- |
| `frontend` | React desk. Vite compiles it. |
| `backend` | Express API, CommonJS (`require`). |
| `contracts` | Solidity lending pool, Foundry. |

Node packages are CommonJS. The React source uses `import` because Vite compiles it. `frontend/vite.config.mjs` is the one config file Vite has to load as ESM.

## Run

```bash
npm install
npm run dev
```

- Desk: http://localhost:3000

## Local chain

Requires [Foundry](https://book.getfoundry.sh/getting-started/installation).

```bash
npm run chain
npm run deploy:local
npm run dev
```

Connect with MetaMask, Phantom, or Rabby. For Anvil, add RPC `http://127.0.0.1:8545`, chain id `31337`, and import account #0:

`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

Walk the desk: faucet, approve, deposit, draw, repay, withdraw.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | API and desk |
| `npm run chain` | Local Anvil |
| `npm run deploy:local` | Deploy and write frontend addresses |
| `npm run contracts:test` | Forge tests |
