# 🧪 FinRizz Frontend Testing Guide

## 🚀 Quick Start Testing

### Step 1: Setup Frontend Environment

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id" > .env.local
echo "VITE_CONTRACT_ADDRESS=0x5FaADBd9203Bc599B71bb789BD59ca9127a87caC" >> .env.local

# Start development server
npm run dev
```

### Step 2: Setup MetaMask for 0G Galileo Testnet

**Add 0G Galileo Testnet to MetaMask:**
1. Open MetaMask
2. Click Networks dropdown → "Add Network"
3. Add Custom Network:
   - **Network Name**: 0G Galileo Testnet
   - **RPC URL**: `https://evmrpc-testnet.0g.ai`
   - **Chain ID**: `16602`
   - **Currency Symbol**: `0G`
   - **Block Explorer**: `https://chainscan-galileo.0g.ai`

**Get Test Tokens:**
- Visit: https://faucet.0g.ai
- Connect your wallet
- Request 0G test tokens

---

## 🔧 Testing Scenarios

### Test 1: Basic Payment Page
**URL**: `http://localhost:5173/payment?userId=123456789`

**Expected Result:**
- ✅ Payment page loads
- ✅ "Connect Wallet" button visible
- ✅ Credit packages displayed (10, 50, 100 credits)
- ✅ Prices shown (0.001, 0.0045, 0.008 0G)

### Test 2: Wallet Connection
**Steps:**
1. Click "Connect Wallet"
2. Select MetaMask
3. Switch to 0G Galileo Testnet if prompted
4. Approve connection

**Expected Result:**
- ✅ Wallet connects successfully
- ✅ Address displayed
- ✅ Network shows "0G Galileo Testnet"
- ✅ Balance visible

### Test 3: Credit Purchase Flow
**Steps:**
1. Ensure wallet connected with 0G tokens
2. Click "Buy 10 Credits" (0.001 0G)
3. Confirm transaction in MetaMask
4. Wait for confirmation

**Expected Result:**
- ✅ Transaction prompt appears
- ✅ Correct amount (0.001 0G) shown  
- ✅ Transaction submits successfully
- ✅ Success message displayed
- ✅ Transaction hash provided

---

## 🛠️ Development Testing

### Local Testing Setup

1. **Start Backend API** (optional for full testing):
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:3001
```

2. **Start Frontend**:
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

3. **Environment Variables**:
```bash
# frontend/.env.local
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
VITE_CONTRACT_ADDRESS=0x5FaADBd9203Bc599B71bb789BD59ca9127a87caC
```

### Testing Components Individually

#### PaymentModule Component
**File**: `src/components/PaymentModule.tsx`

**Test with different props:**
```tsx
// Test in browser console or create test page
<PaymentModule 
  telegramUserId="123456789"
  onPaymentSuccess={(credits) => console.log('Success!', credits)}
/>
```

#### Web3 Utilities
**File**: `src/lib/web3.ts`

**Test contract connection:**
```typescript
import { CONTRACT_ADDRESS, galileoTestnet, client } from './lib/web3';
import { getContract } from 'thirdweb';

// Test contract connection
const contract = getContract({
  client,
  address: CONTRACT_ADDRESS,
  chain: galileoTestnet,
});

// Test reading contract data
const balance = await contract.call("getCreditBalance", [123456789]);
console.log("User balance:", balance);
```

---

## 🧪 Step-by-Step Testing Process

### Phase 1: UI Testing
1. **Homepage** - `http://localhost:5173/`
   - ✅ Page loads without errors
   - ✅ Navigation works
   - ✅ Responsive design

2. **Payment Page** - `http://localhost:5173/payment?userId=test123`
   - ✅ Payment form displays
   - ✅ Credit packages visible
   - ✅ Pricing correct

### Phase 2: Wallet Integration Testing
1. **Connect Wallet**
   - ✅ MetaMask detection works
   - ✅ Network switching prompts
   - ✅ Account connection successful

2. **Network Validation**
   - ✅ Correct chain ID (16602)
   - ✅ RPC connection working
   - ✅ Balance retrieval

### Phase 3: Smart Contract Testing
1. **Contract Reading**
   - ✅ Get available packages
   - ✅ Check user balance
   - ✅ View contract stats

2. **Contract Writing**
   - ✅ Purchase credits transaction
   - ✅ Transaction confirmation
   - ✅ Event emission

### Phase 4: Full Payment Flow
1. **Start to Finish**
   - ✅ User lands on payment page
   - ✅ Connects wallet
   - ✅ Selects credit package
   - ✅ Completes payment
   - ✅ Receives confirmation
   - ✅ Returns to Telegram (simulated)

---

## 🔍 Debugging Tools

### Browser Console Testing
```javascript
// Check if Thirdweb is loaded
console.log(window.thirdweb);

// Check contract address
console.log("Contract:", "0x5FaADBd9203Bc599B71bb789BD59ca9127a87caC");

// Test Web3 connection
ethereum.request({ method: 'eth_chainId' }).then(console.log);
```

### Network Inspector
- **Check API calls** to backend
- **Monitor transaction hashes**
- **Verify contract interactions**

### MetaMask Testing
- **Activity tab** - View transaction history
- **Account details** - Check network and balance
- **Settings** - Reset account if needed

---

## 📱 Mobile Testing

### Responsive Design
- **Mobile browsers** - Chrome, Safari
- **Tablet view** - iPad, Android tablets
- **Desktop** - Various screen sizes

### Mobile Wallet Testing
- **MetaMask Mobile** - Connect via WalletConnect
- **Trust Wallet** - Alternative mobile wallet
- **Browser wallet** - In-app browsers

---

## 🚨 Common Issues & Solutions

### Issue 1: "Network not supported"
**Solution:**
```javascript
// Add network switch prompt
if (chain?.id !== 16602) {
  await switchChain({ chainId: 16602 });
}
```

### Issue 2: "Insufficient funds"
**Solution:**
- Get more 0G tokens from faucet
- Check wallet balance
- Verify gas estimation

### Issue 3: "Transaction failed"
**Solution:**
- Check gas limit
- Verify contract address
- Ensure wallet has enough 0G

### Issue 4: "Contract not found"
**Solution:**
```javascript
// Verify contract address
console.log("Contract Address:", CONTRACT_ADDRESS);
// Should be: 0x5FaADBd9203Bc599B71bb789BD59ca9127a87caC
```

---

## 📊 Test Data

### Sample Test Users
```javascript
const testUsers = [
  { userId: "123456789", name: "Test User 1" },
  { userId: "987654321", name: "Test User 2" },
  { userId: "555666777", name: "Test User 3" },
];
```

### Test URLs
```
http://localhost:5173/payment?userId=123456789
http://localhost:5173/payment?userId=987654321&package=50
http://localhost:5173/payment?userId=555666777&package=100
```

### Expected Transaction Amounts
```
10 credits  = 0.001 0G  = 1000000000000000 wei
50 credits  = 0.0045 0G = 4500000000000000 wei  
100 credits = 0.008 0G  = 8000000000000000 wei
```

---

## ✅ Testing Checklist

### Pre-Testing Setup
- [ ] Frontend server running (`npm run dev`)
- [ ] MetaMask installed and configured
- [ ] 0G Galileo testnet added to MetaMask
- [ ] Test wallet funded with 0G tokens
- [ ] Environment variables configured

### UI/UX Testing  
- [ ] Payment page loads correctly
- [ ] Credit packages display properly
- [ ] Responsive design works on mobile
- [ ] Loading states and animations work
- [ ] Error messages are user-friendly

### Wallet Integration
- [ ] Wallet connection works
- [ ] Network switching prompts correctly  
- [ ] Account balance displays
- [ ] Transaction signing works
- [ ] Transaction confirmation shows

### Smart Contract Integration
- [ ] Contract address is correct
- [ ] Read operations work (balance, packages)
- [ ] Write operations work (purchase credits)
- [ ] Events are emitted correctly
- [ ] Transaction receipts are valid

### End-to-End Flow
- [ ] User can complete full payment
- [ ] Success state is handled
- [ ] Error states are handled
- [ ] Redirect back to Telegram works
- [ ] Payment verification works

---

## 🎯 Next Steps After Testing

1. **Deploy Frontend** to production (Vercel/Netlify)
2. **Deploy Backend API** for credit management
3. **Configure Telegram Bot** with frontend URLs
4. **Test full integration** with real Telegram users
5. **Monitor transactions** on 0G explorer

## 🔗 Quick Test URL
**Start testing immediately:**
```
http://localhost:5173/payment?userId=123456789
```

Your FinRizz payment system is ready for comprehensive frontend testing! 🚀