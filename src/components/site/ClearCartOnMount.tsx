"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

export function ClearCartOnMount() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
