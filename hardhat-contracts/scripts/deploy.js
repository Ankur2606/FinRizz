import hre from "hardhat";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting FinRizz Credits Contract Deployment");
  console.log("📡 Network: 0G Galileo Testnet (Chain ID: 16602)");
  
  // Get the contract factory
  const FinRizzCredits = await hre.ethers.getContractFactory("FinRizzCredits");
  
  console.log("📝 Deploying FinRizzCredits contract...");
  
  // Deploy the contract
  const finrizzCredits = await FinRizzCredits.deploy();
  
  // Wait for deployment to be confirmed
  await finrizzCredits.waitForDeployment();
  
  const contractAddress = await finrizzCredits.getAddress();
  
  console.log("✅ Contract deployed successfully!");
  console.log("📄 Contract Address:", contractAddress);
  console.log("🔗 Explorer Link:", `https://chainscan-galileo.0g.ai/address/${contractAddress}`);
  
  // Test the contract by calling some view functions
  console.log("\n🧪 Testing contract deployment...");
  
  try {
    // Get available packages
    const packages = await finrizzCredits.getAvailablePackages();
    console.log("📦 Available Credit Packages:");
    console.log("   Credits:", packages[0].map(n => n.toString()));
    console.log("   Prices (wei):", packages[1].map(n => n.toString()));
    
    // Get contract stats
    const stats = await finrizzCredits.getContractStats();
    console.log("📊 Contract Stats:");
    console.log("   Total Credits Issued:", stats[0].toString());
    console.log("   Total Revenue (wei):", stats[1].toString());
    console.log("   Contract Balance (wei):", stats[2].toString());
    console.log("   Total Packages:", stats[3].toString());
    
  } catch (error) {
    console.log("⚠️  Contract test calls failed:", error.message);
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: "0G Galileo Testnet",
    chainId: 16602,
    contractAddress: contractAddress,
    blockNumber: finrizzCredits.deploymentTransaction()?.blockNumber,
    transactionHash: finrizzCredits.deploymentTransaction()?.hash,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
    explorerUrl: `https://chainscan-galileo.0g.ai/address/${contractAddress}`,
    gasUsed: finrizzCredits.deploymentTransaction()?.gasLimit?.toString(),
  };
  
  // Write deployment info to file
  const deploymentPath = path.join(__dirname, '../deployment-info.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n💾 Deployment info saved to:", deploymentPath);
  
  console.log("\n🎉 Deployment Complete!");
  console.log("Next steps:");
  console.log("1. Update your backend .env with CONTRACT_ADDRESS=" + contractAddress);
  console.log("2. Update your frontend with the new contract address");
  console.log("3. Fund your wallet with 0G tokens for gas fees");
  console.log("4. Test the payment flow end-to-end");
  
  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((deploymentInfo) => {
    console.log("\n✅ Deployment script completed successfully");
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
  });