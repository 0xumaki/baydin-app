import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Breath sessions are stored as FrequencySession rows with mode="breath"
 * and frequencyHz=0 — this lets the existing analytics + frequency history
 * pick them up without a schema migration.
 *
 * intention stores the pattern id ("box" | "478" | "coherent" | "deep-relax").
 */

const VALID_PATTERNS = new Set(["box", "478", "coherent", "deep-relax"]);

/** GET — user's breath sessions (mode="breath"), last 50. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ sessions: [] });
  const sessions = await db.frequencySession.findMany({
    where: {
      userId: user.id,
      mode: "breath",
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ sessions });
}

/** POST — log a completed breath session. Free — no Luck cost. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    pattern?: string;
    durationSec?: number;
    breathCount?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pattern = (body.pattern ?? "").toString().trim();
  const durationSec = Number(body.durationSec);
  const breathCount = body.breathCount != null ? Number(body.breathCount) : null;

  if (!pattern || !VALID_PATTERNS.has(pattern)) {
    return NextResponse.json(
      { error: "pattern must be one of box | 478 | coherent | deep-relax" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > 3600) {
    return NextResponse.json(
      { error: "durationSec must be a positive number (≤ 3600)" },
      { status: 400 }
    );
  }

  const session = await db.frequencySession.create({
    data: {
      userId: user.id,
      // Store the pattern id in the intention column.
      intention: pattern,
      // frequencyHz=0 signals "breath" — there's no tone.
      frequencyHz: 0,
      mode: "breath",
      durationSec: Math.round(durationSec),
      completed: true,
      // Stash breathCount in beatHz so analytics can surface cycles/min
      // without a migration. (Float column, so we cast.)
      beatHz: breathCount != null && Number.isFinite(breathCount) ? breathCount : null,
    },
  });

  return NextResponse.json({ session });
}
