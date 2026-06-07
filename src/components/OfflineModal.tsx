import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function OfflineModal() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] grid place-items-center bg-background/80 backdrop-blur-md p-5"
        >
          <motion.div
            initial={{ scale: 0.92, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-warning/50 bg-card/95 p-6 shadow-2xl"
          >
            <div className="absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-warning/20 via-warning to-warning/20" />
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-warning/15 text-2xl">
                📡
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-widest text-warning font-bold">
                  Aloqa uzildi
                </div>
                <h2 className="mt-1 text-lg font-black tracking-tight">
                  Internetdan muammo bo‘lyapti
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Internet ishlamayapti. Kiritilgan ma’lumotlar qurilmada saqlanadi,
              aloqa tiklanganda davom etishingiz mumkin.
            </p>
            <button
              onClick={() => setOffline(!navigator.onLine)}
              className="mt-5 w-full rounded-2xl border border-warning/50 bg-warning/10 px-4 py-3 text-sm font-bold text-warning transition-colors hover:bg-warning/15"
            >
              Qayta tekshirish
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}