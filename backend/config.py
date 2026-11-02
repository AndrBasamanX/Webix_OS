import os
from typing import List
from dotenv import load_dotenv

# Завантаження змінних оточення з .env
load_dotenv()

BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")
DATABASE_URL: str = os.getenv("DATABASE_URL", "")
WEBAPP_URL: str = os.getenv("WEBAPP_URL", "https://andrbasamanx.github.io/Webix_OS/")
SQLITE_PATH: str = os.getenv("SQLITE_PATH", "webix.db")
BOT_USERNAME: str = os.getenv("BOT_USERNAME", "Webixbot_app_bot")

# Список ID адміністраторів (розділених комами у .env: ADMIN_IDS=1234567,9876543)
_raw_admins = os.getenv("ADMIN_IDS", "")
ADMIN_IDS: List[int] = [
    int(x.strip()) for x in _raw_admins.split(",") if x.strip().isdigit()
]

def is_admin(user_id: int) -> bool:
    """Перевірка чи є користувач адміністратором."""
    if not ADMIN_IDS:
        return False
    return user_id in ADMIN_IDS
