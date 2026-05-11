import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallButton() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }
    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !evt;

  const handleClick = async () => {
    if (evt) {
      await evt.prompt();
      const res = await evt.userChoice;
      if (res.outcome === "accepted") setEvt(null);
    } else if (isIOS) {
      setIosHint(true);
    } else {
      setIosHint(true);
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.04 }}
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold grad-primary text-primary-foreground glow"
        aria-label="Ilovani yuklash"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span className="hidden sm:inline">Yuklash</span>
      </motion.button>

      <AnimatePresence>
        {iosHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIosHint(false)}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md grid place-items-center p-5"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm w-full rounded-2xl border border-border/60 bg-card p-5 space-y-3"
            >
              <div className="text-base font-bold">Qurilmaga o'rnatish</div>
              {isIOS ? (
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
                  <li>Safari'da pastdagi <b>Share</b> tugmasini bosing</li>
                  <li><b>Add to Home Screen</b> (Bosh ekranga qo'shish) ni tanlang</li>
                  <li><b>Add</b> tugmasini bosing</li>
                </ol>
              ) : (
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
                  <li>Brauzer menyusini oching (⋮)</li>
                  <li><b>Install app</b> yoki <b>Add to Home Screen</b> ni tanlang</li>
                </ol>
              )}
              <button
                onClick={() => setIosHint(false)}
                className="w-full mt-2 py-2.5 rounded-xl grad-primary text-primary-foreground font-semibold text-sm"
              >
                Tushunarli
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
