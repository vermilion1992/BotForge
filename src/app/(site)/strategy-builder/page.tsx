// src/app/(site)/strategy-builder/page.tsx
import { redirect } from "next/navigation";

export default function StrategyBuilderIndex() {
  redirect("/strategy-builder/step1");
  return null;
}