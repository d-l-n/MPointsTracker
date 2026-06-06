import { createContext, useContext, type ReactNode } from "react";

import type { AppContextValue } from "../types";

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
  value: AppContextValue;
}

export function AppProvider({ children, value }: AppProviderProps) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
}
