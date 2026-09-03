import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { creditLuck } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List goals with confirmation stats + streaks. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ goals: [] });
    const goals = await db.goal.findMany({
      where: { userId: user.id, status: { not: "archived" } },
      orderBy: { createdAt: "desc" },
      include: { confirmations: { orderBy: { date: "desc" }, take: 60 } },
    });
    const today = new Date().toISOString().slice(0, 10);
    const enriched = goals.map((g) => {
      const confDates = g.confirmations.map((c) => c.date).sort();
      let streak = 0;
      let cur = today;
      // walk back from today counting consecutive days
      for (let i = confDates.length - 1; i >= 0; i--) {
        if (confDates[i] === cur) { streak++; cur = prevDay(cur); }
        else if (confDates[i] === prevDay(cur)) { streak++; cur = prevDay(confDates[i] as string); }
        else break;
      }
      return {
        id: g.id, title: g.title, intention: g.intention, statement: g.statement,
        reminderTime: g.reminderTime, targetDate: g.targetDate, status: g.status,
        createdAt: g.createdAt,
        confirmedToday: g.confirmations.some((c) => c.date === today),
        streak,
        totalConfirmations: g.confirmations.length,
        lastConfirmationDate: confDates[confDates.length - 1] ?? null,
      };
    });
    return NextResponse.json({ goals: enriched });
  } catch (err) {
    console.error("List goals failed:", err);
    return NextResponse.json({ error: "Failed to load goals." }, { status: 500 });
  }
}

function prevDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { title, statement, reminderTime, targetDate } = body;
    if (typeof title !== "string" || title.trim().length < 2 || title.trim().length > 200) {
      return NextResponse.json({ error: "Title must be 2-200 characters." }, { status: 400 });
    }
    const intention = detectIntention(title + " " + (statement ?? ""));
    const safeStatement = typeof statement === "string" && statement.trim().length > 0 && statement.trim().length <= 1000
      ? statement.trim()
      : title.trim();
    const goal = await db.goal.create({
      data: {
        userId: user.id,
        title: title.trim(),
        intention,
        statement: safeStatement,
        reminderTime: typeof reminderTime === "string" ? reminderTime : null,
        targetDate: typeof targetDate === "string" ? targetDate : null,
        status: "active",
      },
    });
    return NextResponse.json({ goal });
  } catch (err) {
    console.error("Create goal failed:", err);
    return NextResponse.json({ error: "Failed to create goal." }, { status: 500 });
  }
}

/** Intent detection from text (used for frequency mapping). */
function detectIntention(text: string): string {
  const t = text.toLowerCase();
  if (/love|relationship|partner|attract|soulmate|romance/.test(t)) return "love";
  if (/money|wealth|abundanc|prosper|rich|financ/.test(t)) return "abundance";
  if (/heal|health|wellness|recover|body/.test(t)) return "healing";
  if (/career|job|work|promot|business|success/.test(t)) return "career";
  if (/peace|calm|relax|stress|anxiety/.test(t)) return "peace";
  if (/creat|art|inspir|express/.test(t)) return "creativity";
  if (/protect|safe|shield|guard/.test(t)) return "protection";
  if (/intu|guid|wisdom|insight|third eye/.test(t)) return "intuition";
  return "abundance";
}
