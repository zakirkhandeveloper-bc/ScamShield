# 🛡️ ScamShield

**A security guard for crypto users that warns you *before* you sign a malicious transaction.**

ScamShield is a browser extension + dashboard that protects Web3 users from wallet drainers, malicious token approvals, phishing websites and scam contracts.

> 🚧 Work in progress — currently building the MVP on the **Sepolia testnet**.

## ✨ Features (MVP)

- **Transaction simulation:** see exactly which assets leave your wallet before you sign
- **Approval detection:** flags unlimited `approve` / `setApprovalForAll` requests
- **Approval dashboard:** view all active token approvals and revoke them in one click
- **Phishing check:** detects known scam domains and lookalike websites
- **Contract scanner:** verified source, contract age, owner privileges (`mint`, `blacklist`, `pause`)

## 🧱 Architecture

```
Browser Extension (MV3)  ──▶  Node.js Risk Engine  ──▶  Sepolia RPC / Etherscan / Anvil fork
React Dashboard          ──▶
Solidity demo contracts (Foundry): fake drainer + scam token, used for live demos
```

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Smart contracts | Solidity, Foundry |
| Backend | Node.js, Express, ethers.js |
| Simulation | Anvil (Sepolia fork) |
| Extension | Chrome Manifest V3 |
| Dashboard | React + Vite |
| Data | Etherscan API, Alchemy RPC |

## 📚 Learning Notes

This project is also a learning journey across three areas:
- 🔗 **Blockchain Security**
- 🌐 **Web Security**
- 🛡️ **Cyber Security**

Hands-on lessons are in the [`learning/`](./learning) folder.

## ⚠️ Disclaimer

The drainer and scam contracts in this repo are **for education and testing on testnets only**.
