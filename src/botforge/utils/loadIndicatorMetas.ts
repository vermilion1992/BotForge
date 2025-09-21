import fs from "node:fs/promises";
import path from "node:path";
import { indicatorMetaSchema, type IndicatorMeta } from "../sot/schemas";

export async function loadIndicatorMetas(): Promise<IndicatorMeta[]> {
  const base = path.join(process.cwd(), "src", "indicators");
  const dirs = await fs.readdir(base).catch(() => []);
  const metas: IndicatorMeta[] = [];
  for (const d of dirs) {
    const metaPath = path.join(base, d, "meta.json");
    try {
      const raw = await fs.readFile(metaPath, "utf-8");
      const json = JSON.parse(raw);
      const parsed = indicatorMetaSchema.parse(json);
      metas.push(parsed);
    } catch (e) {
      console.warn(`[BotForge] Invalid meta for ${d}:`, e);
    }
  }
  return metas;
}




