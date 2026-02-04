import BookingClient from "./components/BookingClient";
import MyReservations from "./components/MyReservations";
import { prisma } from "../lib/db";
import { formatDateOnly, parseDateOnly } from "../lib/dates";

export default async function Home({
  searchParams
}: {
  searchParams?: { date?: string };
}) {
  const today = formatDateOnly(new Date());
  const selectedDate = searchParams?.date ?? today;
  const dateValue = parseDateOnly(selectedDate);

  const releases = await prisma.release.findMany({
    where: { date: dateValue, spot: { active: true } },
    include: { spot: true }
  });
  const reservations = await prisma.reservation.findMany({
    where: { date: dateValue }
  });
  const reservedSpotIds = new Set(reservations.map((reservation) => reservation.spotId));
  const availableSpots = releases
    .filter((release) => !reservedSpotIds.has(release.spotId))
    .map((release) => ({ id: release.spotId, label: release.spot.label }));

  return (
    <div className="grid">
      <section className="card">
        <h2>Datum auswählen</h2>
        <form method="get" className="grid two">
          <label>
            Datum
            <input type="date" name="date" defaultValue={selectedDate} />
          </label>
          <button type="submit">Anzeigen</button>
        </form>
      </section>

      <BookingClient date={selectedDate} spots={availableSpots} />
      <MyReservations />
    </div>
  );
}
