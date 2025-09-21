import type { Ref } from "./types";
export function listPriceSeries(): Ref[] {
  return [
    { id: "price.close", label: "Price", shape: "series", baseId: "price" },
    { id: "price.open",  label: "Price (Open)", shape: "series", baseId: "price" },
    { id: "price.high",  label: "Price (High)", shape: "series", baseId: "price" },
    { id: "price.low",   label: "Price (Low)", shape: "series", baseId: "price" },
    { id: "price.vwap",  label: "Price (VWAP)", shape: "series", baseId: "price" }
  ];
}
