const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log('🚀 Starting FinRizz Credits Contract Deployment');
  console.log('📡 Network: 0G Galileo Testnet (Chain ID: 16602)');
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('👤 Deployer Address:', deployer.address);
  
  // Get deployer balance
  const balance = await deployer.getBalance();
  console.log('� Deployer Balance:', ethers.utils.formatEther(balance), '0G');
  
  if (balance.isZero()) {
    throw new Error('❌ Insufficient balance! Get 0G tokens from faucet: https://faucet.0g.ai');
  }
  
  console.log('📝 Deploying FinRizzCredits contract...');
  
  // Deploy the contract
  const FinRizzCredits = await ethers.getContractFactory("FinRizzCredits");
  const finRizzCredits = await FinRizzCredits.deploy({
    gasLimit: 8000000,
    gasPrice: ethers.utils.parseUnits('1', 'gwei')
  });
  
  console.log('⏳ Deployment transaction sent:', finRizzCredits.deployTransaction.hash);
  
  // Wait for deployment confirmation
  await finRizzCredits.deployed();
  
  console.log('✅ Contract deployed successfully!');
  console.log('📄 Contract Address:', finRizzCredits.address);
  console.log('🔗 Explorer Link:', `https://chainscan-newton.0g.ai/address/${finRizzCredits.address}`);
  
  // Test contract deployment
  console.log('🧪 Testing contract deployment...');
  
  try {
    // Test getting available packages
    const [credits, prices] = await finRizzCredits.getAvailablePackages();
    console.log('📦 Available Credit Packages:');
    for (let i = 0; i < credits.length; i++) {
      console.log(`   • ${credits[i]} credits for ${ethers.utils.formatEther(prices[i])} 0G`);
    }
    
    // Test contract stats
    const stats = await finRizzCredits.getContractStats();
    console.log('📊 Contract Stats:');
    console.log(`   • Total Credits Issued: ${stats[0]}`);
    console.log(`   • Total Revenue: ${ethers.utils.formatEther(stats[1])} 0G`);
    console.log(`   • Contract Balance: ${ethers.utils.formatEther(stats[2])} 0G`);
    console.log(`   • Available Packages: ${stats[3]}`);
    
  } catch (error) {
    console.log('⚠️ Contract test calls failed:', error.message);
  }
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: finRizzCredits.address,
    deploymentHash: finRizzCredits.deployTransaction.hash,
    network: '0G Galileo Testnet',
    chainId: 16602,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    explorerUrl: `https://chainscan-newton.0g.ai/address/${finRizzCredits.address}`,
    gasUsed: finRizzCredits.deployTransaction.gasLimit?.toString() || 'unknown',
    gasPrice: finRizzCredits.deployTransaction.gasPrice?.toString() || 'unknown'
  };
  
  // Save to file
  const deploymentPath = path.join(__dirname, '../deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log('💾 Deployment info saved to:', deploymentPath);
  
  // Update environment files
  const envFiles = [
    '../.env',
    '../backend/.env',
    '../.env.contracts'
  ];
  
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, envFile);
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add contract address
    if (envContent.includes('CREDITS_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /CREDITS_CONTRACT_ADDRESS=.*/,
        `CREDITS_CONTRACT_ADDRESS=${finRizzCredits.address}`
      );
    } else {
      envContent += `\nCREDITS_CONTRACT_ADDRESS=${finRizzCredits.address}\n`;
    }
    
    try {
      fs.writeFileSync(envPath, envContent);
      console.log('🔧 Updated environment file:', envFile);
    } catch (error) {
      console.log('⚠️ Could not update environment file:', envFile);
    }
  }
  
  console.log('\n🎉 Deployment Complete!');
  console.log('Next steps:');
  console.log('1. Update your backend API with the new contract address');
  console.log('2. Update your frontend with the new contract address');
  console.log('3. Test the payment flow end-to-end');
  console.log('4. Start your backend API: cd backend && npm start');
  console.log('5. Start your Telegram bot: cd agentic_backend && python bot.py');
  
  return {
    contractAddress: finRizzCredits.address,
    deploymentHash: finRizzCredits.deployTransaction.hash
  };
}

// Execute deployment
main()
  .then((result) => {
    console.log(`\n✅ Deployment successful: ${result.contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });