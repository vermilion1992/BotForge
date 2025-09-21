"use client";
import Link from "next/link";
import StrategyBuilderShell from "@/components/botforge/StrategyBuilderShell";
import PageHeader from "@/components/botforge/PageHeader";
import Stepper from "@/components/botforge/Stepper";

export default function StrategyBuilderPage() {
  return (
    <StrategyBuilderShell>
      <PageHeader title="Strategy Builder" subtitle="Configure strategy parameters, entry logic, and exits." />
      <Stepper current="market" />
    </StrategyBuilderShell>
  );
}