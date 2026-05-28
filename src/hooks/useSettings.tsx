import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type FuelId = "92k4" | "92k5" | "95" | "98";
export type FuelPrices = Record<FuelId, number>;

export const DEFAULT_FUEL_PRICES: FuelPrices = {
  "92k4": 11200,
  "92k5": 11900,
  "95": 13900,
  "98": 18500,
};

export type CartItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

type SettingsCtx = {
  fuelPrices: FuelPrices;
  setFuelPrice: (id: FuelId, price: number) => void;
  resetFuelPrices: () => void;

  cart: CartItem[];
  addCartItem: (item: Omit<CartItem, "id">) => void;
  removeCartItem: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
};

const FUEL_PRICES_KEY = "fueldesk:fuelPrices";
const CART_KEY = "fueldesk:cart";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}

const Ctx = createContext<SettingsCtx | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [fuelPrices, setFuelPrices] = useState<FuelPrices>(() =>
    ({ ...DEFAULT_FUEL_PRICES, ...loadJSON<Partial<FuelPrices>>(FUEL_PRICES_KEY, {}) }) as FuelPrices,
  );

  const [cart, setCart] = useState<CartItem[]>(() => loadJSON<CartItem[]>(CART_KEY, []));

  useEffect(() => {
    localStorage.setItem(FUEL_PRICES_KEY, JSON.stringify(fuelPrices));
  }, [fuelPrices]);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const ctx = useMemo<SettingsCtx>(() => {
    const setFuelPrice = (id: FuelId, price: number) => {
      const p = Number.isFinite(price) ? Math.max(0, Math.round(price)) : 0;
      setFuelPrices((s) => ({ ...s, [id]: p }));
    };

    const resetFuelPrices = () => setFuelPrices(DEFAULT_FUEL_PRICES);

    const addCartItem = (item: Omit<CartItem, "id">) => {
      const qty = Number.isFinite(item.qty) ? Math.max(1, Math.round(item.qty)) : 1;
      const price = Number.isFinite(item.price) ? Math.max(0, Math.round(item.price)) : 0;
      const name = item.name.trim();
      if (!name) return;
      setCart((s) => [{ id: crypto.randomUUID(), name, qty, price }, ...s]);
    };

    const removeCartItem = (id: string) => setCart((s) => s.filter((x) => x.id !== id));
    const clearCart = () => setCart([]);
    const cartTotal = cart.reduce((sum, it) => sum + it.qty * it.price, 0);

    return {
      fuelPrices,
      setFuelPrice,
      resetFuelPrices,
      cart,
      addCartItem,
      removeCartItem,
      clearCart,
      cartTotal,
    };
  }, [fuelPrices, cart]);

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSettings outside provider");
  return c;
}

