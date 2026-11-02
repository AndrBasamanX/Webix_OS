import json
import logging
import html
import random
from datetime import datetime
from aiogram import Router, F, types, Bot
from aiogram.filters import CommandStart, CommandObject, Command

from backend.database import Database
from backend.keyboards import (
    get_user_reply_keyboard,
    get_admin_reply_keyboard,
    get_webapp_keyboard,
    get_energy_confirmed_keyboard,
    get_roulette_keyboard,
    get_admin_tools_inline,
)
from backend.config import WEBAPP_URL, is_admin

logger = logging.getLogger(__name__)
router = Router()

def get_keyboard_for_user(user_id: int, level: int):
    """Повертає відповідну клавіатуру: адмінську або за рівнем гравця."""
    if is_admin(user_id):
        return get_admin_reply_keyboard(WEBAPP_URL)
    return get_user_reply_keyboard(level, WEBAPP_URL)

# ==========================================
# 1. СТАРТ ТА ОБРОБКА ДАНИХ WEBAPP
# ==========================================
@router.message(CommandStart())
async def cmd_start(message: types.Message, command: CommandObject, db: Database):
    """Обробка команди /start та deep link передачі енергії."""
    user_id = message.from_user.id
    raw_name = message.from_user.full_name or message.from_user.first_name or "Користувач"
    safe_name = html.escape(raw_name)

    # 1. Якщо передано deep link: /start energy_<N>
    if command.args and command.args.startswith("energy_"):
        raw_val = command.args.replace("energy_", "").strip()
        try:
            energy_sent = int(raw_val)
        except (ValueError, TypeError):
            energy_sent = 0

        if energy_sent > 0:
            total_energy, level = await db.update_user_energy(user_id, raw_name, energy_sent)
            db_label = "PostgreSQL 🐘" if db.db_type == "postgres" else "SQLite 📁"

            reply_kb = get_keyboard_for_user(user_id, level)

            await message.answer(
                f"⚡️ <b>Енергетичні ядра успішно передано!</b>\n\n"
                f"📥 Отримано за сесію: <b>+{energy_sent} EP</b>\n"
                f"🔋 Всього на балансі: <b>{total_energy} EP</b>\n"
                f"🏆 Ваш рівень: <b>Level {level}</b>\n\n"
                f"Збережено в базі: {db_label}",
                parse_mode="HTML",
                reply_markup=reply_kb
            )
            # Додаткова інлайн-кнопка повернення
            await message.answer(
                "Бажаєте продовжити збір енергії?",
                reply_markup=get_energy_confirmed_keyboard(WEBAPP_URL)
            )
            return

    # 2. Звичайний запуск
    total_energy, level = await db.update_user_energy(user_id, raw_name, 0)
    reply_kb = get_keyboard_for_user(user_id, level)

    admin_tag = " 👑 [Адміністратор]" if is_admin(user_id) else ""

    await message.answer(
        f"Вітаю у <b>Webix OS</b>, <b>{safe_name}</b>!{admin_tag} 🚀\n\n"
        f"🔋 Ваш поточний баланс: <b>{total_energy} EP</b> (Level {level})\n\n"
        f"🎮 Натисніть кнопку меню нижче або «⚡️ Відкрити Webix OS», щоб почати взаємодію з системою!",
        parse_mode="HTML",
        reply_markup=reply_kb
    )

@router.message(F.web_app_data)
async def handle_webapp_data(message: types.Message, db: Database):
    """Обробка даних з WebApp, надісланих через tg.sendData."""
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
            raw_name = message.from_user.full_name or message.from_user.first_name or "Користувач"

            total_energy, level = await db.update_user_energy(user_id, raw_name, energy_sent)
            db_label = "PostgreSQL 🐘" if db.db_type == "postgres" else "SQLite 📁"

            await message.answer(
                f"⚡️ <b>Енергію успішно передано!</b>\n\n"
                f"📥 Отримано за сесію: <b>+{energy_sent} EP</b>\n"
                f"🔋 Всього на балансі: <b>{total_energy} EP</b>\n"
                f"🏆 Ваш рівень: <b>Level {level}</b>\n\n"
                f"Збережено в базі: {db_label}",
                parse_mode="HTML",
                reply_markup=get_keyboard_for_user(user_id, level)
            )
    except Exception as e:
        logger.error(f"Помилка обробки WebApp даних: {e}")
        await message.answer(f"Помилка при збереженні: {e}")

# ==========================================
# 2. ПРОФІЛЬ ТА БАЛАНС
# ==========================================
@router.message(F.text.in_(["🔋 Мій профіль", "/profile", "/balance"]))
async def cmd_profile(message: types.Message, db: Database):
    """Відображення картки профілю та прогресу гравця."""
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    if not user:
        await message.answer("Спочатку запустіть бота командою /start.")
        return

    energy = user["energy"]
    level = user["level"]

    # Розрахунок прогресу до наступного рівня
    current_level_ep = (level - 1) * 100
    next_level_ep = level * 100
    progress_ep = energy - current_level_ep
    needed_ep = next_level_ep - energy

    bars_total = 10
    filled = min(bars_total, max(0, int((progress_ep / 100) * bars_total)))
    bar_str = "█" * filled + "░" * (bars_total - filled)

    role_str = "👑 Адміністратор" if is_admin(user_id) else f"👤 Гравець (Lvl {level})"

    await message.answer(
        f"📊 <b>Ваш цифровий профіль Webix OS:</b>\n\n"
        f"👤 Користувач: <b>{html.escape(user['full_name'])}</b>\n"
        f"🆔 Telegram ID: <code>{user_id}</code>\n"
        f"🎖 Роль: <b>{role_str}</b>\n\n"
        f"⚡️ Баланс енергії: <b>{energy} EP</b>\n"
        f"🏆 Рівень доступу: <b>Level {level}</b>\n"
        f"📈 Прогрес до Level {level + 1}:\n"
        f"<code>[{bar_str}]</code> ({progress_ep}/100 EP)\n"
        f"<i>Залишилося набрати: {max(0, needed_ep)} EP</i>",
        parse_mode="HTML",
        reply_markup=get_webapp_keyboard(WEBAPP_URL, text="🎮 Грати в Webix OS")
    )

# ==========================================
# 3. ТОП ГРАВЦІВ (РЕЙТИНГ)
# ==========================================
@router.message(F.text.in_(["🏆 Топ гравців", "/top"]))
async def cmd_top_players(message: types.Message, db: Database):
    """Відображення таблиці лідерів."""
    top_list = await db.get_top_users(limit=10)
    if not top_list:
        await message.answer("Поки що немає записів у рейтингу. Будьте першим!")
        return

    medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
    text = "🏆 <b>Топ-10 лідерів Webix OS:</b>\n\n"

    for i, player in enumerate(top_list):
        medal = medals[i] if i < len(medals) else f"{i+1}."
        name = html.escape(player["name"][:18])
        text += f"{medal} <b>{name}</b> — <b>{player['energy']} EP</b> <i>(Lvl {player['level']})</i>\n"

    text += "\n<i>Клікайте в Webix OS, щоб піднятися вище в рейтингу!</i>"
    await message.answer(text, parse_mode="HTML")

# ==========================================
# 4. ЩОДЕННИЙ БОНУС (ДОСТУПНО З LEVEL 2 АБО АДМІНУ)
# ==========================================
@router.message(F.text.in_(["🎁 Щоденний бонус", "/daily"]))
async def cmd_daily_bonus(message: types.Message, db: Database):
    """Отримання щоденного подарунка енергії."""
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    if not user:
        await message.answer("Натисніть /start.")
        return

    if user["level"] < 2 and not is_admin(user_id):
        await message.answer(
            f"🔒 <b>Ця функція заблокована!</b>\n\n"
            f"Щоденний бонус відкривається на <b>Level 2</b>.\n"
            f"Ваш поточний рівень: <b>Level {user['level']}</b> ({user['energy']} EP).\n"
            f"Назбирайте ще <b>{100 - user['energy']} EP</b> у грі Webix OS!",
            parse_mode="HTML"
        )
        return

    # Нарахування 30-70 випадкових EP
    bonus_amount = random.randint(35, 65)
    success, new_energy, new_level, msg = await db.claim_daily_bonus(user_id, bonus_amount)

    reply_kb = get_keyboard_for_user(user_id, new_level)
    await message.answer(
        f"{msg}\n\n🔋 Ваш новий баланс: <b>{new_energy} EP</b> (Level {new_level})",
        parse_mode="HTML",
        reply_markup=reply_kb
    )

# ==========================================
# 5. ЕНЕРГО-РУЛЕТКА (ДОСТУПНО З LEVEL 2 АБО АДМІНУ)
# ==========================================
@router.message(F.text.in_(["🎲 Енерго-Рулетка", "/roulette"]))
async def cmd_roulette_menu(message: types.Message, db: Database):
    """Меню азартної міні-гри рулетка."""
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    if not user:
        return

    if user["level"] < 2 and not is_admin(user_id):
        await message.answer(
            "🔒 <b>Енерго-Рулетка доступна з Level 2!</b>\n"
            "Підвищуйте свій рівень у Webix OS, щоб розблокувати цю міні-гру.",
            parse_mode="HTML"
        )
        return

    await message.answer(
        "🎰 <b>Ласкаво просимо до Енерго-Рулетки Webix!</b>\n\n"
        "Правила прості:\n"
        "• Вартість 1 спроби: <b>10 EP</b>\n"
        "• Можливий виграш: <b>до 100 EP</b> або джекпот!\n\n"
        f"Ваш баланс: <b>{user['energy']} EP</b>",
        parse_mode="HTML",
        reply_markup=get_roulette_keyboard()
    )

@router.callback_query(F.data == "spin_roulette")
async def callback_spin_roulette(query: types.CallbackQuery, db: Database):
    """Обробка обертання рулетки."""
    user_id = query.from_user.id
    user = await db.get_user(user_id)
    if not user:
        await query.answer("Користувача не знайдено.")
        return

    if user["energy"] < 10 and not is_admin(user_id):
        await query.answer("❌ Недостатньо енергії! Потрібно щонайменше 10 EP.", show_alert=True)
        return

    # Знімаємо вартість
    cost = 10 if not is_admin(user_id) else 0
    await db.update_user_energy(user_id, user["full_name"], -cost)

    # Випадковий результат
    outcomes = [0, 5, 10, 15, 20, 25, 50, 100]
    weights = [25, 25, 20, 15, 8, 4, 2, 1]
    won = random.choices(outcomes, weights=weights, k=1)[0]

    net_change = won - cost
    new_energy, new_level = await db.update_user_energy(user_id, user["full_name"], won)

    if won > cost:
        res_text = f"🎉 <b>ВИГРАШ!</b> Ви отримали <b>+{won} EP</b> (чистий прибуток +{net_change} EP)!"
    elif won == cost:
        res_text = f"👌 <b>Нічия!</b> Ви повернули свої <b>{won} EP</b>."
    else:
        res_text = f"💔 <b>Не пощастило!</b> Випало: {won} EP (втрата: -{cost - won} EP)."

    await query.message.answer(
        f"🎰 <b>Результат рулетки:</b>\n\n"
        f"{res_text}\n\n"
        f"🔋 Поточний баланс: <b>{new_energy} EP</b> (Level {new_level})",
        parse_mode="HTML",
        reply_markup=get_roulette_keyboard()
    )
    await query.answer()

# ==========================================
# 6. ПРОМОКОДИ (ДОСТУПНО З LEVEL 3 АБО АДМІНУ)
# ==========================================
@router.message(F.text.in_(["🎟 Промокод", "/promo"]))
async def cmd_promo_info(message: types.Message, db: Database):
    """Інструкція щодо активації промокоду."""
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    if not user:
        return

    if user["level"] < 3 and not is_admin(user_id):
        await message.answer(
            f"🔒 <b>Активація промокодів доступна з Level 3!</b>\n"
            f"Ваш рівень: <b>Level {user['level']}</b>. Прокачуйтеся в Webix OS!",
            parse_mode="HTML"
        )
        return

    await message.answer(
        "🎟 <b>Активація промокоду:</b>\n\n"
        "Надішліть команду у форматі:\n"
        "<code>/promo ВАШ_КОД</code>\n\n"
        "<i>Спробуйте секретний промокод:</i> <code>/promo WEBIX2026</code>",
        parse_mode="HTML"
    )

@router.message(Command("promo"))
async def cmd_activate_promo(message: types.Message, command: CommandObject, db: Database):
    """Обробка введеного промокоду /promo CODE."""
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    if not user:
        return

    if user["level"] < 3 and not is_admin(user_id):
        await message.answer(
            "🔒 Промокоди стануть доступними з <b>Level 3</b>!",
            parse_mode="HTML"
        )
        return

    if not command.args:
        await message.answer("Вкажіть промокод, наприклад: <code>/promo START</code>", parse_mode="HTML")
        return

    code = command.args.strip()
    success, reward, msg = await db.activate_promo(user_id, code)

    user_updated = await db.get_user(user_id)
    new_energy = user_updated["energy"]
    new_level = user_updated["level"]

    await message.answer(
        f"{msg}\n\n🔋 Ваш баланс: <b>{new_energy} EP</b> (Level {new_level})",
        parse_mode="HTML",
        reply_markup=get_keyboard_for_user(user_id, new_level)
    )

# ==========================================
# 7. ПАСИВНИЙ МАЙНІНГ (ДОСТУПНО З LEVEL 3 АБО АДМІНУ)
# ==========================================
@router.message(F.text.in_(["⚡️ Майнінг", "/mine"]))
async def cmd_mining(message: types.Message, db: Database):
    """Міні-функція пасивного видобутку ядер."""
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    if not user:
        return

    if user["level"] < 3 and not is_admin(user_id):
        await message.answer(
            "🔒 <b>Майнінг-станція доступна з Level 3!</b>\n"
            "Збільшуйте баланс у клікері ядра, щоб отримати доступ.",
            parse_mode="HTML"
        )
        return

    mined = random.randint(10, 25)
    new_energy, new_level = await db.update_user_energy(user_id, user["full_name"], mined)

    await message.answer(
        f"⚡️ <b>Квантовий генератор синтезував енергію!</b>\n\n"
        f"⛏ Отримано: <b>+{mined} EP</b>\n"
        f"🔋 Баланс: <b>{new_energy} EP</b> (Level {new_level})",
        parse_mode="HTML"
    )

# ==========================================
# 8. ОБРОБКА ЗАБЛОКОВАНИХ КНОПОК
# ==========================================
@router.message(F.text.startswith("🔒"))
async def handle_locked_buttons(message: types.Message, db: Database):
    """Підказка при натисканні на кнопки з замочком."""
    user_id = message.from_user.id
    user = await db.get_user(user_id)
    current_level = user["level"] if user else 1
    current_energy = user["energy"] if user else 0

    await message.answer(
        f"🔒 <b>Ця функція поки що заблокована для вас!</b>\n\n"
        f"Ваш поточний рівень: <b>Level {current_level}</b> ({current_energy} EP).\n\n"
        f"🎮 <b>Як відкрити нові функції:</b>\n"
        f"1. Натисніть кнопку «⚡️ Відкрити Webix OS»\n"
        f"2. Клікайте на Енерго-Ядро та накопичуйте очки\n"
        f"3. Відправте їх у бот — і рівень автоматично зросте!",
        parse_mode="HTML",
        reply_markup=get_webapp_keyboard(WEBAPP_URL, text="🚀 Грати і підвищити рівень")
    )

# ==========================================
# 9. ДОВІДКА ТА СИСТЕМА РІВНІВ
# ==========================================
@router.message(F.text.in_(["ℹ️ Довідка та Рівні", "/help"]))
async def cmd_help(message: types.Message):
    """Повна інформація про систему рівнів."""
    await message.answer(
        "ℹ️ <b>Система рангів та рівнів Webix OS:</b>\n\n"
        "• <b>Level 1 (0 – 99 EP)</b>: Базовий дашборд, перегляд профілю, рейтинг топ-10 лідерів.\n"
        "• <b>Level 2 (100 – 199 EP)</b>: Розблокування 🎁 <b>Щоденного бонусу</b> та 🎲 <b>Енерго-Рулетки</b>.\n"
        "• <b>Level 3 (200 – 399 EP)</b>: Розблокування 🎟 <b>Промокодів</b> та ⚡️ <b>Пасивного майнінгу</b>.\n"
        "• <b>Level 4+ (400+ EP)</b>: Преміум-статус, доступ до майбутніх кібер-івентів та множників!\n\n"
        "<i>Збирайте енергію в Mini App і відкривайте всі можливості бота!</i>",
        parse_mode="HTML"
    )

# ==========================================
# 10. 👑 АДМІНІСТРАТИВНИЙ РОЗДІЛ
# ==========================================
@router.message(F.text.in_(["📊 Статистика системи", "/stats"]))
async def cmd_admin_stats(message: types.Message, db: Database):
    """Перегляд глобальної статистики сервера і БД (тільки адмін)."""
    user_id = message.from_user.id
    if not is_admin(user_id):
        await message.answer("❌ Ця дія доступна лише адміністраторам.")
        return

    stats = await db.get_total_stats()

    await message.answer(
        f"📊 <b>Глобальна статистика Webix OS:</b>\n\n"
        f"👥 Всього зареєстровано гравців: <b>{stats['total_users']}</b>\n"
        f"⚡️ Сумарно згенеровано енергії: <b>{stats['total_energy']} EP</b>\n"
        f"🏆 Рекордний баланс гравця: <b>{stats['max_energy']} EP</b>\n"
        f"🎟 Активовано промокодів: <b>{stats['total_promos']}</b>\n"
        f"🗄 База даних: <b>{stats['db_type']}</b>\n"
        f"⏱ Серверний час: <code>{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</code>",
        parse_mode="HTML"
    )

@router.message(F.text.in_(["👥 Користувачі", "/users"]))
async def cmd_admin_users(message: types.Message, db: Database):
    """Список останніх користувачів (тільки адмін)."""
    user_id = message.from_user.id
    if not is_admin(user_id):
        await message.answer("❌ Доступ заборонено.")
        return

    users_list = await db.get_all_users_list(limit=15)
    if not users_list:
        await message.answer("Користувачів немає.")
        return

    text = "👥 <b>Останні користувачі в базі даних:</b>\n\n"
    for u in users_list:
        text += (
            f"• <code>{u['user_id']}</code> | <b>{html.escape(u['full_name'][:15])}</b> "
            f"— <b>{u['energy']} EP</b> (Lvl {u['level']})\n"
        )

    await message.answer(text, parse_mode="HTML")

@router.message(F.text == "⚡️ Видати EP")
async def cmd_admin_give_info(message: types.Message):
    """Підказка для видачі енергії."""
    user_id = message.from_user.id
    if not is_admin(user_id):
        return
    await message.answer(
        "⚡️ <b>Видача енергії користувачу:</b>\n\n"
        "Надішліть команду у форматі:\n"
        "<code>/give ID_КОРИСТУВАЧА КІЛЬКІСТЬ_EP</code>\n\n"
        "<i>Приклад:</i> <code>/give 123456789 250</code>",
        parse_mode="HTML"
    )

@router.message(Command("give"))
async def cmd_admin_give_action(message: types.Message, command: CommandObject, db: Database, bot: Bot):
    """Команда /give ID AMOUNT для адміна."""
    user_id = message.from_user.id
    if not is_admin(user_id):
        await message.answer("❌ Доступ заборонено.")
        return

    if not command.args:
        await message.answer("Використання: <code>/give &lt;user_id&gt; &lt;amount&gt;</code>", parse_mode="HTML")
        return

    parts = command.args.split()
    if len(parts) < 2:
        await message.answer("Вкажіть Telegram ID та кількість. Приклад: <code>/give 12345678 100</code>", parse_mode="HTML")
        return

    try:
        target_id = int(parts[0])
        amount = int(parts[1])
    except ValueError:
        await message.answer("❌ ID та кількість мають бути цілими числами.")
        return

    target_user = await db.get_user(target_id)
    if not target_user:
        await message.answer(f"❌ Користувача з ID <code>{target_id}</code> не знайдено в базі.", parse_mode="HTML")
        return

    new_energy, new_level = await db.update_user_energy(target_id, target_user["full_name"], amount)

    # Сповіщення адміну
    await message.answer(
        f"✅ <b>Успішно нараховано!</b>\n\n"
        f"👤 Гравець: <b>{html.escape(target_user['full_name'])}</b> (<code>{target_id}</code>)\n"
        f"⚡️ Зміна: <b>{'+' if amount > 0 else ''}{amount} EP</b>\n"
        f"🔋 Новий баланс: <b>{new_energy} EP</b> (Level {new_level})",
        parse_mode="HTML"
    )

    # Сповіщення гравцю
    try:
        await bot.send_message(
            target_id,
            f"🎁 <b>Адміністрація Webix OS нарахувала вам енергію!</b>\n\n"
            f"📥 Отримано: <b>+{amount} EP</b>\n"
            f"🔋 Ваш баланс: <b>{new_energy} EP</b> (Level {new_level})",
            parse_mode="HTML",
            reply_markup=get_keyboard_for_user(target_id, new_level)
        )
    except Exception as e:
        logger.warning(f"Не вдалося доставити сповіщення користувачу {target_id}: {e}")

@router.message(F.text == "📢 Розсилка")
async def cmd_admin_broadcast_info(message: types.Message):
    """Підказка для розсилки."""
    if not is_admin(message.from_user.id):
        return
    await message.answer(
        "📢 <b>Масова розсилка всім користувачам:</b>\n\n"
        "Надішліть команду:\n"
        "<code>/broadcast Ваш текст повідомлення</code>\n\n"
        "<i>Підтримується HTML-розмітка (жирний шрифт, емодзі, посилання).</i>",
        parse_mode="HTML"
    )

@router.message(Command("broadcast"))
async def cmd_admin_broadcast_action(message: types.Message, command: CommandObject, db: Database, bot: Bot):
    """Масова розсилка всім користувачам бота."""
    if not is_admin(message.from_user.id):
        await message.answer("❌ Доступ заборонено.")
        return

    if not command.args:
        await message.answer("Вкажіть текст для розсилки: <code>/broadcast Увага! Оновлення...</code>", parse_mode="HTML")
        return

    broadcast_text = command.args
    user_ids = await db.get_all_user_ids()

    if not user_ids:
        await message.answer("Немає користувачів для відправки.")
        return

    await message.answer(f"🚀 Починаємо розсилку для <b>{len(user_ids)}</b> користувачів...", parse_mode="HTML")

    success_count = 0
    fail_count = 0

    for uid in user_ids:
        try:
            await bot.send_message(
                uid,
                f"📢 <b>Офіційне повідомлення Webix OS:</b>\n\n{broadcast_text}",
                parse_mode="HTML"
            )
            success_count += 1
        except Exception:
            fail_count += 1

    await message.answer(
        f"✅ <b>Розсилку завершено!</b>\n\n"
        f"📬 Доставлено: <b>{success_count}</b>\n"
        f"🚫 Помилок: <b>{fail_count}</b>",
        parse_mode="HTML"
    )

@router.message(F.text.in_(["⚙️ Адмін-Панель", "/admin"]))
async def cmd_admin_panel(message: types.Message, db: Database):
    """Головне меню адмін-панелі."""
    if not is_admin(message.from_user.id):
        await message.answer("❌ Цей розділ призначений лише для адміністраторів.")
        return

    await message.answer(
        "⚙️ <b>Панель адміністратора Webix OS:</b>\n\n"
        "Використовуйте кнопки меню або швидкі команди:\n"
        "• <code>/stats</code> — статистика системи\n"
        "• <code>/users</code> — список гравців\n"
        "• <code>/give ID СУМА</code> — видати енергію\n"
        "• <code>/broadcast ТЕКСТ</code> — масова розсилка",
        parse_mode="HTML",
        reply_markup=get_admin_tools_inline()
    )

@router.callback_query(F.data == "adm_stats")
async def cb_admin_stats(query: types.CallbackQuery, db: Database):
    if not is_admin(query.from_user.id):
        await query.answer("Доступ заборонено.", show_alert=True)
        return
    stats = await db.get_total_stats()
    await query.message.answer(
        f"📊 <b>Статистика:</b>\n"
        f"Гравців: <b>{stats['total_users']}</b> | Енергії: <b>{stats['total_energy']} EP</b>",
        parse_mode="HTML"
    )
    await query.answer()

@router.callback_query(F.data == "adm_top")
async def cb_admin_top(query: types.CallbackQuery, db: Database):
    await cmd_top_players(query.message, db)
    await query.answer()

@router.callback_query(F.data == "adm_broadcast_help")
async def cb_admin_broadcast(query: types.CallbackQuery):
    await query.message.answer(
        "📢 Щоб зробити розсилку, надішліть команду:\n<code>/broadcast Ваш текст</code>",
        parse_mode="HTML"
    )
    await query.answer()
