import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ readings: [] });
  const readings = await db.tarotReading.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, question: true, spreadType: true, cardsJson: true, saved: true, createdAt: true },
  });
  return NextResponse.json({ readings });
}
