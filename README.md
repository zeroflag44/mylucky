# MYLUCKY Token 🍀

**A secure, audit-ready ERC-20 token ecosystem designed for fair launch on DEX platforms.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.x-yellow.svg)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.x-green.svg)](https://openzeppelin.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

## 🎯 Project Overview

MYLUCKY is a fixed-supply ERC-20 token built with security and transparency as top priorities. The ecosystem includes:

- **Fixed Supply Token**: 1,000,000,000 MYLUCKY tokens (no mint, no burn)
- **Vesting Contract**: 6-month cliff + 24-month linear vesting for founder allocation
- **LP Lock Mechanism**: 12-month liquidity lock for DEX launch
- **Zero Admin Control**: No owner, no privileged functions, no hidden controls

### Core Principles

✅ **Security > Hype**  
✅ **Transparency > Flexibility**  
✅ **Zero Hidden Control**

## 📊 Token Distribution

| Allocation | Percentage | Amount | Description |
|------------|-----------|---------|-------------|
| Treasury | 70% | 700,000,000 | Gnosis Safe multisig (3/5) for operations, marketing, CEX listings |
| Founder | 15% | 150,000,000 | Vested over 30 months (6-month cliff + 24-month linear) |
| Community | 15% | 150,000,000 | Liquidity provision and community rewards |

## 🏗️ Architecture

### Smart Contracts

#### 1. MyLucky.sol
- **Type**: ERC-20 Token
- **Supply**: 1,000,000,000 (fixed)
- **Decimals**: 18
- **Features**:
  - No mint function (fixed supply)
  - No burn function
  - No admin/owner
  - No upgrade mechanism
  - No transfer taxes
  - Immutable distribution addresses

#### 2. TeamVesting.sol
- **Type**: Vesting Wallet (extends OpenZeppelin VestingWallet)
- **Schedule**:
  - Cliff Period: 6 months (no tokens released)
  - Vesting Period: 24 months linear release
  - Total Duration: 30 months
- **Features**:
  - Time-locked token release
  - Immutable beneficiary
  - Transparent on-chain schedule
  - No admin override

#### 3. LPTokenLock.sol
- **Type**: Time-Lock Contract
- **Duration**: 12 months
- **Purpose**: Lock liquidity pool tokens after DEX launch
- **Features**:
  - Immutable lock period
  - Transparent unlock timestamp
  - No early release mechanism

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/zeroflag44/mylucky.git
cd mylucky

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Configuration

Edit `.env` file with your deployment parameters:

```env
# Deployer wallet private key
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Network RPC URL (choose one: Base, Arbitrum, Polygon)
BASE_RPC_URL=https://mainnet.base.org

# Distribution addresses
TREASURY_ADDRESS=0x... # Gnosis Safe multisig
FOUNDER_ADDRESS=0x...   # Founder beneficiary
COMMUNITY_ADDRESS=0x... # Community reserve
```

### Compilation

```bash
# Compile contracts
npx hardhat compile
```

### Testing

```bash
# Run tests (create test files in test/ directory)
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Check coverage
npx hardhat coverage
```

## 📦 Deployment

### Step 1: Deploy Contracts

```bash
# Deploy to testnet (Sepolia)
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to mainnet (Base)
npx hardhat run scripts/deploy.js --network base

# Deploy to Arbitrum
npx hardhat run scripts/deploy.js --network arbitrum

# Deploy to Polygon
npx hardhat run scripts/deploy.js --network polygon
```

After deployment, save the contract addresses from the output.

### Step 2: Verify Contracts

```bash
# Verify on block explorer
npx hardhat verify --network base <TOKEN_ADDRESS> <TREASURY> <VESTING> <COMMUNITY>
npx hardhat verify --network base <VESTING_ADDRESS> <FOUNDER_ADDRESS>
```

### Step 3: Launch Liquidity

```bash
# Update .env with deployed addresses
TOKEN_ADDRESS=0x...
PAIRED_TOKEN_ADDRESS=0x... # WETH or USDT

# Run liquidity launch script
npx hardhat run scripts/launch-liquidity.js --network base
```

## 🔐 Security Features

### Contract Security

- ✅ **Fixed Compiler Version**: Solidity 0.8.24 (no caret)
- ✅ **OpenZeppelin Libraries**: Latest audited contracts
- ✅ **Address Validation**: All addresses checked against zero address
- ✅ **Immutable Variables**: Critical addresses stored as immutable
- ✅ **No Upgrades**: Contracts are not upgradeable (no proxy pattern)
- ✅ **No Owner**: No Ownable pattern, no privileged functions
- ✅ **Checks-Effects-Interactions**: Pattern enforced throughout

### Vesting Security

- ✅ **Time-Locked**: Tokens locked for 6-month cliff
- ✅ **Linear Release**: Gradual 24-month vesting after cliff
- ✅ **Immutable Schedule**: Cannot be modified after deployment
- ✅ **Transparent**: All parameters public and verifiable

### LP Lock Security

- ✅ **12-Month Lock**: Liquidity locked for 1 year
- ✅ **No Early Release**: No mechanism to unlock before time
- ✅ **Public Verification**: Lock period visible on-chain

## 🛡️ Audit Checklist

Before mainnet launch, ensure:

- [ ] Run static analysis with Slither
  ```bash
  slither contracts/
  ```
- [ ] Run static analysis with Mythril
  ```bash
  myth analyze contracts/MyLucky.sol
  ```
- [ ] Complete test coverage (>95%)
- [ ] Manual code review by team
- [ ] External security audit (recommended)
- [ ] Verify all contract addresses
- [ ] Test deployment on testnet
- [ ] Verify multisig setup (3/5 for treasury)
- [ ] Document all addresses publicly
- [ ] Prepare emergency contact information

## 📋 DEX Listing Guide

### Uniswap V3 Launch

1. **Create Pool**
   - Visit [Uniswap Interface](https://app.uniswap.org/)
   - Connect treasury wallet
   - Create new pool: MYLUCKY/WETH or MYLUCKY/USDT
   - Select 0.3% fee tier

2. **Add Liquidity**
   - Add initial liquidity from community allocation
   - Set price range (consider full range for fair launch)
   - Confirm transaction

3. **Lock LP Tokens**
   - Transfer LP tokens to LPTokenLock contract
   - Verify lock on block explorer
   - Announce lock address to community

4. **Announce Launch**
   - Tweet contract addresses
   - Post on community channels
   - Provide block explorer links

### Aerodrome (Base) Launch

Similar process for Aerodrome on Base network.

## 📄 Contract Addresses

After deployment, document addresses here:

### Mainnet (Update after deployment)

```
Network: [Base/Arbitrum/Polygon]
Token: 0x...
Vesting: 0x...
Treasury: 0x...
Community: 0x...
LP Lock: 0x...
Pool: 0x...
```

### Testnet

```
Network: Sepolia
Token: 0x...
Vesting: 0x...
```

## 🤝 Governance

- Treasury managed by 3/5 Gnosis Safe multisig
- Multisig controls:
  - Marketing budget
  - CEX listing applications
  - Community initiatives
  - LP management (after unlock)
- No control over:
  - Token supply
  - Transfer mechanics
  - Vesting schedule

## 📞 Support & Community

- **Website**: [Coming Soon]
- **Twitter**: [Coming Soon]
- **Discord**: [Coming Soon]
- **Telegram**: [Coming Soon]

## ⚠️ Disclaimer

This token is provided as-is. Always DYOR (Do Your Own Research) before investing. 
Cryptocurrency investments carry inherent risks. Never invest more than you can afford to lose.

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Hardhat for development framework
- The Ethereum community

---

**Built with ❤️ for a fair and transparent launch**
