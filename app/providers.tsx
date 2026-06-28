"use client";

import React from "react";
import { CartStoreProvider } from "@/lib/store/cart-store-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <CartStoreProvider>{children}</CartStoreProvider>;
}
