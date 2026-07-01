import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { InstallButton } from "./InstallButton";
import { useSettings } from "@/hooks/useSettings";
import { useI18n, type Lang } from "@/hooks/useI18n";
import { haptic } from "@/lib/haptic";
import { useState } from "react";

export function NavBar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useSettings();
  const { lang, setLang, t } = useI18n();
  const [langOpen, setLangOpen] = useState(false);

  const tabs = [
    { to: "/", label: t("nav.station") },
    { to: "/reports", label: t("nav.reports") },
    { to: "/settings", label: t("nav.settings") },
    { to: "/calc", label: t("nav.calc") },
  ] as const;

  const langs: { id: Lang; label: string; flag: string }[] = [
    { id: "uz", label: "O'zbek", flag: "🇺🇿" },
    { id: "ru", label: "Русский", flag: "🇷🇺" },
    { id: "en", label: "English", flag: "🇬🇧" },
  ];
  const current = langs.find((l) => l.id === lang) ?? langs[0];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0" onClick={() => haptic("tap")}>
          <motion.div
            whileHover={{ rotate: 12 }}
            className="h-9 w-9 rounded-xl grad-primary glow grid place-items-center text-primary-foreground font-black"
          >
            ⛽
          </motion.div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold tracking-tight">FuelDesk</div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Smena hisob-kitobi
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="flex gap-1 p-1 rounded-full bg-secondary/60 border border-border/60">
            {tabs.map((tab) => {
              const active = pathname === tab.to;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  onClick={() => haptic("select")}
                  className="relative px-3 py-1.5 text-xs font-semibold rounded-full"
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 grad-primary rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative ${active ? "text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => {
                haptic("tap");
                setLangOpen((o) => !o);
              }}
              className="h-9 min-w-9 px-2 rounded-full border border-border/60 bg-secondary/60 grid place-items-center text-sm hover:border-primary/50 transition-colors"
              title={t("common.language")}
            >
              <span>{current.flag}</span>
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 mt-2 z-50 glass border border-border/60 rounded-2xl p-1 min-w-36 shadow-xl"
                >
                  {langs.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        haptic("select");
                        setLang(l.id);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-secondary/60 transition-colors ${
                        lang === l.id ? "text-primary" : "text-foreground"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                      {lang === l.id && <span className="ml-auto text-primary">•</span>}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </div>

          <button
            onClick={() => {
              haptic("tap");
              toggleTheme();
            }}
            className="h-9 w-9 rounded-full border border-border/60 bg-secondary/60 grid place-items-center text-sm hover:border-primary/50 transition-colors"
            title={theme === "dark" ? "Yorug' tema" : "Qorong'i tema"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <InstallButton />
        </div>
      </div>
    </header>
  );
}
