import assert from "node:assert/strict";
import { test } from "node:test";
import {
  enumerateSeriesDates,
  evaluateReservationSeries,
  evaluateReleaseSeries
} from "../lib/series";
import { parseDateOnly } from "../lib/dates";

test("enumerateSeriesDates respects weekdays", () => {
  const dates = enumerateSeriesDates("2024-01-01", "2024-01-07", [1, 3, 5]);
  assert.deepEqual(dates.map((date) => date.toISOString().slice(0, 10)), [
    "2024-01-01",
    "2024-01-03",
    "2024-01-05"
  ]);
});

test("evaluateReleaseSeries detects collisions", () => {
  const targetDates = [parseDateOnly("2024-02-01"), parseDateOnly("2024-02-02")];
  const existingDates = [parseDateOnly("2024-02-02")];
  const { okDates, collisions } = evaluateReleaseSeries(targetDates, existingDates);
  assert.equal(okDates.length, 1);
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0], "2024-02-02");
});

test("evaluateReservationSeries handles missing releases and reservations", () => {
  const targetDates = [
    parseDateOnly("2024-03-01"),
    parseDateOnly("2024-03-02"),
    parseDateOnly("2024-03-03")
  ];
  const releasedDates = [parseDateOnly("2024-03-01"), parseDateOnly("2024-03-03")];
  const reservedDates = [parseDateOnly("2024-03-03")];
  const { okDates, collisions } = evaluateReservationSeries(
    targetDates,
    releasedDates,
    reservedDates
  );
  assert.deepEqual(okDates.map((date) => date.toISOString().slice(0, 10)), [
    "2024-03-01"
  ]);
  assert.deepEqual(collisions, [
    { date: "2024-03-02", reason: "notReleased" },
    { date: "2024-03-03", reason: "alreadyReserved" }
  ]);
});
