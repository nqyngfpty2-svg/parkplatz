"use client";

import { useMemo, useState } from "react";

type Spot = {
  id: string;
  label: string;
};

type ReservationToken = {
  date: string;
  spotLabel: string;
  token: string;
};

type ReservationResponse = {
  ok: boolean;
  tokens?: ReservationToken[];
  collisions?: { date: string; reason: string }[];
  message?: string;
};

const STORAGE_KEY = "parkplatzTokens";

function readStoredTokens(): ReservationToken[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as ReservationToken[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredTokens(tokens: ReservationToken[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function addTokens(tokens: ReservationToken[]) {
  const existing = readStoredTokens();
  writeStoredTokens([...existing, ...tokens]);
}

export default function BookingClient({ date, spots }: { date: string; spots: Spot[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [tokens, setTokens] = useState<ReservationToken[]>([]);
  const [seriesSpot, setSeriesSpot] = useState("");
  const [seriesStart, setSeriesStart] = useState(date);
  const [seriesEnd, setSeriesEnd] = useState(date);
  const [seriesMode, setSeriesMode] = useState<"hard" | "soft">("hard");
  const [weekdays, setWeekdays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);

  const availableLabels = useMemo(() => spots.map((spot) => spot.label), [spots]);

  const handleSingleReserve = async (spotLabel: string) => {
    setMessage(null);
    setTokens([]);
    const response = await fetch("/api/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotLabel, date })
    });
    const data = (await response.json()) as ReservationResponse;
    if (data.ok && data.tokens) {
      setTokens(data.tokens);
      addTokens(data.tokens);
      setMessage("Buchung gespeichert. Bitte Cancel-Token sicher aufbewahren.");
    } else {
      setMessage(data.message ?? "Buchung fehlgeschlagen.");
    }
  };

  const handleSeriesReserve = async () => {
    setMessage(null);
    setTokens([]);
    const response = await fetch("/api/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spotLabel: seriesSpot,
        startDate: seriesStart,
        endDate: seriesEnd,
        weekdays,
        mode: seriesMode
      })
    });
    const data = (await response.json()) as ReservationResponse;
    if (data.ok && data.tokens) {
      setTokens(data.tokens);
      addTokens(data.tokens);
      setMessage("Serienbuchung verarbeitet. Tokens einmalig speichern.");
    } else {
      setMessage(data.message ?? "Serienbuchung fehlgeschlagen.");
    }
  };

  return (
    <div className="grid">
      <div className="card">
        <h2>Freie Parkplätze am {date}</h2>
        {spots.length === 0 ? (
          <p className="alert">Keine freigegebenen Plätze verfügbar.</p>
        ) : (
          <ul className="list">
            {spots.map((spot) => (
              <li key={spot.id}>
                <div className="grid two">
                  <span>
                    <strong>{spot.label}</strong>
                  </span>
                  <button onClick={() => handleSingleReserve(spot.label)}>Buchen</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Serienbuchung</h2>
        <div className="grid two">
          <label>
            Parkplatz-Label
            <input
              value={seriesSpot}
              onChange={(event) => setSeriesSpot(event.target.value)}
              placeholder="z.B. P-01"
              list="spot-labels"
            />
            <datalist id="spot-labels">
              {availableLabels.map((label) => (
                <option key={label} value={label} />
              ))}
            </datalist>
          </label>
          <label>
            Modus
            <select value={seriesMode} onChange={(event) => setSeriesMode(event.target.value as "hard" | "soft")}>
              <option value="hard">Hard (Rollback bei Kollision)</option>
              <option value="soft">Soft (Buche was geht)</option>
            </select>
          </label>
          <label>
            Startdatum
            <input type="date" value={seriesStart} onChange={(event) => setSeriesStart(event.target.value)} />
          </label>
          <label>
            Enddatum
            <input type="date" value={seriesEnd} onChange={(event) => setSeriesEnd(event.target.value)} />
          </label>
          <label>
            Wochentage (Mehrfachauswahl)
            <select
              multiple
              value={weekdays}
              onChange={(event) =>
                setWeekdays(Array.from(event.target.selectedOptions).map((option) => option.value))
              }
            >
              <option value="mon">Mo</option>
              <option value="tue">Di</option>
              <option value="wed">Mi</option>
              <option value="thu">Do</option>
              <option value="fri">Fr</option>
              <option value="sat">Sa</option>
              <option value="sun">So</option>
            </select>
          </label>
        </div>
        <button onClick={handleSeriesReserve}>Serienbuchung anlegen</button>
      </div>

      {message && <div className="alert success">{message}</div>}

      {tokens.length > 0 && (
        <div className="card">
          <h3>Cancel-Tokens</h3>
          <p>Nur jetzt sichtbar. Zusätzlich in diesem Browser gespeichert.</p>
          <ul className="list">
            {tokens.map((token) => (
              <li key={`${token.spotLabel}-${token.date}`}>
                <span className="badge">
                  {token.spotLabel} am {token.date}
                </span>
                <div>
                  <code>{token.token}</code>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
