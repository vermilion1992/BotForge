import { NextResponse } from "next/server";
import operators from "@/botforge/sot/operators.json";
import extras from "@/botforge/sot/extras.json";
import strategies from "@/botforge/sot/strategies.json";
import uiRules from "@/botforge/sot/uiRules.json";
export async function GET() { return NextResponse.json({ operators, extras, strategies, uiRules }); }





