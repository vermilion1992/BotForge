import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { normalizeMeta } from "@/app/strategy-builder/lib/normalizeMeta";

export async function GET() {
  try {
    const base = path.join(process.cwd(), "src", "indicators");
    const dirs = await readdir(base, { withFileTypes: true });
    const metas: any[] = [];
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      try {
        const raw = await readFile(path.join(base, d.name, "meta.json"), "utf8");
        metas.push(normalizeMeta(JSON.parse(raw)));
      } catch {}
    }
    // filter to ATR/RSI/EMA only (current minimal set)
    const allowed = new Set(["atr","rsi","ema"]);
    const trimmed = metas.filter(m => allowed.has(m.id.toLowerCase()));
    return NextResponse.json({ metas: trimmed });
  } catch (e:any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}