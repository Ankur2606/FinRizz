// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FinRizzCredits
 * @dev Smart contract for managing FinRizz premium credits on 0G Galileo Testnet
 */
contract FinRizzCredits is Ownable, ReentrancyGuard {
    
    // Events
    event CreditsPurchased(address indexed buyer, uint256 telegramUserId, uint256 credits, uint256 amount);
    event CreditsConsumed(uint256 indexed telegramUserId, uint256 credits);
    event PriceUpdated(uint256 creditsAmount, uint256 newPrice);
    event WithdrawalMade(address indexed owner, uint256 amount);
    
    // State variables
    mapping(uint256 => uint256) public userCredits; // telegramUserId => credits balance
    mapping(uint256 => uint256) public creditPrices; // credits amount => price in wei
    
    uint256 public totalCreditsIssued;
    uint256 public totalRevenue;
    
    // Credit packages configuration
    struct CreditPackage {
        uint256 credits;
        uint256 priceInWei;
        bool active;
    }
    
    mapping(uint256 => CreditPackage) public creditPackages;
    uint256[] public availablePackages;
    
    constructor() Ownable(msg.sender) {
        // Initialize default credit packages
        _addCreditPackage(10, 0.001 ether);   // 10 credits for 0.001 0G
        _addCreditPackage(50, 0.0045 ether);  // 50 credits for 0.0045 0G (10% discount)
        _addCreditPackage(100, 0.008 ether);  // 100 credits for 0.008 0G (20% discount)
    }
    
    /**
     * @dev Purchase credits for a Telegram user
     * @param telegramUserId The Telegram user ID
     * @param creditsAmount Number of credits to purchase
     */
    function purchaseCredits(uint256 telegramUserId, uint256 creditsAmount) 
        external 
        payable 
        nonReentrant 
    {
        require(telegramUserId > 0, "Invalid Telegram user ID");
        require(creditsAmount > 0, "Credits amount must be greater than 0");
        
        // Check if it's a predefined package or custom amount
        uint256 requiredPayment;
        
        if (creditPackages[creditsAmount].active) {
            // Use package price
            requiredPayment = creditPackages[creditsAmount].priceInWei;
        } else {
            // Calculate custom price (base rate: 0.0001 0G per credit)
            requiredPayment = creditsAmount * 0.0001 ether;
        }
        
        require(msg.value >= requiredPayment, "Insufficient payment");
        
        // Add credits to user balance
        userCredits[telegramUserId] += creditsAmount;
        totalCreditsIssued += creditsAmount;
        totalRevenue += msg.value;
        
        // Refund excess payment
        if (msg.value > requiredPayment) {
            payable(msg.sender).transfer(msg.value - requiredPayment);
        }
        
        emit CreditsPurchased(msg.sender, telegramUserId, creditsAmount, requiredPayment);
    }
    
    /**
     * @dev Consume credits for a user (only owner can call this)
     * @param telegramUserId The Telegram user ID
     * @param creditsToConsume Number of credits to consume
     */
    function consumeCredits(uint256 telegramUserId, uint256 creditsToConsume) 
        external 
        onlyOwner 
    {
        require(telegramUserId > 0, "Invalid Telegram user ID");
        require(creditsToConsume > 0, "Credits amount must be greater than 0");
        require(userCredits[telegramUserId] >= creditsToConsume, "Insufficient credits");
        
        userCredits[telegramUserId] -= creditsToConsume;
        
        emit CreditsConsumed(telegramUserId, creditsToConsume);
    }
    
    /**
     * @dev Get credit balance for a user
     * @param telegramUserId The Telegram user ID
     * @return The credit balance
     */
    function getCreditBalance(uint256 telegramUserId) external view returns (uint256) {
        return userCredits[telegramUserId];
    }
    
    /**
     * @dev Add a new credit package (only owner)
     * @param credits Number of credits in the package
     * @param priceInWei Price in wei
     */
    function addCreditPackage(uint256 credits, uint256 priceInWei) 
        external 
        onlyOwner 
    {
        _addCreditPackage(credits, priceInWei);
    }
    
    /**
     * @dev Internal function to add credit package
     */
    function _addCreditPackage(uint256 credits, uint256 priceInWei) internal {
        require(credits > 0, "Credits must be greater than 0");
        require(priceInWei > 0, "Price must be greater than 0");
        
        if (!creditPackages[credits].active) {
            availablePackages.push(credits);
        }
        
        creditPackages[credits] = CreditPackage({
            credits: credits,
            priceInWei: priceInWei,
            active: true
        });
        
        emit PriceUpdated(credits, priceInWei);
    }
    
    /**
     * @dev Update price for a credit package (only owner)
     * @param credits Number of credits in the package
     * @param newPriceInWei New price in wei
     */
    function updateCreditPackagePrice(uint256 credits, uint256 newPriceInWei) 
        external 
        onlyOwner 
    {
        require(creditPackages[credits].active, "Package does not exist");
        require(newPriceInWei > 0, "Price must be greater than 0");
        
        creditPackages[credits].priceInWei = newPriceInWei;
        
        emit PriceUpdated(credits, newPriceInWei);
    }
    
    /**
     * @dev Deactivate a credit package (only owner)
     * @param credits Number of credits in the package to deactivate
     */
    function deactivateCreditPackage(uint256 credits) external onlyOwner {
        require(creditPackages[credits].active, "Package does not exist");
        
        creditPackages[credits].active = false;
        
        // Remove from available packages array
        for (uint256 i = 0; i < availablePackages.length; i++) {
            if (availablePackages[i] == credits) {
                availablePackages[i] = availablePackages[availablePackages.length - 1];
                availablePackages.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Get all available credit packages
     * @return Array of available credit amounts and their prices
     */
    function getAvailablePackages() 
        external 
        view 
        returns (uint256[] memory, uint256[] memory) 
    {
        uint256[] memory credits = new uint256[](availablePackages.length);
        uint256[] memory prices = new uint256[](availablePackages.length);
        
        for (uint256 i = 0; i < availablePackages.length; i++) {
            uint256 creditAmount = availablePackages[i];
            credits[i] = creditAmount;
            prices[i] = creditPackages[creditAmount].priceInWei;
        }
        
        return (credits, prices);
    }
    
    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner()).transfer(balance);
        
        emit WithdrawalMade(owner(), balance);
    }
    
    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Get contract stats
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 _totalCreditsIssued,
            uint256 _totalRevenue,
            uint256 _contractBalance,
            uint256 _totalPackages
        ) 
    {
        return (
            totalCreditsIssued,
            totalRevenue,
            address(this).balance,
            availablePackages.length
        );
    }
    
    /**
     * @dev Fallback function to reject direct Ether transfers
     */
    receive() external payable {
        revert("Use purchaseCredits function");
    }
}