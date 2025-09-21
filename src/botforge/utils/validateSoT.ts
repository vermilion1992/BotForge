import { indicatorMetaSchema } from "../sot/schemas";
import { loadIndicatorMetas } from "./loadIndicatorMetas";

async function main() {
  const metas = await loadIndicatorMetas();
  let ok = true;
  for (const m of metas) {
    const res = indicatorMetaSchema.safeParse(m);
    if (!res.success) {
      ok = false;
      console.error(`[Meta invalid] ${m.identity?.id || "unknown"}`, res.error.format());
    }
  }
  if (!ok) process.exit(1);
  console.log(`Validated ${metas.length} indicator metas ✓`);
}
main();




