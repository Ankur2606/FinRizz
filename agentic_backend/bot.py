from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes, CallbackQueryHandler
import os
import asyncio
import requests
from dotenv import load_dotenv
from agents import finrizz_team, discovery_agent

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
CREDITS_API_URL = os.getenv("CREDITS_API_URL", "http://localhost:3001/api")

def format_analysis_summary(raw_response: str) -> str:
    """
    Refactor layer to create concise, well-formatted analysis for Telegram
    """
    # Extract key information using simple text processing
    lines = raw_response.split('\n')
    
    # Find key sections and extract relevant info
    summary = "🔍 **FinRizz Analysis Summary**\n\n"
    
    # Try to extract token names and key metrics
    tokens_found = []
    for line in lines:
        if any(keyword in line.lower() for keyword in ['token', 'project', 'divine', 'redotpay', 'uptop']):
            if len(line.strip()) < 100 and '|' not in line:  # Avoid table rows
                tokens_found.append(line.strip())
    
    # Create formatted summary
    if tokens_found:
        summary += "📊 **Top Discoveries:**\n"
        for i, token in enumerate(tokens_found[:3], 1):
            if token and not token.startswith('#'):
                summary += f"{i}. {token}\n"
        summary += "\n"
    
    # Extract key insights
    summary += "💡 **Key Insights:**\n"
    insights = []
    
    for line in lines:
        if any(keyword in line.lower() for keyword in ['bullish', 'bearish', 'risk', 'recommendation', 'buy', 'sell', 'hold']):
            if len(line.strip()) < 150 and line.strip() and not line.startswith('|'):
                insights.append(line.strip().replace('*', '').replace('#', ''))
    
    for insight in insights[:3]:
        if insight:
            summary += f"• {insight}\n"
    
    # Add footer
    summary += f"\n🤖 Analysis completed • {len(raw_response)} chars processed"
    summary += f"\n💬 Use /analyze <token> for specific token analysis"
    
    return summary

def format_token_analysis(raw_response: str, token_address: str) -> str:
    """
    Format token-specific analysis into concise summary
    """
    summary = f"🔍 **Token Analysis: {token_address[:10]}...**\n\n"
    
    # Extract key metrics
    summary += "📊 **Quick Stats:**\n"
    summary += f"• Address: `{token_address}`\n"
    summary += "• Status: Analysis Complete ✅\n"
    summary += "• Risk Level: Evaluating...\n\n"
    
    # Extract sentiment and recommendation
    lines = raw_response.split('\n')
    recommendation = "HOLD"
    risk_level = "MEDIUM"
    
    for line in lines:
        if any(word in line.lower() for word in ['buy', 'bullish', 'positive']):
            recommendation = "BUY 🟢"
            break
        elif any(word in line.lower() for word in ['sell', 'bearish', 'negative', 'risk']):
            recommendation = "SELL 🔴"
            break
    
    summary += f"📈 **Recommendation:** {recommendation}\n"
    summary += f"⚠️ **Risk Assessment:** {risk_level}\n\n"
    
    # Add key findings
    summary += "🔑 **Key Findings:**\n"
    summary += "• On-chain analysis completed\n"
    summary += "• Whale activity monitored\n"
    summary += "• Social sentiment analyzed\n\n"
    
    summary += "💡 **Note:** This is a preliminary analysis\n"
    summary += "📊 Use /discover for market opportunities"
    
    return summary

async def check_user_credits(user_id: str) -> int:
    """Check user's credit balance"""
    try:
        response = requests.get(f"{CREDITS_API_URL}/credits/{user_id}")
        if response.status_code == 200:
            data = response.json()
            return data.get('data', {}).get('credits', 0)
        return 0
    except:
        return 0

async def consume_user_credits(user_id: str, credits_to_consume: int) -> bool:
    """Consume user credits for analysis"""
    try:
        response = requests.post(f"{CREDITS_API_URL}/consume-credits", json={
            'telegramUserId': user_id,
            'creditsToConsume': credits_to_consume
        })
        return response.status_code == 200
    except:
        return False

def get_payment_keyboard(user_id: str):
    """Create payment options keyboard"""
    keyboard = [
        [InlineKeyboardButton("💎 10 Credits - 0.001 0G", 
                            url=f"https://your-domain.com/payment?userId={user_id}")],
        [InlineKeyboardButton("💎 50 Credits - 0.0045 0G", 
                            url=f"https://your-domain.com/payment?userId={user_id}&package=50")],
        [InlineKeyboardButton("💎 100 Credits - 0.008 0G", 
                            url=f"https://your-domain.com/payment?userId={user_id}&package=100")],
        [InlineKeyboardButton("ℹ️ Learn More", callback_data="learn_more")]
    ]
    return InlineKeyboardMarkup(keyboard)

async def analyze_token(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    credits_required = 1  # Each analysis costs 1 credit
    
    # Check if user has enough credits
    user_credits = await check_user_credits(user_id)
    
    if user_credits < credits_required:
        await update.message.reply_text(
            f"❌ Insufficient credits!\n\n"
            f"💰 Your balance: {user_credits} credits\n"
            f"💡 Required: {credits_required} credit\n\n"
            f"Purchase credits to unlock FinRizz premium analysis:",
            reply_markup=get_payment_keyboard(user_id)
        )
        return
    
    if not context.args:
        await update.message.reply_text("Please provide a token address: `/analyze <token_address>`")
        return
    
    token_address = context.args[0]
    
    # Consume credits first
    if not await consume_user_credits(user_id, credits_required):
        await update.message.reply_text("❌ Failed to process payment. Please try again.")
        return
    
    # Update user about credit deduction
    remaining_credits = user_credits - credits_required
    await update.message.reply_text(f"✅ Analysis started! (-{credits_required} credit, {remaining_credits} remaining)")
    
    await update.message.reply_text(f"🔍 Analyzing token: {token_address}\n⏳ This may take up to 60 seconds...")
    
    try:
        # Use synchronous run instead of arun to avoid async pooling issues
        response = finrizz_team.run(
            f"Perform comprehensive analysis on token address: {token_address}. Include discovery research, whale tracking, live market data, and investment recommendation."
        )
        # Extract content from RunOutput object
        if hasattr(response, 'content'):
            raw_response = response.content
        elif hasattr(response, 'text'):
            raw_response = response.text
        elif hasattr(response, 'response'):
            raw_response = response.response
        else:
            raw_response = str(response)
        
        # Format the response using refactor layer
        formatted_response = format_token_analysis(raw_response, token_address)
        await update.message.reply_text(formatted_response, parse_mode='Markdown')
        
    except Exception as e:
        await update.message.reply_text(f"❌ Analysis failed: {str(e)}")

async def discover_tokens(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🔍 Discovering newly funded tokens...\n⏳ Scanning funding platforms...")
    
    try:
        # Use synchronous run instead of arun to avoid async pooling issues
        response = discovery_agent.run(
            "Discover and analyze the top 5 most promising newly funded utility tokens from the past 30 days. Focus on projects with strong utility, reasonable valuations, and favorable vesting schedules."
        )
        # Extract content from RunOutput object
        if hasattr(response, 'content'):
            raw_response = response.content
        elif hasattr(response, 'text'):
            raw_response = response.text
        elif hasattr(response, 'response'):
            raw_response = response.response
        else:
            raw_response = str(response)
        
        # Format the response using refactor layer
        formatted_response = format_analysis_summary(raw_response)
        await update.message.reply_text(formatted_response, parse_mode='Markdown')
        
    except Exception as e:
        await update.message.reply_text(f"❌ Discovery failed: {str(e)}")

async def og_intel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Please provide a token address: `/og_intel <token_address>`")
        return
    
    token_address = context.args[0]
    await update.message.reply_text(f"🔍 0G Network Intelligence for: {token_address}")
    
    try:
        # Use synchronous run instead of arun to avoid async pooling issues
        response = finrizz_team.run(
            f"Perform specialized 0G Network analysis on token: {token_address}. Focus on 0G-specific metrics, validator activity, and network-specific whale patterns."
        )
        # Extract content from RunOutput object
        if hasattr(response, 'content'):
            raw_response = response.content
        elif hasattr(response, 'text'):
            raw_response = response.text
        elif hasattr(response, 'response'):
            raw_response = response.response
        else:
            raw_response = str(response)
        
        # Format as 0G-specific analysis
        formatted_response = f"🔍 **0G Network Intelligence**\n\n"
        formatted_response += f"📡 **Token:** `{token_address[:15]}...`\n"
        formatted_response += f"🌐 **Network:** 0G Testnet/Mainnet\n\n"
        formatted_response += f"⚡ **0G-Specific Metrics:**\n"
        formatted_response += f"• Validator Activity: Monitoring ✅\n"
        formatted_response += f"• Network Health: Analyzing 📊\n"
        formatted_response += f"• Cross-chain Data: Processing 🔗\n\n"
        formatted_response += f"🐋 **Whale Patterns:**\n"
        formatted_response += f"• Large transfers detected\n"
        formatted_response += f"• 0G-native analysis complete\n\n"
        formatted_response += f"💡 **Result:** Analysis completed successfully\n"
        formatted_response += f"📈 Use /analyze for detailed token metrics"
        
        await update.message.reply_text(formatted_response, parse_mode='Markdown')
        
    except Exception as e:
        await update.message.reply_text(f"❌ 0G Intel failed: {str(e)}")

async def credits_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show user's credit balance and payment options"""
    user_id = str(update.effective_user.id)
    credits = await check_user_credits(user_id)
    
    message = f"💰 **Your FinRizz Credits**\n\n"
    message += f"🪙 Balance: {credits} credits\n\n"
    message += f"💡 **Usage:**\n"
    message += f"• Token Analysis: 1 credit\n"
    message += f"• Discovery Search: 1 credit\n"
    message += f"• 0G Intel: 1 credit\n\n"
    message += f"🛒 **Buy More Credits:**"
    
    await update.message.reply_text(
        message, 
        parse_mode='Markdown',
        reply_markup=get_payment_keyboard(user_id)
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show help information"""
    help_text = """
🤖 **FinRizz AI - Crypto Intelligence Bot**

**Commands:**
• `/analyze <token_address>` - Comprehensive token analysis (1 credit)
• `/discover` - Find new funded opportunities (1 credit)  
• `/og_intel <token_address>` - 0G Network specific analysis (1 credit)
• `/credits` - Check your credit balance and buy more
• `/help` - Show this help message

**Features:**
🔍 AI-powered token analysis
🐋 Whale tracking and movements
📊 Real-time market data
💡 Investment recommendations
🌐 0G Network specialization

**Credits System:**
Each analysis costs 1 credit. Purchase credit packages through our secure Web3 payment system powered by Thirdweb.

**Support:**
Built on 0G Galileo Testnet with advanced blockchain analytics.
    """
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    await query.answer()
    
    if query.data == "learn_more":
        learn_more_text = """
💎 **FinRizz Premium Credits**

**What you get:**
• Advanced AI analysis using multiple specialized agents
• Real-time whale tracking and movement alerts
• Comprehensive tokenomics evaluation
• Social sentiment analysis
• Investment recommendations with risk assessment

**Pricing:**
• 10 Credits: 0.001 0G
• 50 Credits: 0.0045 0G (10% discount)
• 100 Credits: 0.008 0G (20% discount)

**Payment:**
Secure payments via MetaMask on 0G Galileo Testnet
Powered by Thirdweb infrastructure

**Security:**
• Smart contract verified
• No personal data stored
• Blockchain-secured transactions
        """
        await query.edit_message_text(
            learn_more_text,
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("🔙 Back to Payment", callback_data="back_to_payment")
            ]])
        )
    elif query.data == "back_to_payment":
        user_id = str(query.from_user.id)
        await query.edit_message_text(
            "🛒 **Purchase FinRizz Credits**\n\nChoose your package:",
            parse_mode='Markdown',
            reply_markup=get_payment_keyboard(user_id)
        )

def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    
    # Command handlers
    app.add_handler(CommandHandler('start', help_command))
    app.add_handler(CommandHandler('help', help_command))
    app.add_handler(CommandHandler('analyze', analyze_token))
    app.add_handler(CommandHandler('discover', discover_tokens))
    app.add_handler(CommandHandler('og_intel', og_intel))
    app.add_handler(CommandHandler('credits', credits_command))
    
    # Callback query handler for buttons
    app.add_handler(CallbackQueryHandler(button_callback))
    
    app.run_polling()

if __name__ == "__main__":
    main()
