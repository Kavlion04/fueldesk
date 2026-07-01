import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { NavBar } from "@/components/NavBar";
import { fmt } from "@/lib/format";
import { DEFAULT_FUEL_PRICES, type FuelId, useSettings } from "@/hooks/useSettings";
import { useDialog } from "@/hooks/useDialog";
import { useI18n, type Lang } from "@/hooks/useI18n";
import { haptic, setHapticEnabled } from "@/lib/haptic";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "FuelDesk — Sozlamalar" }] }),
  component: SettingsPage,
});

const LOCAL_SHIFTS_KEY = "fueldesk:localShifts";
const TRASH_SHIFTS_KEY = "fueldesk:trashShifts";

const FUELS: Array<{ id: FuelId; label: string }> = [
  { id: "92k4", label: "Ai-92 K4" },
  { id: "92k5", label: "Ai-92 K5" },
  { id: "95", label: "Ai-95 K5" },
  { id: "98", label: "Ai-98 K5" },
];

type TrashShift = {
  id: string;
  shift_number: number | null;
  created_at: string;
  total_revenue: number;
  total_paid: number;
  diff: number;
  // keep the rest for restore
  [k: string]: any;
};

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}

function SettingsPage() {
  const { fuelPrices, setFuelPrice, resetFuelPrices, cart, addCartItem, removeCartItem, clearCart, cartTotal } =
    useSettings();

  const dialog = useDialog();
  const { lang, setLang, t } = useI18n();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [trash, setTrash] = useState<TrashShift[]>(() => loadJSON<TrashShift[]>(TRASH_SHIFTS_KEY, []));

  // Haptic
  const [hapticOn, setHapticOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try { const r = localStorage.getItem("fueldesk:haptic"); return r ? JSON.parse(r) : true; } catch { return true; }
  });
  useEffect(() => { setHapticEnabled(hapticOn); }, [hapticOn]);

  // Telegram
  const [tgChatId, setTgChatId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("fueldesk:tgChatId") ?? "";
  });
  useEffect(() => { localStorage.setItem("fueldesk:tgChatId", tgChatId); }, [tgChatId]);

  const canAdd = useMemo(() => name.trim().length > 0, [name]);

  const languages: { id: Lang; label: string; flag: string }[] = [
    { id: "uz", label: "O'zbek", flag: "🇺🇿" },
    { id: "ru", label: "Русский", flag: "🇷🇺" },
    { id: "en", label: "English", flag: "🇬🇧" },
  ];

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-6xl mx-auto px-5 py-8 space-y-8">
        <section>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-black tracking-tight mb-2"
          >
            Sozlamalar<span className="text-primary">.</span>
          </motion.h1>
          <p className="text-muted-foreground text-sm">Fuel narxlari va korzinka (local saqlanadi).</p>
        </section>

        {/* Fuel prices */}
        <section className="glass rounded-3xl border border-border/60 p-5 md:p-6">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Fuel price</div>
              <div className="font-bold text-lg tracking-tight">Yoqilg'i narxlari</div>
            </div>
            <button
              onClick={resetFuelPrices}
              className="px-3 py-2 rounded-xl border border-border/60 hover:bg-background/60 transition-colors text-xs font-semibold"
              title="Default narxlarga qaytarish"
            >
              Default
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FUELS.map((f) => (
              <div key={f.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="text-xs font-semibold mb-2">{f.label}</div>
                <div className="flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    value={String(fuelPrices[f.id] ?? DEFAULT_FUEL_PRICES[f.id])}
                    onChange={(e) => setFuelPrice(f.id, Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
                    className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/60"
                    aria-label={`${f.label} narxi`}
                  />
                  <span className="text-xs text-muted-foreground shrink-0">so'm/L</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cart */}
        <section className="glass rounded-3xl border border-border/60 p-5 md:p-6">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Korzinka</div>
              <div className="font-bold text-lg tracking-tight">Qo'shimcha ro'yxat</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Jami</div>
              <div className="num-display font-black text-primary">{fmt(cartTotal)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nomi (masalan: Suv, Shirinlik...)"
              className="md:col-span-6 rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary/60"
            />
            <input
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="Soni"
              className="md:col-span-2 rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary/60"
            />
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="Narxi"
              className="md:col-span-2 rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary/60"
            />
            <button
              disabled={!canAdd}
              onClick={() => {
                addCartItem({
                  name,
                  qty: Number(qty || "1"),
                  price: Number(price || "0"),
                });
                setName("");
                setQty("1");
                setPrice("");
              }}
              className="md:col-span-2 grad-primary text-primary-foreground font-bold rounded-2xl glow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Qo'shish
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="text-sm text-muted-foreground/80">Hali item yo'q.</div>
          ) : (
            <div className="space-y-2">
              {cart.map((it) => (
                <div
                  key={it.id}
                  className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{it.name}</div>
                    <div className="text-xs text-muted-foreground num-display">
                      {it.qty} × {fmt(it.price)} = {fmt(it.qty * it.price)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeCartItem(it.id)}
                    className="px-3 py-2 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors text-xs font-semibold shrink-0"
                  >
                    O'chirish
                  </button>
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  onClick={clearCart}
                  className="px-3 py-2 rounded-xl border border-border/60 hover:bg-background/60 transition-colors text-xs font-semibold"
                >
                  Tozalash
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Deleted shifts trash */}
        <section className="glass rounded-3xl border border-border/60 p-5 md:p-6">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Korzinka</div>
              <div className="font-bold text-lg tracking-tight">O'chirilgan smenalar</div>
            </div>
            {trash.length > 0 && (
              <button
                onClick={async () => {
                  if (!(await dialog.confirm({ title: "Korzinkani tozalash", message: "Korzinkani butunlay tozalaysizmi?", tone: "warn", confirmLabel: "Tozalash" }))) return;
                  setTrash([]);
                  localStorage.setItem(TRASH_SHIFTS_KEY, JSON.stringify([]));
                }}
                className="px-3 py-2 rounded-xl border border-border/60 hover:bg-background/60 transition-colors text-xs font-semibold"
              >
                Tozalash
              </button>
            )}
          </div>

          {trash.length === 0 ? (
            <div className="text-sm text-muted-foreground/80">Korzinka bo'sh.</div>
          ) : (
            <div className="space-y-2">
              {trash.map((s) => {
                const dt = s.created_at ? new Date(s.created_at) : null;
                const title = `Smena #${s.shift_number ?? "—"}`;
                const subtitle = dt ? dt.toLocaleString("ru-RU") : "";
                return (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{title}</div>
                      <div className="text-xs text-muted-foreground num-display">
                        {subtitle} · {fmt(Number(s.total_revenue ?? 0))} so'm
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const curLocal = loadJSON<any[]>(LOCAL_SHIFTS_KEY, []);
                          const nextLocal = [s, ...curLocal.filter((x) => x.id !== s.id)];
                          localStorage.setItem(LOCAL_SHIFTS_KEY, JSON.stringify(nextLocal));

                          const nextTrash = trash.filter((x) => x.id !== s.id);
                          setTrash(nextTrash);
                          localStorage.setItem(TRASH_SHIFTS_KEY, JSON.stringify(nextTrash));
                        }}
                        className="px-3 py-2 rounded-xl border border-border/60 hover:bg-background/60 transition-colors text-xs font-semibold"
                      >
                        Qaytarish
                      </button>
                      <button
                        onClick={async () => {
                          if (!(await dialog.confirm({ title: "Butunlay o'chirish", message: "Butunlay o'chirasizmi? Qaytarib bo'lmaydi.", tone: "danger", confirmLabel: "O'chirish" }))) return;
                          const nextTrash = trash.filter((x) => x.id !== s.id);
                          setTrash(nextTrash);
                          localStorage.setItem(TRASH_SHIFTS_KEY, JSON.stringify(nextTrash));
                        }}
                        className="px-3 py-2 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors text-xs font-semibold"
                      >
                        O'chirish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

