"use client";

import { useSyncExternalStore } from "react";
import {
  getEmptyCart,
  getServerCartSnapshot,
  loadCart,
  subscribeToCart,
  updateCart,
} from "@/lib/cartStorage";

export function useCart() {
  const snapshot = useSyncExternalStore(subscribeToCart, loadCart, getServerCartSnapshot);
  return [snapshot ?? getEmptyCart(), updateCart, snapshot !== null] as const;
}
