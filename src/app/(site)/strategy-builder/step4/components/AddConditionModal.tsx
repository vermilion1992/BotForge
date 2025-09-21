"use client";
import { useState } from "react";
import { useBuilderStore } from "@/botforge/state/builderStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TEMPLATES = {
  Price: [
    { label: "Close above EMA", left: "price.close", operator: ">", right: "ema.value" },
    { label: "Close below EMA", left: "price.close", operator: "<", right: "ema.value" },
    { label: "Close above Donchian Upper", left: "price.close", operator: ">", right: "donch.upper" },
    { label: "Close below Donchian Lower", left: "price.close", operator: "<", right: "donch.lower" },
  ],
  Momentum: [
    { label: "RSI > 55", left: "rsi.value", operator: ">", right: "55" },
    { label: "RSI < 45", left: "rsi.value", operator: "<", right: "45" },
    { label: "RSI > 70 (Overbought)", left: "rsi.value", operator: ">", right: "70" },
    { label: "RSI < 30 (Oversold)", left: "rsi.value", operator: "<", right: "30" },
  ],
  Volatility: [
    { label: "ATR rising", left: "atr.value", operator: "rising", right: "0" },
    { label: "ATR falling", left: "atr.value", operator: "falling", right: "0" },
    { label: "ATR > 0.02", left: "atr.value", operator: ">", right: "0.02" },
    { label: "ATR < 0.01", left: "atr.value", operator: "<", right: "0.01" },
  ],
  Volume: [
    { label: "Volume > average", left: "volume.value", operator: ">", right: "smaVolume.value" },
    { label: "Volume < average", left: "volume.value", operator: "<", right: "smaVolume.value" },
    { label: "Volume > 1.5x average", left: "volume.value", operator: ">", right: "1.5" },
    { label: "Volume spike", left: "volume.value", operator: ">", right: "2.0" },
  ],
};

export default function AddConditionModal() {
  const [open, setOpen] = useState(false);
  const { addRuleFromTemplate } = useBuilderStore();

  const handleSelectTemplate = (template: any) => {
    addRuleFromTemplate(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="px-4 py-2 text-sm rounded-xl border bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          Add condition
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Entry Condition</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="Price" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="Price">Price</TabsTrigger>
            <TabsTrigger value="Momentum">Momentum</TabsTrigger>
            <TabsTrigger value="Volatility">Volatility</TabsTrigger>
            <TabsTrigger value="Volume">Volume</TabsTrigger>
          </TabsList>
          
          {Object.entries(TEMPLATES).map(([category, templates]) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid gap-2">
                {templates.map((template, index) => (
                  <button
                    key={index}
                    className="p-3 text-left rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="font-medium">{template.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {template.left} {template.operator} {template.right}
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}


