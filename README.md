# morv-b20

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)
[![Base](https://img.shields.io/badge/Base-B20%20%2F%20Beryl-0052FF)](https://docs.base.org/base-chain/specs/upgrades/beryl/b20)

> **CLI for Base B20 Native Token Standard** (Beryl upgrade). Deploy, inspect, and manage B20 precompile tokens from your terminal.

Built against official interfaces from [base/base-std](https://github.com/base/base-std). This tool talks directly to Base precompiles — not placeholder contracts.

```
  ██████╗ ██████╗  ██████╗
  ██╔══██╗╚════██╗██╔═████╗
  ██████╔╝ █████╔╝██║██╔██║
  ██╔══██╗██╔═══╝ ████╔╝██║
  ██████╔╝███████╗╚██████╔╝
  ╚═════╝ ╚══════╝ ╚═════╝
  morv-b20 · Base Native Token CLI
```

---

## What is B20?

**B20** is Base’s chain-native token standard introduced in the **Beryl** hardfork. Tokens are ERC-20 compatible but implemented as Rust precompiles instead of EVM contracts. They include built-in compliance primitives: roles, policy registry integration, pause controls, and freeze-seize (`burnBlocked`).

| Variant | Use case |
|---------|----------|
| **Asset** | General-purpose tokens (6–18 decimals), batch mint, multiplier |
| **Stablecoin** | Fixed 6 decimals + ISO currency code |

### Is B20 like pump.fun?

**No.** They solve different problems:

| | **B20** | **pump.fun / Clanker** |
|---|---------|------------------------|
| **Purpose** | Regulated issuers: stablecoins, RWAs, compliance-heavy tokens | Meme / social token launchpads |
| **Mechanism** | Native precompile via `IB20Factory` | Smart contracts, bonding curves, Uniswap pools |
| **Compliance** | Blocklist/allowlist policies, roles, pause, freeze-seize | Minimal or none |
| **Audience** | Institutions, fintech, RWA platforms | Retail traders, creators |

B20 includes an **Asset** variant for “long-tail” tokens, but it is **not** a pump.fun replacement — it is infrastructure for issuers who need on-chain policy enforcement at the protocol layer.

---

## Beryl activation schedule

From the [Beryl upgrade specification](https://basehub.org/specifications/beryl-overview/):

| Network | Activation (UTC) |
|---------|------------------|
| **Base Sepolia** | 2026-06-18 18:00:00 |
| **Base Mainnet** | 2026-06-25 18:00:00 |

Until Beryl is live, `morv-b20 status` reports precompiles as unreachable and deploy/write operations will fail. Run `morv-b20 status` before deploying.

---

## Quick start

### Prerequisites

- **Node.js 18+**
- A wallet with ETH on Base (or Sepolia) for gas
- Beryl activated on your target network

### Install

```bash
git clone https://github.com/Morv-Labs/Morv-b20.git
cd Morv-b20
npm install
npm link          # optional: global `morv-b20` / `b20` command
```

### Guided session (default)

```bash
morv-b20
```

Step-by-step flow with categorized menus:

1. **Config** — RPC URL + private key (skipped if already configured)
2. **Status** — automatic Beryl / factory health check (live on-chain data)
3. **View** — read-only menu (no transactions):
   - **Network** — refresh status
   - **Token** — set address, decode, inspect, balance
   - **Policy** — check authorization
   - **Roles** — check role on token
4. **Write** — transaction menu (after you finish viewing):
   - **Token** — deploy, set address
   - **Policy** — create, attach
   - **Roles** — grant, revoke
   - **Transfers** — mint, transfer, approve, permit, burn, batch mint
   - **Admin** — pause, supply cap, metadata, multiplier, renounce admin

Each write action asks for confirmation before sending a transaction. If Beryl is not live, writes are blocked.

### Configure manually

```bash
morv-b20 config
```

Saves to `~/.morv-b20rc.json` (Windows: `%USERPROFILE%\.morv-b20rc.json`).

### Verify the network

```bash
morv-b20 status
```

### Deploy a token

```bash
morv-b20 deploy
```

Wizard covers variant, supply cap, minter role, and optional policy `initCalls`.

### Example workflow

```bash
morv-b20 status
morv-b20 policy create                    # optional: blocklist / allowlist
morv-b20 deploy
morv-b20 inspect 0xB20…
morv-b20 mint 0xB20… 0xRecipient 1000
morv-b20 policy attach 0xB20… TRANSFER_SENDER_POLICY 123
```

---

## Command reference

| Command | Description |
|---------|-------------|
| `morv-b20` | **Default** — guided session |
| `morv-b20 config` | Save RPC + private key |
| `morv-b20 status` | Beryl activation + precompile health |
| `morv-b20 inspect <addr>` | Token summary, policies, pause state, roles |
| `morv-b20 deploy` | Deploy Asset or Stablecoin with `initCalls` |
| `morv-b20 balance <token> <wallet>` | Token balance |
| `morv-b20 address-decode <addr>` | Offline B20 address variant decode |
| `morv-b20 transfer` / `transfer-memo` / `transfer-from` | Transfers |
| `morv-b20 approve` / `permit` | Allowance + EIP-2612 |
| `morv-b20 mint` / `mint-memo` / `batch-mint` | Mint operations |
| `morv-b20 burn` / `burn-memo` / `burn-blocked` | Burn + freeze-seize |
| `morv-b20 pause` / `unpause <token> <features>` | e.g. `TRANSFER,MINT` |
| `morv-b20 supply-cap` / `update-name` / `renounce-admin` | Admin |
| `morv-b20 multiplier` / `extra-metadata` | Asset variant only |
| `morv-b20 policy create` / `check` / `add` / `attach` | Policy registry |
| `morv-b20 role grant` / `revoke` / `check` | AccessControl roles |

Aliases: `b20` and `morv-b20` are equivalent (`npm run morv-b20` also works).

---

## Official precompile addresses

From [`base-std` → `StdPrecompiles.sol`](https://github.com/base/base-std/blob/main/src/StdPrecompiles.sol):

| Precompile | Address |
|------------|---------|
| **B20 Factory** (`IB20Factory`) | `0xB20f000000000000000000000000000000000000` |
| **Activation Registry** | `0x8453000000000000000000000000000000000001` |
| **Policy Registry** | `0x8453000000000000000000000000000000000002` |

### Policy scopes

Defined in base-std and used by `morv-b20 policy attach`:

- `TRANSFER_SENDER_POLICY`
- `TRANSFER_RECEIVER_POLICY`
- `TRANSFER_EXECUTOR_POLICY`
- `MINT_RECEIVER_POLICY`

Reserved policy IDs:

- `0` — `ALWAYS_ALLOW`
- `(1 << 56) | 1` — `ALWAYS_BLOCK`

### Factory API

`createB20(variant, salt, params, initCalls)` — parameter order matches [IB20Factory](https://github.com/base/base-std/blob/main/src/interfaces/IB20Factory.sol).

Supply cap sentinel: `type(uint128).max` (unlimited), not `MaxUint256`.

---

## Official sources

All addresses, ABIs, and behavior in this CLI are derived from these sources:

| Resource | URL |
|----------|-----|
| B20 specification | https://docs.base.org/base-chain/specs/upgrades/beryl/b20 |
| Beryl upgrade overview | https://basehub.org/specifications/beryl-overview/ |
| base-std (interfaces + precompiles) | https://github.com/base/base-std |
| `StdPrecompiles.sol` | https://github.com/base/base-std/blob/main/src/StdPrecompiles.sol |
| `IB20Factory.sol` | https://github.com/base/base-std/blob/main/src/interfaces/IB20Factory.sol |
| B20 factory storage (Rust) | https://github.com/base/base/blob/main/crates/common/precompiles/src/b20_factory/storage.rs |
| Policy registry storage | https://github.com/base/base/blob/main/crates/common/precompiles/src/policy_registry/storage.rs |

Do not trust third-party address lists — verify against `base-std` and Base documentation.

### Data authenticity

| Operation | Data source |
|-----------|-------------|
| `status` | Live RPC calls to Activation Registry + B20 Factory precompiles |
| `inspect`, `balance`, `policy check`, `role check` | On-chain reads from your configured RPC |
| `deploy`, `mint`, `transfer`, etc. | Real signed transactions on Base |
| `address-decode` | Offline decode from the B20 address layout (no RPC) |

When Beryl is **not** yet activated, `status` correctly reports factory as unreachable — that is real network state, not placeholder data.

---

## Landing page (Railway)

Railway hosts the **static website** (`website/`). The **CLI runs locally** on your machine.

1. Push this repo to [github.com/Morv-Labs/Morv-b20](https://github.com/Morv-Labs/Morv-b20)
2. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → select `Morv-b20`
3. Railway auto-detects Node; `npm start` serves the landing page on `$PORT`
4. **Settings → Networking → Generate Domain** for a public URL

No environment variables are required for the static site.

---

## Security

- Private keys are stored **in plaintext** in `~/.morv-b20rc.json` on your machine.
- Never commit config files or share your private key.
- This is a developer tool — audit your transactions before signing.
- `renounce-admin` is **irreversible**.

---

## Development

```bash
npm install
node bin/b20.js --help
npm run website    # local landing page on :3456
```

---

## License

[MIT](LICENSE) — Copyright (c) 2026 Morv Labs

---

## Disclaimer

This project is community tooling by Morv Labs. It is **not** an official Base or Coinbase product. B20 and Beryl are defined by the Base protocol — always refer to [docs.base.org](https://docs.base.org) for the canonical specification.
