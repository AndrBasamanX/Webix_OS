// Налаштування для зв'язку з Telegram ботом
export const BOT_USERNAME = "Webixbot_app_bot";
export const APP_VERSION = "v2.5";

// Telegram ID адміністраторів (повинні збігатися з ADMIN_IDS у backend/.env)
export const ADMIN_IDS = [8741071265];

/**
 * Перевірити чи є користувач адміністратором
 * @param {number|string} telegramUserId
 * @returns {boolean}
 */
export function isAdmin(telegramUserId) {
  return ADMIN_IDS.includes(Number(telegramUserId));
}

