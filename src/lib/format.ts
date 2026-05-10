export const sanitize7 = (s: string) => s.replace(/\D/g, "").slice(0, 7);
export const toNum = (s: string) => (s ? parseInt(s, 10) : 0);
export const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n));
export const fmtSigned = (n: number) =>
  (n > 0 ? "+" : n < 0 ? "−" : "") + fmt(Math.abs(n));
