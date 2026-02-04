import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { formatDateOnly, parseDateOnly } from "../../../lib/dates";
import { generateToken, sha256 } from "../../../lib/hash";
import {
  enumerateSeriesDates,
  evaluateReservationSeries,
  parseWeekdays,
  SeriesMode
} from "../../../lib/series";

export async function POST(request: Request) {
  const body = await request.json();
  const spotLabel = String(body.spotLabel ?? "").trim();

  if (!spotLabel) {
    return NextResponse.json({ ok: false, message: "Parkplatz-Label fehlt." }, { status: 400 });
  }

  const spot = await prisma.parkingSpot.findFirst({
    where: { label: spotLabel, active: true }
  });

  if (!spot) {
    return NextResponse.json({ ok: false, message: "Parkplatz nicht gefunden." }, { status: 404 });
  }

  const mode = (body.mode as SeriesMode) ?? "hard";

  if (body.date) {
    const date = parseDateOnly(body.date as string);
    const release = await prisma.release.findFirst({ where: { spotId: spot.id, date } });
    if (!release) {
      return NextResponse.json({ ok: false, message: "Parkplatz ist nicht freigegeben." }, { status: 409 });
    }
    const existingReservation = await prisma.reservation.findFirst({
      where: { spotId: spot.id, date }
    });
    if (existingReservation) {
      return NextResponse.json({ ok: false, message: "Bereits reserviert." }, { status: 409 });
    }

    const token = generateToken();
    await prisma.reservation.create({
      data: {
        spotId: spot.id,
        date,
        cancelTokenHash: sha256(token)
      }
    });

    return NextResponse.json({
      ok: true,
      tokens: [
        {
          spotLabel: spot.label,
          date: formatDateOnly(date),
          token
        }
      ]
    });
  }

  const startDate = body.startDate as string | undefined;
  const endDate = body.endDate as string | undefined;
  if (!startDate || !endDate || !body.weekdays) {
    return NextResponse.json({ ok: false, message: "Seriendaten fehlen." }, { status: 400 });
  }

  const weekdays = parseWeekdays(body.weekdays as string[]);
  const targetDates = enumerateSeriesDates(startDate, endDate, weekdays);

  const result = await prisma.$transaction(async (tx) => {
    const releases = await tx.release.findMany({
      where: { spotId: spot.id, date: { in: targetDates } }
    });
    const reservations = await tx.reservation.findMany({
      where: { spotId: spot.id, date: { in: targetDates } }
    });

    const { okDates, collisions } = evaluateReservationSeries(
      targetDates,
      releases.map((rel) => rel.date),
      reservations.map((res) => res.date)
    );

    if (mode === "hard" && collisions.length > 0) {
      return { okDates: [], collisions, tokens: [] as { date: Date; token: string }[] };
    }

    const tokens = okDates.map((date) => ({ date, token: generateToken() }));
    if (tokens.length > 0) {
      await tx.reservation.createMany({
        data: tokens.map((entry) => ({
          spotId: spot.id,
          date: entry.date,
          cancelTokenHash: sha256(entry.token)
        }))
      });
    }

    return { okDates, collisions, tokens };
  });

  if (mode === "hard" && result.collisions.length > 0) {
    return NextResponse.json({
      ok: false,
      message: "Serie kollidiert. Keine Buchungen gespeichert.",
      collisions: result.collisions
    });
  }

  return NextResponse.json({
    ok: true,
    tokens: result.tokens.map((entry) => ({
      spotLabel: spot.label,
      date: formatDateOnly(entry.date),
      token: entry.token
    })),
    collisions: result.collisions
  });
}
