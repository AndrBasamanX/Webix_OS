import asyncio
import json
import logging
import os
import asyncpg
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import CommandStart
from aiogram.types import KeyboardButton, ReplyKeyboardMarkup, WebAppInfo

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN не задано! Вкажіть його у файлі .env або змінних оточення.")

WEBAPP_URL = os.getenv("WEBAPP_URL", "https://andrbasamanx.github.io/Webix_OS/")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/webix_db")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# --- ІНІЦІАЛІЗАЦІЯ БАЗИ ДАНИХ POSTGRESQL ---
async def init_db(pool):
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id BIGINT PRIMARY KEY,
                full_name TEXT,
                energy INT DEFAULT 0,
                level INT DEFAULT 1
            );
        """)

async def update_user_energy(pool, user_id: int, full_name: str, added_energy: int):
    async with pool.acquire() as conn:
        # Шукаємо користувача
        row = await conn.fetchrow("SELECT energy, level FROM users WHERE user_id = $1", user_id)
        
        if row:
            current_energy = row['energy'] + added_energy
            new_level = (current_energy // 100) + 1
            await conn.execute(
                "UPDATE users SET energy = $1, level = $2, full_name = $3 WHERE user_id = $4",
                current_energy, new_level, full_name, user_id
            )
        else:
            current_energy = added_energy
            new_level = (current_energy // 100) + 1
            await conn.execute(
                "INSERT INTO users (user_id, full_name, energy, level) VALUES ($1, $2, $3, $4)",
                user_id, full_name, current_energy, new_level
            )
            
        return current_energy, new_level

# --- ОБРОБНИКИ КОМАНД ---
@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="⚡ Відкрити Webix OS", web_app=WebAppInfo(url=WEBAPP_URL))]
        ],
        resize_keyboard=True
    )
    await message.answer(
        f"Вітаю, {message.from_user.first_name}! 🚀\n\n"
        f"Натисніть кнопку нижче, щоб відкрити Webix OS:",
        reply_markup=keyboard
    )

@dp.message(F.web_app_data)
async def handle_webapp_data(message: types.Message, db_pool: asyncpg.Pool):
    try:
        raw_data = message.web_app_data.data
        data = json.loads(raw_data)
        
        action = data.get("action")
        try:
            energy_sent = int(data.get("energy", 0))
        except (ValueError, TypeError):
            energy_sent = 0

        if action == "energy_transfer" and energy_sent > 0:
            user_id = message.from_user.id
            full_name = message.from_user.full_name
            
            # Зберігаємо в PostgreSQL
            total_energy, level = await update_user_energy(db_pool, user_id, full_name, energy_sent)

            await message.answer(
                f"⚡ **Енергію успішно передано!**\n\n"
                f"📥 Отримано за сесію: **+{energy_sent} EP**\n"
                f"🔋 Всього на балансі: **{total_energy} EP**\n"
                f"🏆 Ваш рівень: **Level {level}**\n\n"
                f"Дані збережено у PostgreSQL 🐘",
                parse_mode="Markdown"
            )
    except Exception as e:
        logging.error(f"Помилка обробки: {e}")
        await message.answer(f"Помилка при збереженні: {e}")

async def main():
    logging.basicConfig(level=logging.INFO)
    
    # Створюємо пул підключень до PostgreSQL
    pool = await asyncpg.create_pool(DATABASE_URL)
    await init_db(pool)
    
    print("🤖 Бот Webix OS запущено з підтримкою PostgreSQL...")
    
    # Передаємо db_pool у хендлери
    await dp.start_polling(bot, db_pool=pool)

if __name__ == "__main__":
    asyncio.run(main())