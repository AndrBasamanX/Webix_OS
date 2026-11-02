import asyncio
import logging
from datetime import datetime, date
from typing import Optional, Tuple, List, Dict, Any
import asyncpg
import aiosqlite

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, db_type: str, connection):
        self.db_type = db_type
        self.conn = connection

    async def init(self):
        """Ініціалізація структури таблиць бази даних та стартових промокодів."""
        if self.db_type == "postgres":
            async with self.conn.acquire() as conn:
                # Таблиця користувачів
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        user_id BIGINT PRIMARY KEY,
                        full_name TEXT,
                        energy INT DEFAULT 0,
                        level INT DEFAULT 1,
                        last_bonus DATE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                # Додаємо колонку last_bonus якщо таблиця вже існувала без неї
                try:
                    await conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_bonus DATE;")
                except Exception:
                    pass

                # Таблиця промокодів
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS promo_codes (
                        code TEXT PRIMARY KEY,
                        reward INT NOT NULL,
                        max_uses INT DEFAULT 100,
                        current_uses INT DEFAULT 0
                    );
                """)

                # Таблиця використаних промокодів
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS promo_activations (
                        user_id BIGINT,
                        code TEXT,
                        activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (user_id, code)
                    );
                """)

                # Стартові промокоди
                await conn.execute("""
                    INSERT INTO promo_codes (code, reward, max_uses)
                    VALUES ('WEBIX2026', 100, 500), ('START', 50, 1000)
                    ON CONFLICT (code) DO NOTHING;
                """)
        else:
            # SQLite
            await self.conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY,
                    full_name TEXT,
                    energy INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    last_bonus TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            try:
                await self.conn.execute("ALTER TABLE users ADD COLUMN last_bonus TEXT;")
            except Exception:
                pass

            await self.conn.execute("""
                CREATE TABLE IF NOT EXISTS promo_codes (
                    code TEXT PRIMARY KEY,
                    reward INTEGER NOT NULL,
                    max_uses INTEGER DEFAULT 100,
                    current_uses INTEGER DEFAULT 0
                );
            """)

            await self.conn.execute("""
                CREATE TABLE IF NOT EXISTS promo_activations (
                    user_id INTEGER,
                    code TEXT,
                    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, code)
                );
            """)

            await self.conn.execute("""
                INSERT OR IGNORE INTO promo_codes (code, reward, max_uses)
                VALUES ('WEBIX2026', 100, 500), ('START', 50, 1000);
            """)
            await self.conn.commit()

    async def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Отримати повний профіль користувача."""
        if self.db_type == "postgres":
            async with self.conn.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT user_id, full_name, energy, level, last_bonus FROM users WHERE user_id = $1;",
                    user_id
                )
                if row:
                    return {
                        "user_id": row["user_id"],
                        "full_name": row["full_name"],
                        "energy": row["energy"],
                        "level": row["level"],
                        "last_bonus": str(row["last_bonus"]) if row["last_bonus"] else None
                    }
                return None
        else:
            async with self.conn.execute(
                "SELECT user_id, full_name, energy, level, last_bonus FROM users WHERE user_id = ?;",
                (user_id,)
            ) as cursor:
                row = await cursor.fetchone()
                if row:
                    return {
                        "user_id": row[0],
                        "full_name": row[1],
                        "energy": row[2],
                        "level": row[3],
                        "last_bonus": row[4]
                    }
                return None

    async def get_user_energy(self, user_id: int) -> int:
        """Отримати поточний рівень енергії користувача."""
        user = await self.get_user(user_id)
        return user["energy"] if user else 0

    async def update_user_energy(self, user_id: int, full_name: str, energy_sent: int) -> Tuple[int, int]:
        """Додати енергію користувачу і перерахувати рівень."""
        current_energy = await self.get_user_energy(user_id)
        new_energy = max(0, current_energy + energy_sent)
        level = (new_energy // 100) + 1

        if self.db_type == "postgres":
            async with self.conn.acquire() as conn:
                await conn.execute("""
                    INSERT INTO users (user_id, full_name, energy, level)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id) DO UPDATE 
                    SET energy = $3, level = $4, full_name = $2;
                """, user_id, full_name, new_energy, level)
        else:
            await self.conn.execute("""
                INSERT INTO users (user_id, full_name, energy, level)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE 
                SET energy = ?, level = ?, full_name = ?;
            """, (user_id, full_name, new_energy, level, new_energy, level, full_name))
            await self.conn.commit()

        return new_energy, level

    async def claim_daily_bonus(self, user_id: int, bonus: int = 50) -> Tuple[bool, int, int, str]:
        """
        Отримання щоденного бонусу.
        Повертає: (успішно: bool, новий_баланс, новий_рівень, повідомлення)
        """
        today_str = str(date.today())
        user = await self.get_user(user_id)
        if not user:
            return False, 0, 1, "Користувача не знайдено. Натисніть /start."

        if user.get("last_bonus") == today_str:
            return False, user["energy"], user["level"], "Ви вже отримували щоденний бонус сьогодні! Завітайте завтра ⏳"

        new_energy = user["energy"] + bonus
        new_level = (new_energy // 100) + 1

        if self.db_type == "postgres":
            async with self.conn.acquire() as conn:
                await conn.execute("""
                    UPDATE users SET energy = $1, level = $2, last_bonus = CURRENT_DATE
                    WHERE user_id = $3;
                """, new_energy, new_level, user_id)
        else:
            await self.conn.execute("""
                UPDATE users SET energy = ?, level = ?, last_bonus = ?
                WHERE user_id = ?;
            """, (new_energy, new_level, today_str, user_id))
            await self.conn.commit()

        return True, new_energy, new_level, f"🎉 Вітаємо! Ви отримали щоденний бонус: <b>+{bonus} EP</b>!"

    async def activate_promo(self, user_id: int, code: str) -> Tuple[bool, int, str]:
        """
        Активація промокоду.
        Повертає: (успішно, нарахована_енергія, текст_відповіді)
        """
        clean_code = code.strip().upper()
        if not clean_code:
            return False, 0, "Введіть дійсний промокод."

        if self.db_type == "postgres":
            async with self.conn.acquire() as conn:
                promo = await conn.fetchrow(
                    "SELECT reward, max_uses, current_uses FROM promo_codes WHERE code = $1;",
                    clean_code
                )
                if not promo:
                    return False, 0, "❌ Такого промокоду не існує або термін його дії закінчився."

                if promo["current_uses"] >= promo["max_uses"]:
                    return False, 0, "❌ На жаль, цей промокод вичерпав свій ліміт активацій."

                already = await conn.fetchval(
                    "SELECT 1 FROM promo_activations WHERE user_id = $1 AND code = $2;",
                    user_id, clean_code
                )
                if already:
                    return False, 0, "⚠️ Ви вже активували цей промокод раніше!"

                # Зараховуємо промокод
                reward = promo["reward"]
                await conn.execute(
                    "INSERT INTO promo_activations (user_id, code) VALUES ($1, $2);",
                    user_id, clean_code
                )
                await conn.execute(
                    "UPDATE promo_codes SET current_uses = current_uses + 1 WHERE code = $1;",
                    clean_code
                )
                await conn.execute(
                    "UPDATE users SET energy = energy + $1, level = ((energy + $1) / 100) + 1 WHERE user_id = $2;",
                    reward, user_id
                )
                return True, reward, f"🎉 Промокод активовано! Вам нараховано: <b>+{reward} EP</b>!"
        else:
            async with self.conn.execute(
                "SELECT reward, max_uses, current_uses FROM promo_codes WHERE code = ?;",
                (clean_code,)
            ) as cur:
                promo = await cur.fetchone()

            if not promo:
                return False, 0, "❌ Такого промокоду не існує або термін його дії закінчився."

            reward, max_uses, current_uses = promo
            if current_uses >= max_uses:
                return False, 0, "❌ На жаль, цей промокод вичерпав свій ліміт активацій."

            async with self.conn.execute(
                "SELECT 1 FROM promo_activations WHERE user_id = ? AND code = ?;",
                (user_id, clean_code)
            ) as cur:
                already = await cur.fetchone()

            if already:
                return False, 0, "⚠️ Ви вже активували цей промокод раніше!"

            await self.conn.execute(
                "INSERT INTO promo_activations (user_id, code) VALUES (?, ?);",
                (user_id, clean_code)
            )
            await self.conn.execute(
                "UPDATE promo_codes SET current_uses = current_uses + 1 WHERE code = ?;",
                (clean_code,)
            )
            await self.conn.execute("""
                UPDATE users SET 
                    energy = energy + ?, 
                    level = ((energy + ?) / 100) + 1 
                WHERE user_id = ?;
            """, (reward, reward, user_id))
            await self.conn.commit()

            return True, reward, f"🎉 Промокод активовано! Вам нараховано: <b>+{reward} EP</b>!"

    async def get_top_users(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Отримати рейтинг топ-користувачів за балансом енергії."""
        if self.db_type == "postgres":
            async with self.conn.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT full_name, energy, level 
                    FROM users 
                    ORDER BY energy DESC 
                    LIMIT $1;
                """, limit)
                return [
                    {"name": r["full_name"] or "Гість", "energy": r["energy"], "level": r["level"]}
                    for r in rows
                ]
        else:
            async with self.conn.execute("""
                SELECT full_name, energy, level 
                FROM users 
                ORDER BY energy DESC 
                LIMIT ?;
            """, (limit,)) as cur:
                rows = await cur.fetchall()
                return [
                    {"name": r[0] or "Гість", "energy": r[1], "level": r[2]}
                    for r in rows
                ]

    async def get_total_stats(self) -> Dict[str, Any]:
        """Отримати глобальну системну статистику (для адмінів)."""
        if self.db_type == "postgres":
            async with self.conn.acquire() as conn:
                total_users = await conn.fetchval("SELECT COUNT(*) FROM users;") or 0
                total_energy = await conn.fetchval("SELECT COALESCE(SUM(energy), 0) FROM users;") or 0
                max_energy = await conn.fetchval("SELECT COALESCE(MAX(energy), 0) FROM users;") or 0
                total_promos = await conn.fetchval("SELECT COUNT(*) FROM promo_activations;") or 0
        else:
            async with self.conn.execute("SELECT COUNT(*), COALESCE(SUM(energy), 0), COALESCE(MAX(energy), 0) FROM users;") as cur:
                row = await cur.fetchone()
                total_users, total_energy, max_energy = row if row else (0, 0, 0)

            async with self.conn.execute("SELECT COUNT(*) FROM promo_activations;") as cur:
                row = await cur.fetchone()
                total_promos = row[0] if row else 0

        return {
            "total_users": total_users,
            "total_energy": total_energy,
            "max_energy": max_energy,
            "total_promos": total_promos,
            "db_type": "PostgreSQL 🐘" if self.db_type == "postgres" else "SQLite 📁"
        }

    async def get_all_user_ids(self) -> List[int]:
        """Отримати ID всіх користувачів для масової розсилки."""
        if self.db_type == "postgres":
            async with self.conn.acquire() as conn:
                rows = await conn.fetch("SELECT user_id FROM users;")
                return [r["user_id"] for r in rows]
        else:
            async with self.conn.execute("SELECT user_id FROM users;") as cur:
                rows = await cur.fetchall()
                return [r[0] for r in rows]

    async def get_all_users_list(self, limit: int = 15) -> List[Dict[str, Any]]:
        """Отримати список останніх користувачів для адмін-панелі."""
        if self.db_type == "postgres":
            async with self.conn.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT user_id, full_name, energy, level 
                    FROM users 
                    ORDER BY user_id DESC 
                    LIMIT $1;
                """, limit)
                return [dict(r) for r in rows]
        else:
            async with self.conn.execute("""
                SELECT user_id, full_name, energy, level 
                FROM users 
                ORDER BY user_id DESC 
                LIMIT ?;
            """, (limit,)) as cur:
                rows = await cur.fetchall()
                return [
                    {"user_id": r[0], "full_name": r[1], "energy": r[2], "level": r[3]}
                    for r in rows
                ]

    async def close(self):
        """Безпечне закриття з'єднання з базою."""
        try:
            await self.conn.close()
        except Exception as e:
            logger.error(f"Помилка закриття бази: {e}")

async def setup_database(database_url: Optional[str] = None, sqlite_path: str = "webix.db") -> Database:
    """Підключення до бази даних з таймаутом і авто-перемиканням."""
    if database_url:
        try:
            async def _connect_pg():
                pool = await asyncpg.create_pool(
                    database_url,
                    timeout=3.0,
                    command_timeout=3.0,
                    min_size=1,
                    max_size=5
                )
                db = Database("postgres", pool)
                await db.init()
                return db

            db = await asyncio.wait_for(_connect_pg(), timeout=4.0)
            logger.info("🐘 Успішно підключено до PostgreSQL Neon!")
            return db
        except Exception as e:
            logger.warning(f"⚠️ Не вдалося підключитися до PostgreSQL: {e}. Переходимо на SQLite...")

    # Fallback: Локальний SQLite
    conn = await aiosqlite.connect(sqlite_path)
    db = Database("sqlite", conn)
    await db.init()
    logger.info(f"📁 Використовуємо локальну базу SQLite ({sqlite_path})")
    return db
