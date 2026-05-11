export const sanitizeN = (s: string, n: number) => s.replace(/\D/g, "").slice(0, n);
export const sanitize7 = (s: string) => sanitizeN(s, 7);
export const sanitize8 = (s: string) => sanitizeN(s, 8);
export const toNum = (s: string) => (s ? parseInt(s, 10) : 0);
export const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n));
export const fmtSigned = (n: number) =>
  (n > 0 ? "+" : n < 0 ? "−" : "") + fmt(Math.abs(n));
