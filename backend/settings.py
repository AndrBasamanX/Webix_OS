# backend/settings.py
# Аліас до backend/config.py для зручності та зворотної сумісності
import sys
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.config import (
    BOT_TOKEN,
    DATABASE_URL,
    WEBAPP_URL,
    SQLITE_PATH,
    BOT_USERNAME,
)

__all__ = [
    "BOT_TOKEN",
    "DATABASE_URL",
    "WEBAPP_URL",
    "SQLITE_PATH",
    "BOT_USERNAME",
]

