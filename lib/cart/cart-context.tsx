"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export interface CartItem {
  productId: string;
  organizationId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

const STORAGE_KEY = "lpfp_cart_v1";
export const MAX_CART_QUANTITY = 99;
const listeners = new Set<() => void>();

function normalizeQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_CART_QUANTITY, Math.max(1, Math.floor(quantity)));
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === "string" &&
    typeof item.organizationId === "string" &&
    typeof item.name === "string" &&
    typeof item.priceCents === "number" &&
    Number.isInteger(item.priceCents) &&
    item.priceCents >= 0 &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity)
  );
}

function readFromStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem).map((item) => ({
      ...item,
      quantity: normalizeQuantity(item.quantity),
    }));
  } catch {
    return [];
  }
}

let cache: CartItem[] = typeof window !== "undefined" ? readFromStorage() : [];

function persist(items: CartItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Best-effort persistence only.
  }
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      cache = readFromStorage();
      listeners.forEach((listener) => listener());
    }
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CartItem[] {
  return cache;
}

const EMPTY_CART: CartItem[] = [];

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalCents: number;
  totalQuantity: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      const safeQuantity = normalizeQuantity(quantity);
      const existing = cache.find((i) => i.productId === item.productId);
      const next = existing
        ? cache.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: normalizeQuantity(i.quantity + safeQuantity) }
              : i,
          )
        : [...cache, { ...item, quantity: safeQuantity }];
      persist(next);
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    persist(cache.filter((i) => i.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    if (!Number.isFinite(quantity)) return;
    const next = cache.map((i) =>
      i.productId === productId
        ? { ...i, quantity: normalizeQuantity(quantity) }
        : i,
    );
    persist(next);
  }, []);

  const clear = useCallback(() => persist([]), []);

  const totalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    [items],
  );
  const totalQuantity = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      setQuantity,
      clear,
      totalCents,
      totalQuantity,
    }),
    [items, addItem, removeItem, setQuantity, clear, totalCents, totalQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
