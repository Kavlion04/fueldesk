import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/NavBar";
import { MeterInput } from "@/components/MeterInput";
import { MoneyInput } from "@/components/MoneyInput";
import { NumberCard } from "@/components/NumberCard";
import { fmt, fmtSigned, toNum } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useSettings } from "@/hooks/useSettings";
import { useDialog } from "@/hooks/useDialog";
import { FuelLoader, FuelLoaderOverlay } from "@/components/FuelLoader";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "FuelDesk — Smena hisob-kitobi" },
      { name: "description", content: "Yoqilg'i shahobchasi smena yopish kalkulyatori." },
    ],
  }),
  component: HomePage,
});

const FUELS = [
  { id: "92k4", name: "Ai-92", grade: "K4", price: 11200, color: "var(--color-fuel-92k4)" },
  { id: "92k5", name: "Ai-92", grade: "K5", price: 11900, color: "var(--color-fuel-92k5)" },
  { id: "95",   name: "Ai-95", grade: "K5",   price: 13900, color: "var(--color-fuel-95)"   },
  { id: "98",   name: "Ai-98", grade: "K5",   price: 18500, color: "var(--color-fuel-98)"   },
] as const;

const PAYMENTS = [
  { id: "terminal", label: "Terminal" },
  { id: "online",   label: "Online karta" },
  { id: "yandex",   label: "Yandex" },
  { id: "other",    label: "Boshqa" },
] as const;

type FuelId = typeof FUELS[number]["id"];
type PayId = typeof PAYMENTS[number]["id"];
type SideMap = Record<FuelId, { a: string; b: string }>;
const emptySides: SideMap = {
  "92k4": { a: "", b: "" }, "92k5": { a: "", b: "" },
  "95":   { a: "", b: "" }, "98":   { a: "", b: "" },
};
const emptyPays: Record<PayId, string> = { online: "", terminal: "", yandex: "", other: "" };
const DRAFT_KEY = "fueldesk:draft";
const LOCAL_SHIFTS_KEY = "fueldesk:localShifts";
const TRASH_SHIFTS_KEY = "fueldesk:trashShifts";
const MORNING_NOTE_KEY = "fueldesk:morningNote";

interface MorningNote {
  tops: SideMap;
  text: string;
  image: string | null; // base64 data URL
  autoApply: boolean;
  savedAt: string;
}
const emptyNote: MorningNote = {
  tops: emptySides,
  text: "",
  image: null,
  autoApply: true,
  savedAt: "",
};

interface DbShift {
  id: string;
  user_id?: string;
  shift_number: number | null;
  shift_date: string;
  operator_name: string | null;
  tops: SideMap;
  bots: SideMap;
  pays: Record<PayId, string>;
  total_revenue: number;
  total_paid: number;
  diff: number;
  deficit_reason: string | null;
  created_at: string;
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fallback; }
  catch { return fallback; }
}

function HomePage() {
  // Auth removed: always show home page
  const navigate = useNavigate();
  const { fuelPrices } = useSettings();
  const dialog = useDialog();
  const [open, setOpen] = useState(false);
  const [tops, setTops] = useState<SideMap>(emptySides);
  const [bots, setBots] = useState<SideMap>(emptySides);
  const [pays, setPays] = useState<Record<PayId, string>>(emptyPays);
  const [deficitReason, setDeficitReason] = useState("");
  const [shifts, setShifts] = useState<DbShift[]>([]);
  const [localShifts, setLocalShifts] = useState<DbShift[]>([]);
  const [detail, setDetail] = useState<DbShift | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextNumber, setNextNumber] = useState<number>(1);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editingShiftNumber, setEditingShiftNumber] = useState<number | null>(null);
  const [note, setNote] = useState<MorningNote>(emptyNote);
  const [noteOpen, setNoteOpen] = useState(false);
  const [imgPreview, setImgPreview] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadJSON<{ tops: SideMap; bots: SideMap; pays: Record<PayId, string>; open?: boolean; deficitReason?: string } | null>(DRAFT_KEY, null);
    if (draft) {
      setTops(draft.tops ?? emptySides);
      setBots(draft.bots ?? emptySides);
      setPays(draft.pays ?? emptyPays);
      setDeficitReason(draft.deficitReason ?? "");
      if (draft.open) setOpen(true);
    }
    const local = loadJSON<DbShift[]>(LOCAL_SHIFTS_KEY, []);
    if (local?.length) setLocalShifts(local);

    const savedNote = loadJSON<MorningNote | null>(MORNING_NOTE_KEY, null);
    if (savedNote) {
      const merged: MorningNote = { ...emptyNote, ...savedNote, tops: { ...emptySides, ...(savedNote.tops ?? {}) } };
      setNote(merged);
      // Auto-apply morning note to "tops" if enabled, no draft existed, and tops are empty
      const topsEmpty = !draft || Object.values(draft.tops ?? emptySides).every((s) => !s.a && !s.b);
      if (merged.autoApply && topsEmpty) {
        const hasAny = Object.values(merged.tops).some((s) => s.a || s.b);
        if (hasAny) setTops(merged.tops);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ tops, bots, pays, open, deficitReason }));
  }, [tops, bots, pays, open, deficitReason, hydrated]);

  // Persist morning note (with quota-safe fallback)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(MORNING_NOTE_KEY, JSON.stringify(note));
    } catch {
      try {
        localStorage.setItem(MORNING_NOTE_KEY, JSON.stringify({ ...note, image: null }));
      } catch { /* ignore */ }
    }
  }, [note, hydrated]);

  const applyNoteToMorning = () => {
    setTops(note.tops);
    setOpen(true);
  };
  const saveNoteFromMorning = () => {
    setNote((n) => ({ ...n, tops, savedAt: new Date().toISOString() }));
  };
  const clearNote = async () => {
    if (!(await dialog.confirm({ title: "Zametkani tozalash", message: "Zametkani tozalaymizmi?", tone: "warn", confirmLabel: "Tozalash" }))) return;
    setNote({ ...emptyNote, autoApply: note.autoApply });
  };

  // Downscale & compress so the base64 fits in localStorage
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Rasmni ochib bo'lmadi"));
        img.onload = () => {
          const MAX = 1280;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            const r = Math.min(MAX / width, MAX / height);
            width = Math.round(width * r);
            height = Math.round(height * r);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas mavjud emas"));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

  const [imgLoading, setImgLoading] = useState(false);
  const onImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      await dialog.alert({ title: "Noto'g'ri fayl", message: "Faqat rasm yuklash mumkin.", tone: "warn" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      await dialog.alert({ title: "Rasm juda katta", message: "Rasm 15MB dan kichik bo'lsin.", tone: "warn" });
      return;
    }
    setImgLoading(true);
    try {
      const dataUrl = await compressImage(file);
      setNote((n) => ({ ...n, image: dataUrl, savedAt: new Date().toISOString() }));
    } catch (e: any) {
      await dialog.alert({ title: "Xatolik", message: e?.message ?? "Rasmni qayta ishlab bo'lmadi.", tone: "danger" });
    } finally {
      setImgLoading(false);
    }
  };


  const fetchShifts = async (localOverride?: DbShift[]) => {
    const local = localOverride ?? localShifts;
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      // If backend is locked by RLS/401, keep working off local shifts
      const maxLocal = local.reduce((m, s) => Math.max(m, s.shift_number ?? 0), 0);
      setShifts(local);
      setNextNumber(maxLocal + 1);
      return;
    }
    const remote = (data as unknown as DbShift[]) ?? [];
    const merged = [...local, ...remote].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setShifts(merged);
    const max = merged.reduce((m, s: any) => Math.max(m, s.shift_number ?? 0), 0);
    setNextNumber(max + 1);
  };

  useEffect(() => { fetchShifts(); }, [localShifts]);

  const rows = useMemo(() =>
    FUELS.map((f) => {
      const price = fuelPrices[f.id] ?? f.price;
      const topSum = toNum(tops[f.id].a) + toNum(tops[f.id].b);
      const botSum = toNum(bots[f.id].a) + toNum(bots[f.id].b);
      const liters = Math.abs(botSum - topSum);
      return { ...f, price, topSum, botSum, liters, subtotal: liters * price };
    }), [tops, bots, fuelPrices]);

  const totalRevenue = rows.reduce((s, r) => s + r.subtotal, 0);
  const totalPaid = PAYMENTS.reduce((s, p) => s + toNum(pays[p.id]), 0);
  const diff = totalPaid - totalRevenue;
  const isDeficit = diff < 0;

  const saveSession = async () => {
    if (isDeficit && !deficitReason.trim()) {
      await dialog.alert({ title: "Defitsit aniqlandi", message: "Defitsit bor — sababini yozing.", tone: "danger" });
      return;
    }

    setSaving(true);
    try {
      const shiftDate = new Date().toISOString().slice(0, 10);
      const createdAt = new Date().toISOString();
      // Ensure we have a session (needed for RLS-protected tables)
      let userId: string | undefined;
      try {
        let { data: sess } = await supabase.auth.getSession();
        if (!sess.session) {
          await supabase.auth.signInAnonymously();
          sess = (await supabase.auth.getSession()).data;
        }
        userId = sess.session?.user?.id;
      } catch {
        // ignore auth errors; we'll save locally
      }

      const targetShiftNumber = editingShiftNumber ?? nextNumber;

      // Try remote save only if we have a userId (schema requires user_id)
      if (userId) {
        const payload = {
          user_id: userId,
          shift_number: targetShiftNumber,
          shift_date: shiftDate,
          operator_name: null,
          tops,
          bots,
          pays,
          total_revenue: totalRevenue,
          total_paid: totalPaid,
          diff,
          deficit_reason: isDeficit ? deficitReason.trim() : null,
        };

        const { error } = editingShiftId
          ? await supabase.from("shifts").update(payload).eq("id", editingShiftId)
          : await supabase.from("shifts").insert(payload);
        if (!error) {
          // remote success
          localStorage.removeItem(DRAFT_KEY);
          setTops(emptySides);
          setBots(emptySides);
          setPays(emptyPays);
          setDeficitReason("");
          setOpen(false);
          setDetail(null);
          setEditingShiftId(null);
          setEditingShiftNumber(null);
          await fetchShifts();
          navigate({ to: "/" });
          return;
        }
      }

      // Fallback: store locally so the app remains usable even if Supabase auth/RLS blocks writes
      if (editingShiftId) {
        const nextLocal = localShifts.map((s) =>
          s.id !== editingShiftId
            ? s
            : {
                ...s,
                user_id: userId ?? s.user_id,
                shift_number: targetShiftNumber,
                shift_date: shiftDate,
                operator_name: null,
                tops,
                bots,
                pays,
                total_revenue: totalRevenue,
                total_paid: totalPaid,
                diff,
                deficit_reason: isDeficit ? deficitReason.trim() : null,
              },
        );
        setLocalShifts(nextLocal);
        localStorage.setItem(LOCAL_SHIFTS_KEY, JSON.stringify(nextLocal));
        await fetchShifts(nextLocal);
      } else {
        const localShift: DbShift = {
          id: crypto.randomUUID(),
          user_id: userId,
          shift_number: targetShiftNumber,
          shift_date: shiftDate,
          operator_name: null,
          tops,
          bots,
          pays,
          total_revenue: totalRevenue,
          total_paid: totalPaid,
          diff,
          deficit_reason: isDeficit ? deficitReason.trim() : null,
          created_at: createdAt,
        };
        const nextLocal = [localShift, ...localShifts];
        setLocalShifts(nextLocal);
        localStorage.setItem(LOCAL_SHIFTS_KEY, JSON.stringify(nextLocal));
        await fetchShifts(nextLocal);
      }

      localStorage.removeItem(DRAFT_KEY);
      setTops(emptySides);
      setBots(emptySides);
      setPays(emptyPays);
      setDeficitReason("");
      setOpen(false);
      setDetail(null);
      setEditingShiftId(null);
      setEditingShiftNumber(null);

      // fetchShifts already ran with the newest local snapshot above
      navigate({ to: "/" });
    } catch (e: any) {
      await dialog.alert({ title: "Xatolik", message: e?.message ?? "Saqlashda xatolik.", tone: "danger" });
    } finally {
      setSaving(false);
    }
  };
  const fmtShift = (s: DbShift) => {
    const d = new Date(s.created_at);
    return `Smena #${s.shift_number ?? "—"} · ${d.toLocaleDateString("ru-RU")} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  };
  const loadSession = async (s: DbShift) => {
    if (!(await dialog.confirm({
      title: "Smenani yuklash",
      message: `Hozirgi hisob-kitob saqlanmaydi.\n\n${fmtShift(s)}`,
      tone: "warn",
      confirmLabel: "Yuklash",
    }))) return false;
    setTops(s.tops); setBots(s.bots); setPays(s.pays);
    setDeficitReason(s.deficit_reason ?? ""); setOpen(true);
    setEditingShiftId(s.id);
    setEditingShiftNumber(s.shift_number ?? null);
    return true;
  }

  const removeSession = async (id: string) => {
    if (!(await dialog.confirm({ title: "Smenani o'chirish", message: "Smenani o'chirasizmi? Korzinkadan qaytarib olish mumkin.", tone: "danger", confirmLabel: "O'chirish" }))) return;
    // move to trash (local) first so user can restore
    const toTrash = shifts.find((s) => s.id === id) ?? localShifts.find((s) => s.id === id);
    if (toTrash) {
      const curTrash = loadJSON<DbShift[]>(TRASH_SHIFTS_KEY, []);
      const nextTrash = [toTrash, ...curTrash.filter((s) => s.id !== id)];
      localStorage.setItem(TRASH_SHIFTS_KEY, JSON.stringify(nextTrash));
    }

    // try remote delete (may fail under RLS)
    await supabase.from("shifts").delete().eq("id", id);

    // remove from local list immediately
    const nextLocal = localShifts.filter((s) => s.id !== id);
    if (nextLocal.length !== localShifts.length) {
      setLocalShifts(nextLocal);
      localStorage.setItem(LOCAL_SHIFTS_KEY, JSON.stringify(nextLocal));
    }
    setShifts((prev) => prev.filter((s) => s.id !== id));
    setDetail(null);
    fetchShifts(nextLocal);
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence>{saving && <FuelLoaderOverlay label="Smena saqlanmoqda…" />}</AnimatePresence>
      <NavBar />
      <main className="max-w-6xl mx-auto px-5 py-8">
        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-black tracking-tight"
            >
              Smena #{editingShiftNumber ?? nextNumber}<span className="text-primary">.</span>
            </motion.h1>
            <p className="text-muted-foreground mt-2 max-w-md">
              <span className="font-bold">Sanoq:</span> {rows.reduce((s, r) => s + r.liters, 0).toLocaleString("ru-RU")} litr
              <br />      
              <span className="font-bold">Summa:</span> {totalRevenue.toLocaleString("ru-RU")} so'm
              {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        </section>

        {/* Morning Note (zametka) */}
        <section className="mb-4">
          <div className="glass rounded-2xl border border-border/60 overflow-hidden">
            <div className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-background/40 transition-colors">
              <button
                onClick={() => setNoteOpen((v) => !v)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <motion.span animate={{ rotate: noteOpen ? 90 : 0 }} className="h-9 w-9 rounded-xl bg-accent/15 border border-accent/40 grid place-items-center text-accent text-lg shrink-0">📝</motion.span>
                <div className="text-left min-w-0">
                  <div className="font-bold text-sm">Ertalabki zametka</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {note.savedAt
                      ? `Saqlangan: ${new Date(note.savedAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                      : "Ertalabki sanoqni saqlab qo'ying — keyin avtomatik to'ldiriladi"}
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <AnimatePresence>
                  {open && !editingShiftId && Object.values(note.tops).some((s) => s.a || s.b) && (
                    <motion.button
                      key="apply-plus"
                      initial={{ opacity: 0, scale: 0.6, x: 8 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.6, x: 8 }}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.08, rotate: 90 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setTops(note.tops);
                        await dialog.alert({ title: "Qo'shildi", message: "Zametkadagi qiymatlar ertalabki sanoqqa o'tkazildi." });
                      }}
                      title="Zametkadagi qiymatlarni ertalabga qo'shish"
                      className="relative h-9 w-9 rounded-xl grad-primary grid place-items-center text-primary-foreground text-xl font-bold glow"
                    >
                      <motion.span
                        className="absolute inset-0 rounded-xl grad-primary opacity-50 blur-md -z-10"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      />
                      +
                    </motion.button>
                  )}
                </AnimatePresence>
                {note.image && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent">📷 rasm</span>}
                {note.autoApply && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">avto</span>}
                <button onClick={() => setNoteOpen((v) => !v)} className="p-1">
                  <motion.span animate={{ rotate: noteOpen ? 180 : 0 }} className="text-muted-foreground text-xs inline-block">▼</motion.span>
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {noteOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-t border-border/60"
                >
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {FUELS.map((f) => (
                        <div key={f.id} className="rounded-2xl border border-border/60 bg-background/40 p-3 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: f.color }} />
                            <span className="text-xs font-semibold">{f.name}{f.grade && <span className="opacity-60 ml-1">{f.grade}</span>}</span>
                          </div>
                          <MeterInput label="A tomon" tone="top" value={note.tops[f.id].a}
                            onChange={(v) => setNote((n) => ({ ...n, tops: { ...n.tops, [f.id]: { ...n.tops[f.id], a: v } }, savedAt: new Date().toISOString() }))} />
                          <MeterInput label="B tomon" tone="top" value={note.tops[f.id].b}
                            onChange={(v) => setNote((n) => ({ ...n, tops: { ...n.tops, [f.id]: { ...n.tops[f.id], b: v } }, savedAt: new Date().toISOString() }))} />
                        </div>
                      ))}
                    </div>

                    <textarea
                      value={note.text}
                      onChange={(e) => setNote((n) => ({ ...n, text: e.target.value, savedAt: new Date().toISOString() }))}
                      rows={2}
                      placeholder="Izoh… (masalan: A-tomon nasos sekin)"
                      className="w-full bg-background/60 border border-border/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-accent/60 resize-none"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <label className={`cursor-pointer text-xs px-3 py-2 rounded-xl border border-border/60 hover:border-accent/50 transition-colors inline-flex items-center gap-2 ${imgLoading ? "opacity-60 pointer-events-none" : ""}`}>
                        {imgLoading ? <FuelLoader size={6} label="Qayta ishlanmoqda…" /> : <>📷 Rasm yuklash</>}
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageUpload(f); e.currentTarget.value = ""; }} />
                      </label>
                      {note.image && (
                        <>
                          <button onClick={() => setImgPreview(note.image)} className="text-xs px-3 py-2 rounded-xl border border-border/60 hover:border-accent/50 transition-colors">
                            👁 Ko'rish
                          </button>
                          <button onClick={() => setNote((n) => ({ ...n, image: null }))} className="text-xs px-3 py-2 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">
                            🗑 O'chirish
                          </button>
                        </>
                      )}

                      <label className="ml-auto flex items-center gap-2 text-xs cursor-pointer select-none">
                        <input type="checkbox" checked={note.autoApply}
                          onChange={(e) => setNote((n) => ({ ...n, autoApply: e.target.checked }))}
                          className="h-4 w-4 accent-primary" />
                        <span className="text-muted-foreground">Avto qo'shish</span>
                      </label>
                    </div>

                    {note.image && (
                      <motion.button
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setImgPreview(note.image)}
                        className="relative block w-full group rounded-2xl overflow-hidden border border-border/60 bg-background/40"
                      >
                        <img src={note.image} alt="Ertalabki rasm" className="w-full max-h-64 object-contain" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity grid place-items-end p-3">
                          <span className="text-[10px] uppercase tracking-widest font-bold">👁 To'liq ko'rish</span>
                        </div>
                      </motion.button>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button onClick={saveNoteFromMorning}
                        className="text-xs px-3 py-2 rounded-xl border border-border/60 hover:border-primary/50 transition-colors font-semibold">
                        ⬆ Joriy sanoqdan saqlash
                      </button>
                      <button onClick={applyNoteToMorning}
                        className="text-xs px-3 py-2 rounded-xl grad-primary text-primary-foreground font-semibold glow">
                        ➜ Ertalabga qo'shish
                      </button>
                      <button onClick={clearNote}
                        className="ml-auto text-xs px-3 py-2 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors font-semibold">
                        Tozalash
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Image preview modal */}
        <AnimatePresence>
          {imgPreview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setImgPreview(null)}
              className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 grid place-items-center p-4">
              <img src={imgPreview} alt="Zametka" className="max-w-full max-h-[90vh] rounded-2xl border border-border/60" />
            </motion.div>
          )}
        </AnimatePresence>



        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen((v) => !v)}
          className="w-full glass rounded-2xl border border-border/60 px-5 py-4 flex items-center justify-between group hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <motion.span animate={{ rotate: open ? 45 : 0 }}
              className="h-9 w-9 rounded-xl grad-primary grid place-items-center text-primary-foreground text-xl font-bold glow">+</motion.span>
            <div className="text-left">
              <div className="font-bold">Hisob-kitobni ochish</div>
              <div className="text-xs text-muted-foreground">Sanoq, litr, summa va to'lovlar</div>
            </div>
          </div>
          {totalRevenue > 0 && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Jami summa</div>
              <div className="num-display text-xl font-bold text-primary">{fmt(totalRevenue)}</div>
            </div>
          )}
        </motion.button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div key="panel"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"
            >
              <div className="pt-6 space-y-8">
                <Section index="01" title="Boshlang'ich sanoq" >
                  <Grid>
                    {FUELS.map((f) => (
                      <FuelHeader key={f.id} f={f}>
                        <div className="space-y-2">
                          <MeterInput label="A tomon" tone="top" value={tops[f.id].a}
                            onChange={(v) => setTops((s) => ({ ...s, [f.id]: { ...s[f.id], a: v } }))} />
                          <MeterInput label="B tomon" tone="top" value={tops[f.id].b}
                            onChange={(v) => setTops((s) => ({ ...s, [f.id]: { ...s[f.id], b: v } }))} />
                          <div className="text-[10px] text-muted-foreground px-1 num-display">
                            Σ {fmt(toNum(tops[f.id].a) + toNum(tops[f.id].b))}
                          </div>
                        </div>
                      </FuelHeader>
                    ))}
                  </Grid>
                </Section>

                <Section index="02" title="Yakuniy sanoq" >
                  <Grid>
                    {FUELS.map((f) => (
                      <FuelHeader key={f.id} f={f}>
                        <div className="space-y-2">
                          <MeterInput label="A tomon" tone="bottom" value={bots[f.id].a}
                            onChange={(v) => setBots((s) => ({ ...s, [f.id]: { ...s[f.id], a: v } }))} />
                          <MeterInput label="B tomon" tone="bottom" value={bots[f.id].b}
                            onChange={(v) => setBots((s) => ({ ...s, [f.id]: { ...s[f.id], b: v } }))} />
                          <div className="text-[10px] text-muted-foreground px-1 num-display">
                            Σ {fmt(toNum(bots[f.id].a) + toNum(bots[f.id].b))}
                          </div>
                        </div>
                      </FuelHeader>
                    ))}
                  </Grid>
                </Section>

                <Section index="03" title="Litr × narx" 
                  right={
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Jami summa</div>
                      <div className="num-display text-2xl font-black text-primary">{fmt(totalRevenue)}</div>
                    </div>
                  }>
                  <Grid>
                    {rows.map((r) => (
                      <motion.div key={r.id} layout className="glass rounded-2xl border border-border/60 p-4"
                        style={{ boxShadow: `inset 0 0 0 1px ${r.color}22` }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                            <span className="text-xs font-semibold">{r.name}{r.grade && <span className="opacity-60 ml-1">{r.grade}</span>}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground num-display">{fmt(r.price)} so'm/L</span>
                        </div>
                        <div className="num-display text-sm text-muted-foreground">{fmt(r.liters)} L</div>
                        <div className="num-display text-2xl font-bold mt-1">{fmt(r.subtotal)}</div>
                      </motion.div>
                    ))}
                  </Grid>
                </Section>

                <Section index="04" title="To'lovlar" 
                  right={
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Jami to'lovlar</div>
                      <div className="num-display text-2xl font-black text-accent">{fmt(totalPaid)}</div>
                    </div>
                  }>
                  <Grid>
                    {PAYMENTS.map((p) => (
                      <MoneyInput key={p.id} label={p.label} value={pays[p.id]} maxLen={8}
                        onChange={(v) => setPays((s) => ({ ...s, [p.id]: v }))}
                        accent="var(--color-accent)" />
                    ))}
                  </Grid>
                </Section>

                <motion.section layout className="glass rounded-3xl border border-border/60 p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute -inset-px rounded-3xl pointer-events-none opacity-40"
                    style={{
                      background: diff > 0
                        ? "radial-gradient(ellipse at top, var(--color-success) 0%, transparent 60%)"
                        : diff < 0
                        ? "radial-gradient(ellipse at top, var(--color-destructive) 0%, transparent 60%)"
                        : "radial-gradient(ellipse at top, var(--color-muted) 0%, transparent 60%)",
                    }} />
                  <div className="relative grid md:grid-cols-3 gap-4">
                    <NumberCard label="Jami summa (litr×narx)" value={totalRevenue} tone="primary" suffix="so'm" />
                    <NumberCard label="Jami to'lovlar" value={totalPaid} tone="accent" suffix="so'm" />
                    <motion.div key={diff} initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="rounded-2xl p-4 border border-border/60 bg-background/40">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Farq (to'lovlar − summa)</div>
                      <div className={`num-display mt-1 text-3xl font-black ${
                        diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-foreground"
                      }`}>
                        {fmtSigned(diff)}<span className="ml-1 text-sm text-muted-foreground font-normal">so'm</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {diff > 0 ? "Ortiqcha (profitsit)" : diff < 0 ? "Kam (defitsit)" : "Aynan teng"}
                      </div>
                    </motion.div>
                  </div>

                  {/* Deficit reason */}
                  <AnimatePresence>
                    {isDeficit && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="relative mt-5 overflow-hidden"
                      >
                        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
                          <div className="text-[10px] uppercase tracking-widest text-destructive font-bold mb-2">
                            ⚠️ Defitsit aniqlandi — sababini yozing
                          </div>
                          <textarea value={deficitReason} onChange={(e) => setDeficitReason(e.target.value)}
                            rows={2} placeholder="Masalan: terminal ishlamadi, qaytim noto'g'ri berildi…"
                            className="w-full bg-background/60 border border-border/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-destructive/60 resize-none" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>

                <div className="flex justify-end">
                  <motion.button
                    whileTap={{ scale: 0.97 }} whileHover={{ y: -1 }}
                    onClick={saveSession}
                    disabled={saving || (totalRevenue === 0 && totalPaid === 0)}
                    className="grad-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl glow disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? <FuelLoader size={7} label="Saqlanmoqda…" /> : "Saqlash"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved sessions */}
        {shifts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold tracking-tight mb-3">Saqlangan smenalar</h2>
            <div className="space-y-2">
              {shifts.map((s) => {
                const d = new Date(s.created_at);
                const date = d.toLocaleDateString("ru-RU");
                const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
                return (
                  <motion.button key={s.id} layout
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -1 }}
                    onClick={() => setDetail(s)}
                    className="w-full text-left glass rounded-2xl border border-border/60 px-4 py-3 flex items-center justify-between hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <div className="text-xs text-muted-foreground num-display">
                        Smena #{s.shift_number ?? "—"} · {date} · {time}
                      </div>
                      <div className="font-bold mt-0.5">
                        Summa <span className="num-display text-primary">{fmt(s.total_revenue)}</span>
                      </div>
                    </div>
                    <div className={`num-display font-bold ${
                      s.diff > 0 ? "text-success" : s.diff < 0 ? "text-destructive" : "text-foreground"
                    }`}>{fmtSigned(s.diff)}</div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        )}

        {/* Detail modal */}
        <AnimatePresence>
          {detail && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetail(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 grid place-items-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.96, y: 12, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, y: 12, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass rounded-3xl border border-border/60 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Smena #{detail.shift_number ?? "—"}{detail.operator_name ? ` · ${detail.operator_name}` : ""}
                    </div>
                    <div className="num-display text-lg font-bold">
                      {new Date(detail.created_at).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <button onClick={() => setDetail(null)} className="h-9 w-9 rounded-xl border border-border/60 hover:border-primary/50 transition-colors">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {FUELS.map((f) => {
                    const topSum = toNum(detail.tops[f.id]?.a) + toNum(detail.tops[f.id]?.b);
                    const botSum = toNum(detail.bots[f.id]?.a) + toNum(detail.bots[f.id]?.b);
                    const liters = Math.abs(botSum - topSum);
                    return (
                      <div key={f.id} className="rounded-2xl p-3 border border-border/60 bg-background/40">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="h-2 w-2 rounded-full" style={{ background: f.color }} />
                          <span className="text-xs font-semibold">{f.name}{f.grade && <span className="opacity-60 ml-1">{f.grade}</span>}</span>
                        </div>
                        <div className="num-display text-xs text-muted-foreground">{fmt(topSum)} → {fmt(botSum)}</div>
                        <div className="num-display text-sm font-bold">{fmt(liters)} L</div>
                        <div className="num-display text-base font-bold text-primary">{fmt(liters * f.price)}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {PAYMENTS.map((p) => (
                    <div key={p.id} className="rounded-2xl p-3 border border-border/60 bg-background/40">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.label}</div>
                      <div className="num-display text-lg font-bold">{fmt(toNum(detail.pays[p.id]))}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl p-3 border border-border/60">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Summa</div>
                    <div className="num-display text-lg font-bold text-primary">{fmt(detail.total_revenue)}</div>
                  </div>
                  <div className="rounded-2xl p-3 border border-border/60">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">To'lov</div>
                    <div className="num-display text-lg font-bold text-accent">{fmt(detail.total_paid)}</div>
                  </div>
                  <div className="rounded-2xl p-3 border border-border/60">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Farq</div>
                    <div className={`num-display text-lg font-bold ${
                      detail.diff > 0 ? "text-success" : detail.diff < 0 ? "text-destructive" : "text-foreground"
                    }`}>{fmtSigned(detail.diff)}</div>
                  </div>
                </div>

                {detail.deficit_reason && (
                  <div className="mt-4 rounded-2xl p-3 border border-destructive/40 bg-destructive/5">
                    <div className="text-[10px] uppercase tracking-widest text-destructive font-bold mb-1">Defitsit izohi</div>
                    <div className="text-sm">{detail.deficit_reason}</div>
                  </div>
                )}

                <div className="mt-5 flex justify-between gap-3">
                  <button
                    onClick={async () => {
                      const ok = await loadSession(detail);
                      if (ok) setDetail(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-border/60 text-foreground hover:bg-background/60 transition-colors text-sm font-semibold"
                  >
                    Tahrirlash
                  </button>
                  <button
                    onClick={() => removeSession(detail.id)}
                    className="px-4 py-2 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors text-sm font-semibold"
                  >
                    O'chirish
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Section({ index, title, subtitle, right, children }: {
  index: string; title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between mb-3 gap-4">
        <div className="flex items-center gap-3">
          <span className="num-display text-xs text-primary font-bold">{index}</span>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>;
}

function FuelHeader({ f, children }: { f: typeof FUELS[number]; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 px-1">
        <span className="h-2 w-2 rounded-full" style={{ background: f.color }} />
        <span className="text-xs font-semibold">{f.name}{f.grade && <span className="opacity-60 ml-1">{f.grade}</span>}</span>
      </div>
      {children}
    </div>
  );
}
