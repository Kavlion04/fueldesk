import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useI18n } from "@/hooks/useI18n";
import { haptic } from "@/lib/haptic";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  value: string;
}

export function ShareQR({ open, onClose, title, value }: Props) {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            haptic("tap");
            onClose();
          }}
          className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-md grid place-items-center p-5"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-3xl border border-border/60 p-6 max-w-sm w-full text-center"
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">QR</div>
            <div className="text-lg font-bold tracking-tight mb-3">{title ?? t("share.qr")}</div>
            <div className="rounded-2xl bg-white p-4 grid place-items-center mb-4">
              <QRCodeSVG value={value} size={220} level="M" includeMargin={false} />
            </div>
            <p className="text-xs text-muted-foreground mb-4">{t("share.qr.desc")}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(value);
                    haptic("success");
                  } catch {
                    haptic("error");
                  }
                }}
                className="px-4 py-2 rounded-xl border border-border/60 bg-secondary/40 text-xs font-semibold hover:border-primary/50 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  haptic("tap");
                  onClose();
                }}
                className="px-4 py-2 rounded-xl grad-primary text-primary-foreground text-xs font-bold"
              >
                {t("common.close")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
