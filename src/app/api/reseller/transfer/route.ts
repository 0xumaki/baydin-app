import { NextRequest, NextResponse } from "next/server";
import { requireReseller } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { resellerTransfer } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reseller transfers Luck from their pool to a recipient user's balance. */
export const POST = withAuth(async (req: NextRequest) => {
  const reseller = await requireReseller();
  const { toEmail, amount, saleMmk, note } = await req.json();
  if (!toEmail || !amount || amount <= 0) {
    return NextResponse.json({ error: "Recipient email and a positive amount are required." }, { status: 400 });
  }
  const recipient = await db.user.findUnique({ where: { email: (toEmail as string).toLowerCase() } });
  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found. Ask them to create a Baydin account first." }, { status: 404 });
  }
  if (recipient.id === reseller.id) {
    return NextResponse.json({ error: "Use your own Luck directly. Transfers are for selling to others." }, { status: 400 });
  }
  const result = await resellerTransfer({
    fromUserId: reseller.id, toUserId: recipient.id, amount, saleMmk, note,
  });
  if (!result.ok) {
    const msgs: Record<string, string> = {
      insufficient_pool: "You don't have enough Luck in your reseller pool. Top up your wholesale inventory first.",
      not_reseller: "Reseller access required.",
      invalid_amount: "Amount must be positive.",
    };
    return NextResponse.json({ error: msgs[result.reason ?? ""] ?? "Transfer failed." }, { status: 400 });
  }

  // Increment lifetime reseller MMK counter for revenue tracking (additive only)
  if (typeof saleMmk === "number" && saleMmk > 0) {
    try {
      await db.user.update({
        where: { id: reseller.id },
        data: { lifetimeResellerMmk: { increment: saleMmk } },
      });
    } catch (e) {
      console.error("[reseller/transfer] failed to update lifetimeResellerMmk:", e);
    }
  }

  return NextResponse.json({ ok: true, transferred: amount, to: recipient.email });
});
