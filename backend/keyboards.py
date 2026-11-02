from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo
)

# ==========================================
# 1. REPLY КЛАВІАТУРА ДЛЯ ЗВИЧАЙНОГО КОРИСТУВАЧА (ЗА РІВНЯМИ)
# ==========================================
def get_user_reply_keyboard(level: int, webapp_url: str) -> ReplyKeyboardMarkup:
    """
    Динамічна Reply-клавіатура для користувача.
    Функції відкриваються з підвищенням рівня:
    - Level 1: WebApp, Мій профіль, Топ гравців, Довідка
    - Level 2: Щоденний бонус (+50 EP), Енерго-Рулетка
    - Level 3+: Промокоди, Пасивний майнінг
    """
    keyboard = []

    # Рядок 1: Головна кнопка запуску WebApp
    keyboard.append([
        KeyboardButton(text="⚡️ Відкрити Webix OS", web_app=WebAppInfo(url=webapp_url))
    ])

    # Рядок 2: Базові функції
    keyboard.append([
        KeyboardButton(text="🔋 Мій профіль"),
        KeyboardButton(text="🏆 Топ гравців")
    ])

    # Рядок 3: Функції Рівня 2
    if level >= 2:
        keyboard.append([
            KeyboardButton(text="🎁 Щоденний бонус"),
            KeyboardButton(text="🎲 Енерго-Рулетка")
        ])
    else:
        keyboard.append([
            KeyboardButton(text="🔒 Бонус (з Lvl 2)"),
            KeyboardButton(text="🔒 Рулетка (з Lvl 2)")
        ])

    # Рядок 4: Функції Рівня 3+
    if level >= 3:
        keyboard.append([
            KeyboardButton(text="🎟 Промокод"),
            KeyboardButton(text="⚡️ Майнінг")
        ])
    else:
        keyboard.append([
            KeyboardButton(text="🔒 Промокод (з Lvl 3)"),
            KeyboardButton(text="🔒 Майнінг (з Lvl 3)")
        ])

    # Рядок 5: Довідкова інформація
    keyboard.append([
        KeyboardButton(text="ℹ️ Довідка та Рівні")
    ])

    return ReplyKeyboardMarkup(
        keyboard=keyboard,
        resize_keyboard=True,
        input_field_placeholder="Оберіть дію в меню Webix OS 👇"
    )

# ==========================================
# 2. REPLY КЛАВІАТУРА ДЛЯ АДМІНІСТРАТОРА (FULL ACCESS)
# ==========================================
def get_admin_reply_keyboard(webapp_url: str) -> ReplyKeyboardMarkup:
    """
    Повна Reply-клавіатура для адміністратора:
    Усі функції гравця розблоковані відразу + спеціальний адмін-блок керування.
    """
    keyboard = [
        # Головний запуск WebApp
        [KeyboardButton(text="⚡️ Відкрити Webix OS", web_app=WebAppInfo(url=webapp_url))],

        # Ігрові функції (без обмежень рівня)
        [
            KeyboardButton(text="🔋 Мій профіль"),
            KeyboardButton(text="🏆 Топ гравців")
        ],
        [
            KeyboardButton(text="🎁 Щоденний бонус"),
            KeyboardButton(text="🎲 Енерго-Рулетка")
        ],
        [
            KeyboardButton(text="🎟 Промокод"),
            KeyboardButton(text="⚡️ Майнінг")
        ],

        # 👑 АДМІНІСТРАТИВНИЙ БЛОК
        [
            KeyboardButton(text="📊 Статистика системи"),
            KeyboardButton(text="👥 Користувачі")
        ],
        [
            KeyboardButton(text="⚡️ Видати EP"),
            KeyboardButton(text="📢 Розсилка")
        ],
        [
            KeyboardButton(text="⚙️ Адмін-Панель"),
            KeyboardButton(text="ℹ️ Довідка та Рівні")
        ]
    ]

    return ReplyKeyboardMarkup(
        keyboard=keyboard,
        resize_keyboard=True,
        input_field_placeholder="👑 Панель адміністратора Webix OS"
    )

# ==========================================
# 3. ІНЛАЙН-КЛАВІАТУРИ
# ==========================================
def get_webapp_keyboard(url: str, text: str = "⚡️ Відкрити Webix OS") -> InlineKeyboardMarkup:
    """Генерація інлайн-кнопки для відкриття Telegram Mini App."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=text, web_app=WebAppInfo(url=url))]
        ]
    )

def get_energy_confirmed_keyboard(url: str) -> InlineKeyboardMarkup:
    """Клавіатура після успішної передачі енергії."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="⚡️ Повернутися до гри", web_app=WebAppInfo(url=url))]
        ]
    )

def get_roulette_keyboard() -> InlineKeyboardMarkup:
    """Кнопка запуску рулетки."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🎰 Крутити барабан! (-10 EP)", callback_data="spin_roulette")]
        ]
    )

def get_admin_tools_inline() -> InlineKeyboardMarkup:
    """Швидкі інлайн-кнопки в адмін-панелі."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="📊 Статистика", callback_data="adm_stats"),
                InlineKeyboardButton(text="👥 Топ гравців", callback_data="adm_top")
            ],
            [
                InlineKeyboardButton(text="📢 Створити розсилку", callback_data="adm_broadcast_help")
            ]
        ]
    )
