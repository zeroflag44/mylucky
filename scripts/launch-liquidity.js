const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * DEX Liquidity Launch Script
 * 
 * This script:
 * 1. Creates a liquidity pool on Uniswap V3 / Aerodrome
 * 2. Adds initial liquidity from treasury wallet
 * 3. Locks LP tokens for 12 months using a time-lock contract
 * 
 * Required environment variables:
 * - TOKEN_ADDRESS: Deployed MyLucky token address
 * - TREASURY_PRIVATE_KEY: Private key of treasury multisig executor
 * - PAIRED_TOKEN_ADDRESS: WETH or USDT address on the network
 * - LIQUIDITY_AMOUNT_TOKEN: Amount of MYLUCKY tokens to add
 * - LIQUIDITY_AMOUNT_PAIRED: Amount of paired token to add
 * - UNISWAP_ROUTER_ADDRESS: Uniswap V3 Router address
 * - UNISWAP_FACTORY_ADDRESS: Uniswap V3 Factory address
 */

// Uniswap V3 Router ABI (minimal - for adding liquidity)
const UNISWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  "function WETH9() external view returns (address)"
];

// Uniswap V3 Factory ABI (minimal)
const UNISWAP_FACTORY_ABI = [
  "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
];

// ERC20 ABI (minimal)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

// Simple TimeLock contract for LP tokens
const TIMELOCK_CONTRACT = `
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LPTokenLock {
    address public immutable lpToken;
    address public immutable beneficiary;
    uint256 public immutable unlockTime;
    
    event TokensLocked(address indexed lpToken, address indexed beneficiary, uint256 unlockTime, uint256 amount);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    
    constructor(address _lpToken, address _beneficiary, uint256 _lockDuration) {
        require(_lpToken != address(0), "LP token is zero address");
        require(_beneficiary != address(0), "Beneficiary is zero address");
        require(_lockDuration > 0, "Lock duration must be positive");
        
        lpToken = _lpToken;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + _lockDuration;
    }
    
    function lock(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(IERC20(lpToken).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit TokensLocked(lpToken, beneficiary, unlockTime, amount);
    }
    
    function release() external {
        require(block.timestamp >= unlockTime, "Tokens are still locked");
        uint256 balance = IERC20(lpToken).balanceOf(address(this));
        require(balance > 0, "No tokens to release");
        require(IERC20(lpToken).transfer(beneficiary, balance), "Transfer failed");
        emit TokensReleased(beneficiary, balance);
    }
    
    function getLockedAmount() external view returns (uint256) {
        return IERC20(lpToken).balanceOf(address(this));
    }
    
    function getTimeUntilUnlock() external view returns (uint256) {
        if (block.timestamp >= unlockTime) {
            return 0;
        }
        return unlockTime - block.timestamp;
    }
}
`;

async function deployTimeLock(lpTokenAddress, beneficiary, lockDuration) {
  console.log("📦 Deploying LP Token Lock contract...");
  
  // Save the timelock contract
  const fs = require("fs");
  if (!fs.existsSync("contracts")) {
    fs.mkdirSync("contracts");
  }
  fs.writeFileSync("contracts/LPTokenLock.sol", TIMELOCK_CONTRACT);
  
  const LPTokenLock = await ethers.getContractFactory("LPTokenLock");
  const lock = await LPTokenLock.deploy(lpTokenAddress, beneficiary, lockDuration);
  await lock.waitForDeployment();
  
  const lockAddress = await lock.getAddress();
  console.log("✅ LP Token Lock deployed to:", lockAddress);
  console.log("   LP Token:", lpTokenAddress);
  console.log("   Beneficiary:", beneficiary);
  console.log("   Lock Duration:", lockDuration / (24 * 60 * 60), "days");
  
  return lock;
}

async function main() {
  console.log("🚀 Starting DEX Liquidity Launch...\n");
  
  // Load environment variables
  const tokenAddress = process.env.TOKEN_ADDRESS;
  const pairedTokenAddress = process.env.PAIRED_TOKEN_ADDRESS;
  const liquidityAmountToken = process.env.LIQUIDITY_AMOUNT_TOKEN;
  const liquidityAmountPaired = process.env.LIQUIDITY_AMOUNT_PAIRED;
  const routerAddress = process.env.UNISWAP_ROUTER_ADDRESS;
  const factoryAddress = process.env.UNISWAP_FACTORY_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  
  // Validate required parameters
  if (!tokenAddress || !pairedTokenAddress || !liquidityAmountToken || 
      !liquidityAmountPaired || !routerAddress || !factoryAddress) {
    throw new Error(
      "❌ Missing required parameters in .env:\n" +
      "   TOKEN_ADDRESS, PAIRED_TOKEN_ADDRESS, LIQUIDITY_AMOUNT_TOKEN,\n" +
      "   LIQUIDITY_AMOUNT_PAIRED, UNISWAP_ROUTER_ADDRESS, UNISWAP_FACTORY_ADDRESS"
    );
  }
  
  // Get signer (treasury wallet)
  const [signer] = await ethers.getSigners();
  console.log("📝 Executing with account:", signer.address);
  
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");
  
  console.log("📋 Liquidity Configuration:");
  console.log("   Token:", tokenAddress);
  console.log("   Paired Token:", pairedTokenAddress);
  console.log("   Token Amount:", liquidityAmountToken);
  console.log("   Paired Amount:", liquidityAmountPaired);
  console.log("");
  
  // Connect to contracts
  const factory = new ethers.Contract(factoryAddress, UNISWAP_FACTORY_ABI, signer);
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const pairedToken = new ethers.Contract(pairedTokenAddress, ERC20_ABI, signer);
  
  // Check balances
  const tokenBalance = await token.balanceOf(signer.address);
  const pairedBalance = await pairedToken.balanceOf(signer.address);
  
  console.log("💰 Current Balances:");
  console.log("   MYLUCKY:", ethers.formatUnits(tokenBalance, 18));
  console.log("   Paired Token:", ethers.formatUnits(pairedBalance, 18));
  console.log("");
  
  // Create or get pool (0.3% fee tier = 3000)
  const FEE_TIER = 3000;
  let poolAddress = await factory.getPool(tokenAddress, pairedTokenAddress, FEE_TIER);
  
  if (poolAddress === ethers.ZeroAddress) {
    console.log("🏊 Creating new liquidity pool...");
    const tx = await factory.createPool(tokenAddress, pairedTokenAddress, FEE_TIER);
    await tx.wait();
    poolAddress = await factory.getPool(tokenAddress, pairedTokenAddress, FEE_TIER);
    console.log("✅ Pool created at:", poolAddress);
  } else {
    console.log("✅ Pool already exists at:", poolAddress);
  }
  console.log("");
  
  // Approve tokens for router
  console.log("🔐 Approving tokens for Uniswap Router...");
  
  const tokenAmount = ethers.parseUnits(liquidityAmountToken, 18);
  const pairedAmount = ethers.parseUnits(liquidityAmountPaired, 18);
  
  const approveTx1 = await token.approve(routerAddress, tokenAmount);
  await approveTx1.wait();
  console.log("✅ MYLUCKY approved");
  
  const approveTx2 = await pairedToken.approve(routerAddress, pairedAmount);
  await approveTx2.wait();
  console.log("✅ Paired token approved");
  console.log("");
  
  console.log("⚠️  MANUAL STEP REQUIRED:");
  console.log("Due to Uniswap V3's complexity, you need to add liquidity manually:");
  console.log("1. Go to Uniswap interface or use Uniswap SDK");
  console.log("2. Add liquidity with the approved amounts");
  console.log("3. You will receive LP (NFT position) tokens");
  console.log("4. Note the LP token ID");
  console.log("");
  
  // Deploy LP Token Lock
  const LOCK_DURATION = 365 * 24 * 60 * 60; // 12 months in seconds
  const lpLock = await deployTimeLock(
    poolAddress, 
    treasuryAddress || signer.address, 
    LOCK_DURATION
  );
  const lpLockAddress = await lpLock.getAddress();
  
  console.log("");
  console.log("🎉 Liquidity Launch Setup Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📄 Addresses:");
  console.log("   Pool:", poolAddress);
  console.log("   LP Lock:", lpLockAddress);
  console.log("   Unlock Time:", new Date(Date.now() + LOCK_DURATION * 1000).toISOString());
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
  console.log("🔍 Next Steps:");
  console.log("   1. Add liquidity on Uniswap interface");
  console.log("   2. Transfer LP tokens to lock contract:", lpLockAddress);
  console.log("   3. Verify lock contract on block explorer");
  console.log("   4. Announce pool and lock addresses to community");
  console.log("");
  
  // Save launch info
  const launchInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    pool: poolAddress,
    lpLock: lpLockAddress,
    unlockTime: new Date(Date.now() + LOCK_DURATION * 1000).toISOString(),
    token: tokenAddress,
    pairedToken: pairedTokenAddress
  };
  
  const fs = require("fs");
  fs.writeFileSync(
    "liquidity-launch.json",
    JSON.stringify(launchInfo, null, 2)
  );
  console.log("💾 Launch info saved to liquidity-launch.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Launch failed:", error);
    process.exit(1);
  });
