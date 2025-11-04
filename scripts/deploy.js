const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Deployment script for MYLUCKY token ecosystem
 * 
 * Deploys:
 * 1. TeamVesting contract for founder tokens
 * 2. MyLucky token with distribution to treasury, vesting, and community
 * 
 * Required environment variables:
 * - TREASURY_ADDRESS: Gnosis Safe multisig address (3/5)
 * - FOUNDER_ADDRESS: Beneficiary address for vesting tokens
 * - COMMUNITY_ADDRESS: Address for community reserve
 */

async function main() {
  console.log("🚀 Starting MYLUCKY Token Deployment...\n");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");
  
  // Validate required addresses from environment
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  const founderAddress = process.env.FOUNDER_ADDRESS;
  const communityAddress = process.env.COMMUNITY_ADDRESS;
  
  if (!treasuryAddress || !founderAddress || !communityAddress) {
    throw new Error(
      "❌ Missing required addresses in .env:\n" +
      "   TREASURY_ADDRESS, FOUNDER_ADDRESS, COMMUNITY_ADDRESS"
    );
  }
  
  // Validate addresses
  if (!ethers.isAddress(treasuryAddress)) {
    throw new Error("❌ Invalid TREASURY_ADDRESS");
  }
  if (!ethers.isAddress(founderAddress)) {
    throw new Error("❌ Invalid FOUNDER_ADDRESS");
  }
  if (!ethers.isAddress(communityAddress)) {
    throw new Error("❌ Invalid COMMUNITY_ADDRESS");
  }
  
  console.log("📋 Deployment Configuration:");
  console.log("   Treasury (70%):", treasuryAddress);
  console.log("   Founder (15%):", founderAddress);
  console.log("   Community (15%):", communityAddress);
  console.log("");
  
  // Step 1: Deploy TeamVesting contract
  console.log("📦 Deploying TeamVesting contract...");
  const TeamVesting = await ethers.getContractFactory("TeamVesting");
  const teamVesting = await TeamVesting.deploy(founderAddress);
  await teamVesting.waitForDeployment();
  
  const vestingAddress = await teamVesting.getAddress();
  console.log("✅ TeamVesting deployed to:", vestingAddress);
  
  // Get vesting details
  const vestingStatus = await teamVesting.getVestingStatus();
  const cliffEnd = await teamVesting.cliffEnd();
  const vestingEnd = await teamVesting.vestingEnd();
  
  console.log("   Beneficiary:", founderAddress);
  console.log("   Cliff End:", new Date(Number(cliffEnd) * 1000).toISOString());
  console.log("   Vesting End:", new Date(Number(vestingEnd) * 1000).toISOString());
  console.log("");
  
  // Step 2: Deploy MyLucky token
  console.log("📦 Deploying MyLucky token...");
  const MyLucky = await ethers.getContractFactory("MyLucky");
  const myLucky = await MyLucky.deploy(
    treasuryAddress,
    vestingAddress,
    communityAddress
  );
  await myLucky.waitForDeployment();
  
  const tokenAddress = await myLucky.getAddress();
  console.log("✅ MyLucky token deployed to:", tokenAddress);
  
  // Verify token details
  const name = await myLucky.name();
  const symbol = await myLucky.symbol();
  const decimals = await myLucky.decimals();
  const totalSupply = await myLucky.totalSupply();
  
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Total Supply:", ethers.formatUnits(totalSupply, 18), "MYLUCKY");
  console.log("");
  
  // Verify balances
  console.log("💰 Token Distribution:");
  const treasuryBalance = await myLucky.balanceOf(treasuryAddress);
  const vestingBalance = await myLucky.balanceOf(vestingAddress);
  const communityBalance = await myLucky.balanceOf(communityAddress);
  
  console.log("   Treasury:", ethers.formatUnits(treasuryBalance, 18), "MYLUCKY (70%)");
  console.log("   Vesting:", ethers.formatUnits(vestingBalance, 18), "MYLUCKY (15%)");
  console.log("   Community:", ethers.formatUnits(communityBalance, 18), "MYLUCKY (15%)");
  console.log("");
  
  // Summary
  console.log("🎉 Deployment Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📄 Contract Addresses (SAVE THESE!):");
  console.log("   MyLucky Token:", tokenAddress);
  console.log("   Team Vesting:", vestingAddress);
  console.log("   Treasury:", treasuryAddress);
  console.log("   Community:", communityAddress);
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
  console.log("🔍 Next Steps:");
  console.log("   1. Verify contracts on block explorer");
  console.log("   2. Set up DEX liquidity pool");
  console.log("   3. Lock LP tokens");
  console.log("   4. Update documentation with addresses");
  console.log("");
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      token: tokenAddress,
      vesting: vestingAddress,
      treasury: treasuryAddress,
      community: communityAddress,
      founder: founderAddress
    },
    distribution: {
      treasury: ethers.formatUnits(treasuryBalance, 18),
      vesting: ethers.formatUnits(vestingBalance, 18),
      community: ethers.formatUnits(communityBalance, 18)
    },
    vestingSchedule: {
      cliffEnd: new Date(Number(cliffEnd) * 1000).toISOString(),
      vestingEnd: new Date(Number(vestingEnd) * 1000).toISOString()
    }
  };
  
  console.log("💾 Deployment info saved to deployments.json");
  const fs = require("fs");
  fs.writeFileSync(
    "deployments.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
