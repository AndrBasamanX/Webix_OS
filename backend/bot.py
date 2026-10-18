import asyncio
import json
import logging
import os
import aiosqlite
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
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///webix.db")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# --- УНІВЕРСАЛЬНИЙ КЛАС РОБОТИ З БАЗОЮ (PostgreSQL / SQLite) ---
class Database:
    def __init__(self, db_type: str, pool_or_conn):
        self.db_type = db_type
        self.db = pool_or_conn

    async def init(self):
        if self.db_type == "postgres":
            async with self.db.acquire() as conn:
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        user_id BIGINT PRIMARY KEY,
                        full_name TEXT,
                        energy INT DEFAULT 0,
                        level INT DEFAULT 1
                    );
                """)
        else:
            async with self.db.cursor() as cursor:
                await cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        user_id INTEGER PRIMARY KEY,
                        full_name TEXT,
                        energy INTEGER DEFAULT 0,
                        level INTEGER DEFAULT 1
                    );
                """)
            await self.db.commit()

    async def update_user_energy(self, user_id: int, full_name: str, added_energy: int):
        if self.db_type == "postgres":
            async with self.db.acquire() as conn:
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
        else:
            async with self.db.execute("SELECT energy, level FROM users WHERE user_id = ?", (user_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    current_energy = row[0] + added_energy
                    new_level = (current_energy // 100) + 1
                    await self.db.execute(
                        "UPDATE users SET energy = ?, level = ?, full_name = ? WHERE user_id = ?",
                        (current_energy, new_level, full_name, user_id)
                    )
                else:
                    current_energy = added_energy
                    new_level = (current_energy // 100) + 1
                    await self.db.execute(
                        "INSERT INTO users (user_id, full_name, energy, level) VALUES (?, ?, ?, ?)",
                        (user_id, full_name, current_energy, new_level)
                    )
            await self.db.commit()
            return current_energy, new_level

async def setup_database() -> Database:
    if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://"):
        try:
            pool = await asyncio.wait_for(asyncpg.create_pool(DATABASE_URL), timeout=3.0)
            db = Database("postgres", pool)
            await db.init()
            logging.info("🐘 Успішно підключено до PostgreSQL!")
            return db
        except Exception as e:
            logging.warning(f"⚠️ Не вдалося підключитися до PostgreSQL: {e}. Переходимо на SQLite...")
    
    # Локальний SQLite як надійний fallback
    db_file = os.getenv("SQLITE_PATH", "webix.db")
    conn = await aiosqlite.connect(db_file)
    db = Database("sqlite", conn)
    await db.init()
    logging.info(f"📁 Використовуємо локальну базу SQLite ({db_file})")
    return db

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
async def handle_webapp_data(message: types.Message, db: Database):
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
            
            total_energy, level = await db.update_user_energy(user_id, full_name, energy_sent)
            db_label = "PostgreSQL 🐘" if db.db_type == "postgres" else "SQLite 📁"

            await message.answer(
                f"⚡ **Енергію успішно передано!**\n\n"
                f"📥 Отримано за сесію: **+{energy_sent} EP**\n"
                f"🔋 Всього на балансі: **{total_energy} EP**\n"
                f"🏆 Ваш рівень: **Level {level}**\n\n"
                f"Дані збережено у {db_label}",
                parse_mode="Markdown"
            )
    except Exception as e:
        logging.error(f"Помилка обробки: {e}")
        await message.answer(f"Помилка при збереженні: {e}")

async def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    
    db = await setup_database()
    print("🤖 Бот Webix OS успішно запущено...")
    
    await dp.start_polling(bot, db=db)

if __name__ == "__main__":
    asyncio.run(main())