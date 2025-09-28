from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
import os
import asyncio
from dotenv import load_dotenv
from agents import finrizz_team, discovery_agent

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")

async def analyze_token(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Please provide a token address: `/analyze <token_address>`")
        return
    
    token_address = context.args[0]
    await update.message.reply_text(f"🔍 Analyzing token: {token_address}\n⏳ This may take up to 60 seconds...")
    
    try:
        response = await finrizz_team.arun(
            f"Perform comprehensive analysis on token address: {token_address}. Include discovery research, whale tracking, live market data, and investment recommendation."
        )
        await update.message.reply_text(response, parse_mode='Markdown')
    except Exception as e:
        await update.message.reply_text(f"❌ Analysis failed: {str(e)}")

async def discover_tokens(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🔍 Discovering newly funded tokens...\n⏳ Scanning funding platforms...")
    
    try:
        response = await discovery_agent.arun(
            "Discover and analyze the top 5 most promising newly funded utility tokens from the past 30 days. Focus on projects with strong utility, reasonable valuations, and favorable vesting schedules."
        )
        await update.message.reply_text(response, parse_mode='Markdown')
    except Exception as e:
        await update.message.reply_text(f"❌ Discovery failed: {str(e)}")

async def og_intel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Please provide a token address: `/og_intel <token_address>`")
        return
    
    token_address = context.args[0]
    await update.message.reply_text(f"🔍 0G Network Intelligence for: {token_address}")
    
    try:
        # Specialized 0G analysis with enhanced substream focus
        response = await finrizz_team.arun(
            f"Perform specialized 0G Network analysis on token: {token_address}. Focus on 0G-specific metrics, validator activity, and network-specific whale patterns."
        )
        await update.message.reply_text(response, parse_mode='Markdown')
    except Exception as e:
        await update.message.reply_text(f"❌ 0G Intel failed: {str(e)}")

def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    
    # Command handlers
    app.add_handler(CommandHandler('start', lambda u, c: u.message.reply_text("🤖 FinRizz AI Analyst Ready!\n\nCommands:\n/analyze <address> - Full token analysis\n/discover - Find new funded tokens\n/og_intel <address> - 0G Network analysis")))
    app.add_handler(CommandHandler('analyze', analyze_token))
    app.add_handler(CommandHandler('discover', discover_tokens))
    app.add_handler(CommandHandler('og_intel', og_intel))
    
    app.run_polling()

if __name__ == "__main__":
    main()
