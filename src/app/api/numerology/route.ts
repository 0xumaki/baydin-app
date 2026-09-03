import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { spendForFeature } from "@/lib/luck";
import { buildNumerologyReport, type NumerologySystem } from "@/lib/numerology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** GET — list the user's past numerology reports. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const readings = await db.numerologyReading.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      input: true,
      system: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    readings: readings.map((r) => ({
      id: r.id,
      input: JSON.parse(r.input),
      system: r.system,
      createdAt: r.createdAt,
    })),
    costLuck: 3,
    freePreview: true, // life path is free to preview
  });
}

/** POST — compute numerology report. 3 Luck per full report.
 *  Free preview: only Life Path number is shown without spending Luck.
 *  Pass `preview=true` to compute life path only (free).
 *  Pass `system` ("pythagorean" or "chaldean") to choose the system.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, birthDate, system, preview } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: "Please enter your birth date (YYYY-MM-DD)." }, { status: 400 });
  }
  const sys: NumerologySystem = system === "chaldean" ? "chaldean" : "pythagorean";

  try {
    const report = buildNumerologyReport({ name: name.trim(), birthDate, system: sys });

    // Free preview: return only life path, no save
    if (preview) {
      return NextResponse.json({
        preview: true,
        name: report.name,
        birthDate: report.birthDate,
        system: report.system,
        numbers: { lifePath: report.numbers.lifePath },
        meanings: { lifePath: report.meanings.lifePath },
        costLuck: 3,
      });
    }

    // Full report — charge Luck
    const spent = await spendForFeature({
      userId: user.id,
      feature: "numerology",
      description: `Numerology report for ${name}`,
    });
    if (!spent.ok) {
      return NextResponse.json(
        { error: "Insufficient Luck. You need 3 Luck for a full numerology report.", balance: spent.balance, cost: 3 },
        { status: 402 }
      );
    }

    // Persist
    const saved = await db.numerologyReading.create({
      data: {
        userId: user.id,
        input: JSON.stringify({ name: name.trim(), birthDate }),
        report: JSON.stringify(report),
        system: sys,
      },
    });

    return NextResponse.json({
      id: saved.id,
      report,
      balance: spent.balance,
      cost: spent.cost,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to compute report." }, { status: 500 });
  }
}

/** DELETE — remove a saved numerology report. */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const existing = await db.numerologyReading.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.numerologyReading.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
