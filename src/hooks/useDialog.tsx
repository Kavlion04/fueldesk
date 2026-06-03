import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DialogTone = "default" | "danger" | "warn";

interface BaseOpts {
  title?: string;
  message: string;
  tone?: DialogTone;
}

interface ConfirmOpts extends BaseOpts {
  confirmLabel?: string;
  cancelLabel?: string;
}

interface AlertOpts extends BaseOpts {
  okLabel?: string;
}

interface DialogState {
  kind: "alert" | "confirm";
  title: string;
  message: string;
  tone: DialogTone;
  confirmLabel: string;
  cancelLabel?: string;
  resolve: (v: boolean) => void;
}

interface Ctx {
  alert: (opts: string | AlertOpts) => Promise<void>;
  confirm: (opts: string | ConfirmOpts) => Promise<boolean>;
}

const DialogCtx = createContext<Ctx | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);

  const alert = useCallback<Ctx["alert"]>((opts) => {
    const o: AlertOpts = typeof opts === "string" ? { message: opts } : opts;
    return new Promise<void>((resolve) => {
      setState({
        kind: "alert",
        title: o.title ?? "Diqqat",
        message: o.message,
        tone: o.tone ?? "default",
        confirmLabel: o.okLabel ?? "Tushunarli",
        resolve: () => resolve(),
      });
    });
  }, []);

  const confirm = useCallback<Ctx["confirm"]>((opts) => {
    const o: ConfirmOpts = typeof opts === "string" ? { message: opts } : opts;
    return new Promise<boolean>((resolve) => {
      setState({
        kind: "confirm",
        title: o.title ?? "Tasdiqlash",
        message: o.message,
        tone: o.tone ?? "default",
        confirmLabel: o.confirmLabel ?? "Davom etish",
        cancelLabel: o.cancelLabel ?? "Bekor qilish",
        resolve,
      });
    });
  }, []);

  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };

  const toneAccent =
    state?.tone === "danger"
      ? "from-destructive to-destructive/70"
      : state?.tone === "warn"
        ? "from-amber-500 to-orange-500"
        : "grad-primary";

  const confirmBtn =
    state?.tone === "danger"
      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      : state?.tone === "warn"
        ? "bg-amber-500 text-black hover:bg-amber-400"
        : "grad-primary text-primary-foreground glow";

  const icon =
    state?.tone === "danger" ? "⚠" : state?.tone === "warn" ? "!" : "i";

  return (
    <DialogCtx.Provider value={{ alert, confirm }}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => close(false)}
            className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-md grid place-items-center p-5"
          >
            <motion.div
              initial={{ scale: 0.92, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full rounded-3xl border border-border/60 bg-card/95 backdrop-blur-xl p-6 shadow-2xl overflow-hidden"
            >
              <div
                className={`absolute -top-px left-6 right-6 h-px bg-gradient-to-r ${toneAccent} opacity-80`}
              />
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br ${toneAccent} grid place-items-center text-primary-foreground text-lg font-black`}
                >
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {state.kind === "confirm" ? "Tasdiqlash" : "Xabar"}
                  </div>
                  <div className="text-base font-bold tracking-tight mt-0.5">
                    {state.title}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {state.message}
              </div>

              <div className="mt-6 flex gap-2 justify-end">
                {state.kind === "confirm" && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => close(false)}
                    className="px-4 py-2.5 rounded-xl border border-border/60 hover:bg-background/60 text-sm font-semibold transition-colors"
                  >
                    {state.cancelLabel}
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  autoFocus
                  onClick={() => close(true)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${confirmBtn}`}
                >
                  {state.confirmLabel}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogCtx.Provider>
  );
}

export function useDialog() {
  const c = useContext(DialogCtx);
  if (!c) throw new Error("useDialog outside provider");
  return c;
}
