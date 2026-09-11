import os
import logging
import tempfile
import httpx
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("checkin_bot")

load_dotenv()  # reads .env in the current directory, if present

REQUIRED_VARS = ["BOT_TOKEN"]
missing = [v for v in REQUIRED_VARS if not os.environ.get(v)]
if missing:
    raise SystemExit(
        f"Missing required env vars: {', '.join(missing)}. "
        f"Copy .env.example to .env and fill them in."
    )

BOT_TOKEN = os.environ["BOT_TOKEN"]
CAREBRIDGE_API_URL = os.environ.get(
    "CAREBRIDGE_API_URL"
)

if not CAREBRIDGE_API_URL:
    raise SystemExit(
        "CAREBRIDGE_API_URL is required. "
        "Set it to the internal CareBridge server URL."
    )

CAREBRIDGE_API_URL = CAREBRIDGE_API_URL.rstrip("/")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")  # optional, for voice

HELP_TEXT = (
    "Send /start to verify your Telegram username against your CareBridge victim record.\n"
    "After verification, text and voice notes are sent to the scoring pipeline and saved as check-ins."
)

GREETING = (
    "Namaste 🙏 How are you feeling today?\n"
    "आप आज कैसा महसूस कर रहे हैं?\n\n"
    "You can type a message or send a voice note."
)

# In-memory map of Telegram chat_id -> victim_id. Use a persistent identity store
# before deploying multiple bot workers.
CHAT_TO_VICTIM = {}
CHAT_AWAITING_NAME = set()


async def resolve_telegram_username(username: str) -> dict | None:
    normalized = username.replace('@', '').strip()
    if not normalized:
        return None
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{CAREBRIDGE_API_URL}/api/database/victims/resolve-telegram",
            params={"username": normalized},
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json().get("victim")


async def validate_current_user(update: Update) -> dict | None:
    user = update.effective_user
    username = user.username if user else None
    if not username:
        return None
    return await resolve_telegram_username(username)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    try:
        victim = await validate_current_user(update)
    except Exception:
        logger.exception("Telegram username validation failed")
        await update.message.reply_text("I could not reach CareBridge right now. Please try again shortly.")
        return
    if not victim:
        CHAT_TO_VICTIM.pop(chat_id, None)
        await update.message.reply_text(
            "This Telegram account is not linked to an active CareBridge victim case. "
            "Please ask an official to add your Telegram username to your victim record, then send /start again."
        )
        return
    CHAT_TO_VICTIM[chat_id] = victim["id"]
    await update.message.reply_text(f"Verified. Your CareBridge case is linked.\n\n{GREETING}")


async def link(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    # /link is retained only as a re-validation command; users cannot choose an arbitrary victim ID.
    await start(update, context)


async def transcribe_voice(file_path: str) -> str:
    """Transcribe a downloaded .ogg voice note using OpenAI Whisper API."""
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not set — cannot transcribe voice notes.")
    async with httpx.AsyncClient(timeout=30) as client:
        with open(file_path, "rb") as f:
            resp = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                data={"model": "whisper-1"},
                files={"file": (os.path.basename(file_path), f, "audio/ogg")},
            )
        resp.raise_for_status()
        return resp.json()["text"]


async def analyze_message(
    text: str,
    victim_id: str,
    sender: dict,
    message_id: int | None,
) -> dict:
    """Send a Telegram check-in through the CareBridge pipeline and database."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{CAREBRIDGE_API_URL}/api/ingest/telegram",
            json={
                "victimId": victim_id,
                "message": {
                    "text": text,
                    "from": sender,
                    "message_id": message_id,
                },
            },
        )
        resp.raise_for_status()
        return resp.json()


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    text = (update.message.text or '').strip()
    if not text:
        return

    victim_id = CHAT_TO_VICTIM.get(chat_id)
    if not victim_id:
        try:
            victim = await validate_current_user(update)
        except Exception:
            logger.exception("Telegram username validation failed")
            await update.message.reply_text("I could not reach CareBridge right now. Please try again shortly.")
            return
        if not victim:
            await update.message.reply_text("Your Telegram username is not linked to an active victim case. Ask an official to register it, then send /start.")
            return
        victim_id = victim["id"]
        CHAT_TO_VICTIM[chat_id] = victim_id

    await process_and_reply(update, victim_id, text)


async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    victim_id = CHAT_TO_VICTIM.get(chat_id)
    if not victim_id:
        await update.message.reply_text("Please send /start and link this chat to a victim before sending a voice note.")
        return

    voice_file = await update.message.voice.get_file()
    local_path = os.path.join(
        tempfile.gettempdir(), f"{update.message.voice.file_unique_id}.ogg"
    )
    await voice_file.download_to_drive(local_path)

    try:
        text = await transcribe_voice(local_path)
    except Exception as e:
        logger.exception("Transcription failed")
        await update.message.reply_text("Sorry, I couldn't process that voice note.")
        return
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)

    await process_and_reply(update, victim_id, text)


async def process_and_reply(update: Update, victim_id: str, text: str) -> None:
    try:
        sender = update.effective_user
        sender_data = {"id": sender.id} if sender else {}
        if sender and sender.username:
            sender_data["username"] = sender.username
        result = await analyze_message(
            text,
            victim_id,
            sender_data,
            update.effective_message.message_id if update.effective_message else None,
        )
    except Exception:
        logger.exception("Failed to process Telegram check-in")
        await update.message.reply_text(
            "Thanks for sharing. (Note: there was an issue recording this — please try again.)"
        )
        return

    reply = result.get("replyToVictim") or result.get(
        "message", "Thank you for checking in. Take care of yourself."
    )
    await update.message.reply_text(reply)


def main() -> None:
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("link", link))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    app.add_handler(MessageHandler(filters.VOICE, handle_voice))

    logger.info("Bot starting (polling)...")
    app.run_polling()


if __name__ == "__main__":
    main()
