"use client";
import React, { createContext, useContext, PropsWithChildren } from "react";
import { useIndicatorRegistry } from "@/app/strategy-builder/data/useIndicatorRegistry";

type Ctx = ReturnType<typeof useIndicatorRegistry>;
const C = createContext<Ctx | null>(null);

export function BuilderProvider({ children }: PropsWithChildren<{}>) {
  const ind = useIndicatorRegistry();
  return <C.Provider value={ind}>{children}</C.Provider>;
}
export function useBuilder() {
  const v = useContext(C);
  if (!v) throw new Error("Wrap tree with <BuilderProvider>");
  return v;
}
