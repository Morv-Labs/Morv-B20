# morv-b20

> CLI for Base **B20 Native Token Standard** (Beryl upgrade). Deploy, inspect, and manage B20 precompile tokens from your terminal.

Built against the official [base/base-std](https://github.com/base/base-std) interfaces.

```
  ██████╗ ██████╗  ██████╗
  ██╔══██╗╚════██╗██╔═████╗
  ██████╔╝ █████╔╝██║██╔██║
  ██╔══██╗██╔═══╝ ████╔╝██║
  ██████╔╝███████╗╚██████╔╝
  ╚═════╝ ╚══════╝ ╚═════╝
  morv-b20 · Base Native Token CLI
```

## Deploy landing page (Railway)

Railway hosts the **website** (`website/`). The **CLI** runs on your machine — not on Railway.

1. Push repo to [github.com/Morv-Labs/Morv-b20](https://github.com/Morv-Labs/Morv-b20)
2. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → pilih `Morv-b20`
3. Railway auto-detects Node; `npm start` serves the landing page on `$PORT`
4. **Settings → Networking → Generate Domain** untuk URL publik

No env vars required for the static site.

## Push to GitHub (PAT)

Buat repo kosong `Morv-Labs/Morv-b20` di GitHub (jika belum ada), lalu:

```bash
git init
git add .
git commit -m "Initial morv-b20 CLI and landing page"
git branch -M main
git remote add origin https://github.com/Morv-Labs/Morv-b20.git
git push -u origin main
```

Dengan **Personal Access Token** (scope `repo`):

```bash
git push https://<GITHUB_TOKEN>@github.com/Morv-Labs/Morv-b20.git main
```

Atau simpan credential sekali:

```bash
git remote set-url origin https://<GITHUB_TOKEN>@github.com/Morv-Labs/Morv-b20.git
git push -u origin main
```

> Jangan commit token ke repo. Hapus token dari remote URL setelah push:  
> `git remote set-url origin https://github.com/Morv-Labs/Morv-b20.git`

## Run the CLI (local)

```bash
# dari folder project
npm install
npm run cli -- --help
npm run cli -- config
npm run cli -- status

# atau global
npm link
b20 config
b20 status
b20 deploy
```

Config disimpan di `~/.morv-b20rc.json` (Windows: `%USERPROFILE%\.morv-b20rc.json`).

## Install

```bash
cd "morv b20"
npm install
npm link   # optional: global `b20` command
node bin/b20.js --help
```

## Setup

```bash
b20 config
# → Base Mainnet or Sepolia, RPC URL, private key
# Saved to ~/.morv-b20rc.json (Windows: %USERPROFILE%\.morv-b20rc.json)
```

Check whether Beryl is live:

```bash
b20 status
```

## Commands

| Command | Description |
|---------|-------------|
| `b20 config` | Save RPC + private key |
| `b20 status` | Beryl activation + precompile health |
| `b20 inspect <addr>` | Token summary, policies, pause, roles |
| `b20 deploy` | Deploy Asset or Stablecoin with initCalls |
| `b20 balance <token> <wallet>` | Formatted balance |
| `b20 address-decode <addr>` | Offline variant decode |
| `b20 mint <token> <to> <amount>` | Mint (MINT_ROLE) |
| `b20 policy create` | New blocklist/allowlist |
| `b20 policy check <id> <account>` | `isAuthorized` query |
| `b20 policy add <id> <addrs>` | Update blocklist/allowlist |
| `b20 policy attach <token> <scope> <id>` | `updatePolicy` |
| `b20 role grant <token> <role> <account>` | `grantRole` |
| `b20 role check <token> <role> <account>` | `hasRole` |

### Deploy example flow

```bash
b20 status
b20 policy create          # optional compliance policy
b20 deploy                 # wizard: variant, cap, minter, policies via initCalls
b20 inspect 0xB20…
b20 mint 0xB20… 0xRecipient 1000
```

## Precompile addresses

From `base-std` `StdPrecompiles.sol`:

| Precompile | Address |
|------------|---------|
| B20 Factory | `0xB20f000000000000000000000000000000000000` |
| Policy Registry | `0x8453000000000000000000000000000000000002` |
| Activation Registry | `0x8453000000000000000000000000000000000001` |

## Policy scopes

- `TRANSFER_SENDER_POLICY`
- `TRANSFER_RECEIVER_POLICY`
- `TRANSFER_EXECUTOR_POLICY`
- `MINT_RECEIVER_POLICY`

Reserved IDs: `0` = ALWAYS_ALLOW, `(1 << 56) | 1` = ALWAYS_BLOCK

## Security

Private keys are stored in plaintext locally. Never commit `~/.morv-b20rc.json`.

## License

MIT
