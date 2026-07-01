import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "uz" | "ru" | "en";

const LANG_KEY = "fueldesk:lang";

type Dict = Record<string, string>;

const DICTS: Record<Lang, Dict> = {
  uz: {
    "nav.station": "Stansiya",
    "nav.reports": "Hisobot",
    "nav.settings": "Sozlama",
    "nav.calc": "Kalk.",
    "common.save": "Saqlash",
    "common.clear": "Tozalash",
    "common.cancel": "Bekor qilish",
    "common.delete": "O'chirish",
    "common.close": "Yopish",
    "common.total": "Jami",
    "common.loading": "Yuklanmoqda...",
    "common.language": "Til",
    "reports.title": "Hisobotlar",
    "reports.day": "Bugun",
    "reports.week": "Hafta",
    "reports.month": "Oy",
    "reports.empty": "Hozircha ma'lumot yo'q.",
    "reports.shifts": "Smenalar",
    "reports.revenue": "Jami summa",
    "reports.paid": "Jami to'lovlar",
    "reports.diff": "Umumiy farq",
    "reports.dynamics": "Daromad / To'lov dinamikasi",
    "pull.release": "Yangilash uchun qo'yib yuboring",
    "pull.pull": "Yangilash uchun torting",
    "pull.refreshing": "Yangilanmoqda...",
    "settings.language": "Ilova tili",
    "settings.telegram": "Telegram bot",
    "settings.telegram.desc": "Smena yopilganda xulosa Telegram guruhingizga yuborilsin.",
    "settings.telegram.chatId": "Chat ID yoki @username",
    "settings.telegram.test": "Test xabar yuborish",
    "settings.haptic": "Titrash (haptic)",
    "share.qr": "QR bilan ulashish",
    "share.qr.desc": "Ushbu smenani boshqa qurilmada ochish uchun QR kodni skanerlang.",
  },
  ru: {
    "nav.station": "Станция",
    "nav.reports": "Отчёты",
    "nav.settings": "Настройки",
    "nav.calc": "Калк.",
    "common.save": "Сохранить",
    "common.clear": "Очистить",
    "common.cancel": "Отмена",
    "common.delete": "Удалить",
    "common.close": "Закрыть",
    "common.total": "Итого",
    "common.loading": "Загрузка...",
    "common.language": "Язык",
    "reports.title": "Отчёты",
    "reports.day": "День",
    "reports.week": "Неделя",
    "reports.month": "Месяц",
    "reports.empty": "Пока нет данных.",
    "reports.shifts": "Смены",
    "reports.revenue": "Общая сумма",
    "reports.paid": "Оплачено",
    "reports.diff": "Разница",
    "reports.dynamics": "Динамика выручки / оплат",
    "pull.release": "Отпустите для обновления",
    "pull.pull": "Потяните для обновления",
    "pull.refreshing": "Обновление...",
    "settings.language": "Язык приложения",
    "settings.telegram": "Telegram бот",
    "settings.telegram.desc": "Отправлять итоги закрытия смены в ваш Telegram.",
    "settings.telegram.chatId": "Chat ID или @username",
    "settings.telegram.test": "Отправить тестовое сообщение",
    "settings.haptic": "Вибрация",
    "share.qr": "Поделиться через QR",
    "share.qr.desc": "Сканируйте QR, чтобы открыть смену на другом устройстве.",
  },
  en: {
    "nav.station": "Station",
    "nav.reports": "Reports",
    "nav.settings": "Settings",
    "nav.calc": "Calc.",
    "common.save": "Save",
    "common.clear": "Clear",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.close": "Close",
    "common.total": "Total",
    "common.loading": "Loading...",
    "common.language": "Language",
    "reports.title": "Reports",
    "reports.day": "Today",
    "reports.week": "Week",
    "reports.month": "Month",
    "reports.empty": "No data yet.",
    "reports.shifts": "Shifts",
    "reports.revenue": "Total revenue",
    "reports.paid": "Total paid",
    "reports.diff": "Difference",
    "reports.dynamics": "Revenue / Payment dynamics",
    "pull.release": "Release to refresh",
    "pull.pull": "Pull to refresh",
    "pull.refreshing": "Refreshing...",
    "settings.language": "App language",
    "settings.telegram": "Telegram bot",
    "settings.telegram.desc": "Send shift closing summary to your Telegram.",
    "settings.telegram.chatId": "Chat ID or @username",
    "settings.telegram.test": "Send test message",
    "settings.haptic": "Haptic feedback",
    "share.qr": "Share via QR",
    "share.qr.desc": "Scan the QR to open this shift on another device.",
  },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx | undefined>(undefined);

function loadLang(): Lang {
  if (typeof window === "undefined") return "uz";
  try {
    const r = localStorage.getItem(LANG_KEY);
    if (r === "uz" || r === "ru" || r === "en") return r;
  } catch {}
  return "uz";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {}
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback(
    (key: string) => DICTS[lang][key] ?? DICTS.uz[key] ?? key,
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) {
    // graceful fallback if provider missing
    return {
      lang: "uz" as Lang,
      setLang: () => {},
      t: (k: string) => DICTS.uz[k] ?? k,
    };
  }
  return c;
}
