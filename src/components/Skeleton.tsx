import { motion } from "framer-motion";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`rounded-xl bg-gradient-to-r from-secondary/40 via-secondary/70 to-secondary/40 bg-[length:200%_100%] ${className}`}
      animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}
