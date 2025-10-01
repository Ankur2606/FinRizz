import express from 'express';
import cors from 'cors';
import { createThirdwebClient } from 'thirdweb';
import { prepareContractCall, sendTransaction, getContract, readContract } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { defineChain } from 'thirdweb/chains';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Thirdweb client
const client = createThirdwebClient({
  clientId: process.env.THIRDWEB_CLIENT_ID!,
});

// Define 0G Galileo testnet
const ogGalileoTestnet = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: {
    name: "0G",
    symbol: "0G",
    decimals: 18,
  },
  rpc: "https://evmrpc-testnet.0g.ai",
  blockExplorers: [
    {
      name: "0G Explorer",
      url: "https://chainscan-galileo.0g.ai",
    },
  ],
});

// Contract configuration (deployed on 0G Galileo Testnet)
const CONTRACT_ADDRESS = process.env.CREDITS_CONTRACT_ADDRESS || "0x5FaADBd9203Bc599B71bb789BD59ca9127a87caC";

interface PaymentRequest {
  telegramUserId: string;
  transactionHash: string;
  creditsAmount: number;
}

interface UserCredits {
  userId: string;
  credits: number;
  lastUpdated: Date;
}

// In-memory storage for demo (replace with PostgreSQL in production)
const userCreditsStore: Map<string, UserCredits> = new Map();

// Helper function to get user credits
async function getUserCredits(telegramUserId: string): Promise<number> {
  const userRecord = userCreditsStore.get(telegramUserId);
  return userRecord ? userRecord.credits : 0;
}

// Helper function to add credits to user
async function addUserCredits(telegramUserId: string, creditsToAdd: number): Promise<void> {
  const currentCredits = await getUserCredits(telegramUserId);
  const newCredits = currentCredits + creditsToAdd;
  
  userCreditsStore.set(telegramUserId, {
    userId: telegramUserId,
    credits: newCredits,
    lastUpdated: new Date(),
  });
  
  console.log(`Added ${creditsToAdd} credits to user ${telegramUserId}. Total: ${newCredits}`);
}

// Helper function to deduct credits from user
async function deductUserCredits(telegramUserId: string, creditsToDeduct: number): Promise<boolean> {
  const currentCredits = await getUserCredits(telegramUserId);
  
  if (currentCredits < creditsToDeduct) {
    return false; // Insufficient credits
  }
  
  const newCredits = currentCredits - creditsToDeduct;
  userCreditsStore.set(telegramUserId, {
    userId: telegramUserId,
    credits: newCredits,
    lastUpdated: new Date(),
  });
  
  console.log(`Deducted ${creditsToDeduct} credits from user ${telegramUserId}. Remaining: ${newCredits}`);
  return true;
}

// Endpoint to verify payment and add credits
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { telegramUserId, transactionHash, creditsAmount }: PaymentRequest = req.body;

    if (!telegramUserId || !transactionHash || !creditsAmount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // TODO: Verify transaction on blockchain
    // For now, we'll assume the payment is valid if transactionHash is provided
    
    // Add credits to user account
    await addUserCredits(telegramUserId, creditsAmount);
    
    const totalCredits = await getUserCredits(telegramUserId);

    res.json({
      success: true,
      data: {
        creditsAdded: creditsAmount,
        totalCredits: totalCredits,
        transactionHash: transactionHash,
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Payment verification failed' 
    });
  }
});

// Endpoint to check user credits
app.get('/api/credits/:telegramUserId', async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    const credits = await getUserCredits(telegramUserId);
    
    res.json({
      success: true,
      data: {
        userId: telegramUserId,
        credits: credits,
      }
    });

  } catch (error) {
    console.error('Credits check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve credits' 
    });
  }
});

// Endpoint to consume credits (called by bot when user requests analysis)
app.post('/api/consume-credits', async (req, res) => {
  try {
    const { telegramUserId, creditsToConsume } = req.body;

    if (!telegramUserId || !creditsToConsume) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const success = await deductUserCredits(telegramUserId, creditsToConsume);
    
    if (!success) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits',
        currentCredits: await getUserCredits(telegramUserId),
      });
    }

    const remainingCredits = await getUserCredits(telegramUserId);

    res.json({
      success: true,
      data: {
        creditsConsumed: creditsToConsume,
        remainingCredits: remainingCredits,
      }
    });

  } catch (error) {
    console.error('Credits consumption error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to consume credits' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    network: '0G Galileo Testnet',
    contractAddress: CONTRACT_ADDRESS,
  });
});

// Endpoint to get payment configuration
app.get('/api/payment-config', (req, res) => {
  res.json({
    success: true,
    data: {
      chainId: 16602,
      chainName: "0G Galileo Testnet",
      nativeCurrency: {
        name: "0G",
        symbol: "0G",
        decimals: 18,
      },
      rpcUrl: "https://evmrpc-testnet.0g.ai",
      blockExplorer: "https://chainscan-galileo.0g.ai",
      contractAddress: CONTRACT_ADDRESS,
      creditPackages: [
        {
          credits: 10,
          priceInOG: "0.001",
          priceInWei: "1000000000000000", // 0.001 OG in wei
        },
        {
          credits: 50,
          priceInOG: "0.0045",
          priceInWei: "4500000000000000", // 0.0045 OG in wei (10% discount)
        },
        {
          credits: 100,
          priceInOG: "0.008",
          priceInWei: "8000000000000000", // 0.008 OG in wei (20% discount)
        }
      ]
    }
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`FinRizz Credits API server running on port ${PORT}`);
  console.log(`Network: 0G Galileo Testnet (Chain ID: 16602)`);
  console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;