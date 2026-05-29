# EIP-7702 Revoker Web

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![EIP-7702](https://img.shields.io/badge/EIP-7702-3498db)](https://eips.ethereum.org/EIPS/eip-7702)

> 🔐 **Gasless revocation tool for EIP-7702 account delegations** — Protect your wallet by revoking unauthorized smart contract delegations without paying gas fees.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [What is EIP-7702?](#-what-is-eip-7702)
- [Why Use This Tool?](#-why-use-this-tool)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Usage](#-usage)
- [Supported Networks](#-supported-networks)
- [Security Considerations](#-security-considerations)
- [Technical Stack](#-technical-stack)
- [Project Structure](#-project-structure)
- [Deploying to Vercel](#-deploying-to-vercel)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**EIP7702-revoker-WEB** is a client-side web application that lets Ethereum users safely revoke EIP-7702 account delegations. The tool solves the critical "gas problem": the compromised wallet likely has zero ETH, so a server-side sponsor wallet pays the gas instead.

**The private key never leaves the browser.** Signing happens locally via `viem`; only the resulting `{r, s, yParity}` signature is sent to the server. The server combines that signature with a sponsor-funded Type-4 (EIP-7702) transaction and broadcasts it on-chain.

---

## 🧠 What is EIP-7702?

[EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) introduces a new transaction type that lets Externally Owned Accounts (EOAs) temporarily delegate their execution logic to a smart contract. This unlocks:

- Smart account features for regular wallets (batch txns, gas abstraction, etc.)
- Advanced authorization and paymaster flows

However, if a private key is compromised, an attacker can set a **malicious delegation**, effectively hijacking the account. Revoking requires sending a special EIP-7702 transaction that sets the delegate address to `0x0000…0000`.

---

## ⚠️ Why Use This Tool?

| Scenario | Problem | Solution |
|---|---|---|
| **Compromised wallet** | Attacker set malicious EIP-7702 delegation | Revoke delegation gaslessly |
| **Zero ETH balance** | Can't pay gas for revocation transaction | Server-side gas sponsorship |
| **Phishing recovery** | Need to quickly restore account control | One-click revocation flow |
| **Security audit** | Verify and clean up old delegations | Multi-chain scan + review |

> 🛡️ **Important**: This tool does NOT recover stolen funds. It only revokes the delegation mechanism. Always transfer remaining assets to a new, secure wallet after revoking.

---

## ✨ Features

- 🔍 **Multi-chain scan** — simultaneously checks 18 networks for active delegations
- 🔐 **Private-key signing** — EIP-7702 authorization signed locally; key cleared from memory immediately after
- ⚡ **Gasless revocation** — server-side sponsor pays all gas; zero ETH required on compromised wallet
- 🔗 **Delegate tab** — set a new delegation to a trusted contract on any supported network
- 🌐 **Client-side security** — `{r, s, yParity}` is the only data sent to the server; no key storage
- 📱 **Responsive UI** — works on desktop and mobile; dark-mode first

---

## ⚙️ How It Works

```
Browser                                    Server (Next.js API)
────────────────────────────────────────   ──────────────────────────────────
1. User connects compromised wallet         
   (RainbowKit / wagmi — read-only)        
                                           
2. App fetches delegation status           → GET /api/delegation?address=&chainId=
   for all 18 chains in parallel           ← { delegated, delegateTo }
                                           
3. User enters private key locally         
   viem derives address to verify          
                                           
4. User clicks "Revoke"                    
   viem fetches nonce from RPC             
   viem.signAuthorization(                 
     contractAddress = 0x0000…0000,        
     chainId, nonce                        
   ) → { r, s, yParity }                  
   Private key cleared from memory         
                                           
5. App posts signature                     → POST /api/revoke
                                             { address, chainId,
                                               authorization: {r,s,yParity,…} }
                                           
                                           ← Server reconstructs Type-4 tx,
                                             attaches sponsor wallet,
                                             estimates gas, broadcasts
                                           ← { txHash, explorerUrl }
                                           
6. App shows explorer link ✅              
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A funded **sponsor wallet** (EOA with enough ETH/native token to pay gas on each target chain)

### Installation

```bash
git clone https://github.com/Serge693/EIP7702-revoker-WEB.git
cd EIP7702-revoker-WEB
npm install        # or yarn / pnpm / bun
```

### Development

```bash
cp .env.example .env.local
# edit .env.local and add SPONSOR_PRIVATE_KEY
npm run dev
# open http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SPONSOR_PRIVATE_KEY` | ✅ | Private key (`0x…`) of the wallet that pays gas for revocation transactions |

Create `.env.local` for local development:

```env
SPONSOR_PRIVATE_KEY=0xYOUR_SPONSOR_WALLET_PRIVATE_KEY
```

> ⚠️ Never commit `.env.local`. The sponsor wallet needs only small amounts of native token on each chain you want to support — just enough to cover gas.

---

## 💻 Usage

1. **Connect your wallet** — click "Connect Wallet" and connect the **compromised/affected** EOA (read-only; used only to get the address and scan delegations)
2. **Wait for scan** — the app checks all 18 supported networks simultaneously; yellow dots indicate active delegations
3. **Enter private key** — paste the private key of the compromised wallet into the secure local field; the derived address is shown for verification
4. **Revoke** — click "Revoke" next to any delegated network, or "Revoke All" to revoke sequentially across all chains
5. **Confirm** — the sponsor broadcasts the transaction; an explorer link appears on success

> The private key is used solely to call `viem.signAuthorization` in the browser. It is zeroed from state immediately after signing and is never sent over the network.

---

## 🌐 Supported Networks

| Chain | Chain ID |
|---|---|
| Ethereum | 1 |
| Base | 8453 |
| Arbitrum One | 42161 |
| OP Mainnet | 10 |
| Polygon | 137 |
| BNB Smart Chain | 56 |
| Gnosis Chain | 100 |
| Linea | 59144 |
| Blast | 81457 |
| Mode | 34443 |
| Soneium | 1868 |
| zkSync Era ⚠️ | 324 |
| Berachain | 80094 |
| Unichain | 130 |
| World Chain | 480 |
| Lisk | 1135 |
| Bob | 60808 |
| Zora | 7777777 |

> ⚠️ zkSync Era may not fully support EIP-7702 — transactions on that network may fail.

---

## 🔒 Security Considerations

**Private key handling**

- The key is entered into a `type="password"` field and used exclusively in-browser by `viem/accounts → privateKeyToAccount` and `walletClient.signAuthorization`.
- Immediately after `signAuthorization` returns, the key is cleared from React state (`setPrivateKey('')`).
- Only `{r, s, yParity, chainId, nonce, contractAddress}` — the EIP-7702 authorization tuple — is ever transmitted to the server.

**Sponsor trust model**

- The sponsor server can see transaction metadata (target address, chain, nonce) but **cannot alter the signed authorization**; the signature is cryptographically bound to the exact `{contractAddress, chainId, nonce}` values the user signed.
- The sponsor wallet should hold only small operational balances — top up per chain as needed.

**What this tool does not do**

- It does not recover stolen funds.
- It does not protect against future key compromise — after revoking, migrate all assets to a freshly generated wallet.

**Zero-address revocation**

- Revocation sets `contractAddress = 0x0000000000000000000000000000000000000000`, which is the standard EIP-7702 mechanism for clearing a delegation.

> ⚠️ **Disclaimer**: Provided "as is". Always verify transaction data in your wallet UI before confirming. The developers are not liable for losses due to misuse or compromised infrastructure.

---

## 🛠 Technical Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS 4.x |
| Wallet connection | RainbowKit 2.x + wagmi 2.x (address detection only) |
| EIP-7702 signing | viem 2.x (`signAuthorization`, `privateKeyToAccount`) |
| On-chain reads | viem `createPublicClient` (delegation scan) |
| Sponsored broadcast | viem `createWalletClient` (server-side, sponsor key) |
| Deployment | Vercel |

---

## 📁 Project Structure

```
EIP7702-revoker-WEB/
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout — RainbowKit + wagmi providers
│   │   ├── page.tsx                    # Landing page — wallet connect + RevokeSection
│   │   └── api/
│   │       ├── delegation/
│   │       │   └── route.ts            # GET  — reads on-chain EF0100 delegation code
│   │       └── revoke/
│   │           └── route.ts            # POST — sponsor broadcasts Type-4 revocation tx
│   ├── components/
│   │   └── RevokeSection.tsx           # Main UI: scan results, PK input, revoke/delegate tabs
│   └── utils/
│       ├── networks.ts                 # 18 supported chains (viem defineChain)
│       └── sign.ts                     # signAuthorizationWithPrivateKey (browser-only)
├── .env.example                        # SPONSOR_PRIVATE_KEY placeholder
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## ☁️ Deploying to Vercel

1. Push the repository to GitHub.
2. Import the project in [vercel.com/new](https://vercel.com/new).
3. In **Settings → Environment Variables**, add:

   ```
   SPONSOR_PRIVATE_KEY = 0xYOUR_KEY
   ```

4. Deploy. Vercel auto-detects Next.js; no additional configuration required.

> Fund the sponsor wallet on each chain you want to support before going live. Gas costs per revocation are minimal (< $0.01 on most L2s, ~$1–2 on Ethereum mainnet at normal fees).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'feat: describe your change'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

**Guidelines**: follow TypeScript strict mode, fix all ESLint warnings, test on testnets (Sepolia / Base Sepolia) before touching mainnet flows, document any new EIP-7702 logic.

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

## 🙏 Acknowledgements

- [Ethereum Foundation](https://ethereum.org) for EIP-7702
- [viem](https://viem.sh) for type-safe EIP-7702 signing primitives
- [RainbowKit](https://rainbowkit.com) & [wagmi](https://wagmi.sh) for wallet connection UX

---

> 🐛 **Issues**: [GitHub Issues](https://github.com/Serge693/EIP7702-revoker-WEB/issues)
> 💬 **Discussions**: [GitHub Discussions](https://github.com/Serge693/EIP7702-revoker-WEB/discussions)

*Built for the Ethereum community — secure your delegations, protect your assets.* 🔐
