import asyncio
import logging
import sys
from pathlib import Path

# Додаємо корінь проєкту до sys.path для надійної роботи імпортів
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from backend.config import BOT_TOKEN, DATABASE_URL, SQLITE_PATH, BOT_USERNAME
from backend.database import setup_database
from backend.handlers import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("WebixBot")

async def main():
    if not BOT_TOKEN:
        logger.error("❌ BOT_TOKEN не знайдено! Перевірте файл .env.")
        return

    # Ініціалізація бази даних (з авто-перемиканням PostgreSQL -> SQLite)
    db = await setup_database(DATABASE_URL, SQLITE_PATH)

    # Ініціалізація бота та диспетчера
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher()

    # Підключення роутера обробників
    dp.include_router(router)

    # Видаляємо вебхук без видалення черги повідомлень
    try:
        await bot.delete_webhook(drop_pending_updates=False)
    except Exception as e:
        logger.warning(f"⚠️ Не вдалося видалити старий webhook: {e}")

    logger.info(f"🤖 Webix OS Бот (@{BOT_USERNAME}) готовий до роботи!")
    logger.info("⚡️ Очікування повідомлень від користувачів...")

    try:
        await dp.start_polling(bot, db=db)
    finally:
        logger.info("Зупинка бота...")
        await bot.session.close()
        await db.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Бот зупинений вручну.")
