"use client";

import { createContext, useContext, type ReactNode } from "react";

const StorePricingContext = createContext(false);

export function StorePricingEmbeddedProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <StorePricingContext.Provider value>
      {children}
    </StorePricingContext.Provider>
  );
}

export function useStorePricingEmbedded() {
  return useContext(StorePricingContext);
}
