import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { formatDateOnly, parseDateOnly } from "../../../lib/dates";
import { sha256 } from "../../../lib/hash";
import {
  enumerateSeriesDates,
  evaluateReleaseSeries,
  parseWeekdays,
  SeriesMode
} from "../../../lib/series";

export async function POST(request: Request) {
  const body = await request.json();
  const ownerCode = String(body.ownerCode ?? "").trim();
  if (!ownerCode) {
    return NextResponse.json({ ok: false, message: "Owner-Code fehlt." }, { status: 400 });
  }

  const ownerCodeHash = sha256(ownerCode);
  const spot = await prisma.parkingSpot.findFirst({
    where: { ownerCodeHash, active: true }
  });

  if (!spot) {
    return NextResponse.json({ ok: false, message: "Owner-Code nicht gefunden." }, { status: 404 });
  }

  const mode = (body.mode as SeriesMode) ?? "hard";

  if (body.date) {
    const date = parseDateOnly(body.date as string);
    const existing = await prisma.release.findMany({ where: { spotId: spot.id, date } });
    const { okDates, collisions } = evaluateReleaseSeries([date], existing.map((rel) => rel.date));

    if (mode === "hard" && collisions.length > 0) {
      return NextResponse.json({
        ok: false,
        message: "Release kollidiert mit bestehender Freigabe.",
        collisions
      });
    }

    if (okDates.length > 0) {
      await prisma.release.create({
        data: { spotId: spot.id, date: okDates[0] }
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Freigabe gespeichert.",
      createdDates: okDates.map(formatDateOnly),
      collisions
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
    const existing = await tx.release.findMany({
      where: {
        spotId: spot.id,
        date: { in: targetDates }
      }
    });
    const { okDates, collisions } = evaluateReleaseSeries(
      targetDates,
      existing.map((rel) => rel.date)
    );

    if (mode === "hard" && collisions.length > 0) {
      return { okDates: [], collisions, created: [] as Date[] };
    }

    if (okDates.length > 0) {
      await tx.release.createMany({
        data: okDates.map((date) => ({ spotId: spot.id, date }))
      });
    }

    return { okDates, collisions, created: okDates };
  });

  if (mode === "hard" && result.collisions.length > 0) {
    return NextResponse.json({
      ok: false,
      message: "Serie kollidiert. Keine Freigaben gespeichert.",
      collisions: result.collisions
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Serie verarbeitet.",
    createdDates: result.created.map(formatDateOnly),
    collisions: result.collisions
  });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const ownerCode = String(body.ownerCode ?? "").trim();
  if (!ownerCode) {
    return NextResponse.json({ ok: false, message: "Owner-Code fehlt." }, { status: 400 });
  }

  const ownerCodeHash = sha256(ownerCode);
  const spot = await prisma.parkingSpot.findFirst({
    where: { ownerCodeHash, active: true }
  });

  if (!spot) {
    return NextResponse.json({ ok: false, message: "Owner-Code nicht gefunden." }, { status: 404 });
  }

  const missingDates: Date[] = [];
  const removedDates: Date[] = [];

  if (body.date) {
    const date = parseDateOnly(body.date as string);
    const existing = await prisma.release.findUnique({
      where: {
        spotId_date: {
          spotId: spot.id,
          date
        }
      }
    });

    if (!existing) {
      missingDates.push(date);
    } else {
      await prisma.release.delete({ where: { id: existing.id } });
      removedDates.push(date);
    }

    return NextResponse.json({
      ok: true,
      message: "Freigabe storniert.",
      removedDates: removedDates.map(formatDateOnly),
      missingDates: missingDates.map(formatDateOnly)
    });
  }

  const startDate = body.startDate as string | undefined;
  const endDate = body.endDate as string | undefined;
  if (!startDate || !endDate || !body.weekdays) {
    return NextResponse.json({ ok: false, message: "Seriendaten fehlen." }, { status: 400 });
  }

  const weekdays = parseWeekdays(body.weekdays as string[]);
  const targetDates = enumerateSeriesDates(startDate, endDate, weekdays);

  const existing = await prisma.release.findMany({
    where: {
      spotId: spot.id,
      date: { in: targetDates }
    }
  });

  const existingDates = new Set(existing.map((rel) => rel.date.getTime()));
  targetDates.forEach((date) => {
    if (existingDates.has(date.getTime())) {
      removedDates.push(date);
    } else {
      missingDates.push(date);
    }
  });

  if (existing.length > 0) {
    await prisma.release.deleteMany({
      where: {
        id: { in: existing.map((rel) => rel.id) }
      }
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Serie storniert.",
    removedDates: removedDates.map(formatDateOnly),
    missingDates: missingDates.map(formatDateOnly)
  });
}
