import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { parseDateOnly } from "../../../../lib/dates";

type ValidationToken = {
  date: string;
  spotLabel: string;
  token: string;
};

type TokenStatus = {
  date: string;
  spotLabel: string;
  status: "active" | "owner-cancelled" | "missing" | "unknown";
};

function buildKey(spotId: string, date: Date) {
  return `${spotId}:${date.toISOString()}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const tokens = Array.isArray(body.tokens) ? (body.tokens as ValidationToken[]) : [];
  if (tokens.length === 0) {
    return NextResponse.json({ ok: false, message: "Keine Tokens übergeben." }, { status: 400 });
  }

  const labels = Array.from(new Set(tokens.map((token) => token.spotLabel)));
  const spots = await prisma.parkingSpot.findMany({
    where: { label: { in: labels } }
  });
  const spotByLabel = new Map(spots.map((spot) => [spot.label, spot]));

  const queries = tokens.flatMap((token) => {
    const spot = spotByLabel.get(token.spotLabel);
    if (!spot) {
      return [];
    }
    return [{ spotId: spot.id, date: parseDateOnly(token.date) }];
  });

  const reservations = queries.length
    ? await prisma.reservation.findMany({
        where: { OR: queries }
      })
    : [];
  const releases = queries.length
    ? await prisma.release.findMany({
        where: { OR: queries }
      })
    : [];

  const reservationKeys = new Set(reservations.map((res) => buildKey(res.spotId, res.date)));
  const releaseKeys = new Set(releases.map((rel) => buildKey(rel.spotId, rel.date)));

  const statuses: TokenStatus[] = tokens.map((token) => {
    const spot = spotByLabel.get(token.spotLabel);
    if (!spot) {
      return { date: token.date, spotLabel: token.spotLabel, status: "unknown" };
    }
    const date = parseDateOnly(token.date);
    const key = buildKey(spot.id, date);
    if (!reservationKeys.has(key)) {
      return { date: token.date, spotLabel: token.spotLabel, status: "missing" };
    }
    if (!releaseKeys.has(key)) {
      return { date: token.date, spotLabel: token.spotLabel, status: "owner-cancelled" };
    }
    return { date: token.date, spotLabel: token.spotLabel, status: "active" };
  });

  return NextResponse.json({ ok: true, statuses });
}
