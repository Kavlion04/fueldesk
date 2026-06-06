import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { InstallButton } from "./InstallButton";
import { useSettings } from "@/hooks/useSettings";

const tabs = [
  { to: "/", label: "Stansiya" },
  { to: "/reports", label: "Hisobot" },
  { to: "/settings", label: "Sozlama" },
  { to: "/calc", label: "Kalk." },
] as const;

export function NavBar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useSettings();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
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
            {tabs.map((t) => {
              const active = pathname === t.to;
              return (
                <Link
                  key={t.to}
                  to={t.to}
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
                    {t.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          <button
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full border border-border/60 bg-secondary/60 grid place-items-center text-sm hover:border-primary/50 transition-colors"
            title={theme === "dark" ? "Yorug' tema" : "Qorong'i tema"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <InstallButton />
          {/* session/signOut removed */}
        </div>
      </div>
    </header>
  );
}
