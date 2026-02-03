import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { sha256 } from "../../../lib/hash";

export async function POST(request: Request) {
  const body = await request.json();
  const cancelToken = String(body.cancelToken ?? "").trim();
  if (!cancelToken) {
    return NextResponse.json({ ok: false, message: "Cancel-Token fehlt." }, { status: 400 });
  }

  const hash = sha256(cancelToken);
  const result = await prisma.reservation.deleteMany({
    where: { cancelTokenHash: hash }
  });

  if (result.count === 0) {
    return NextResponse.json({ ok: false, message: "Token nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    deletedCount: result.count,
    message: "Buchung storniert."
  });
}
