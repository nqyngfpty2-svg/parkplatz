"use client";

import { useState } from "react";

type ReleaseResponse = {
  ok: boolean;
  createdDates?: string[];
  collisions?: string[];
  message?: string;
};

type CancelResponse = {
  ok: boolean;
  removedDates?: string[];
  missingDates?: string[];
  message?: string;
};

export default function ReleasePage() {
  const [ownerCode, setOwnerCode] = useState("");
  const [singleDate, setSingleDate] = useState("");
  const [seriesStart, setSeriesStart] = useState("");
  const [seriesEnd, setSeriesEnd] = useState("");
  const [weekdays, setWeekdays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [mode, setMode] = useState<"hard" | "soft">("hard");
  const [result, setResult] = useState<ReleaseResponse | null>(null);
  const [cancelResult, setCancelResult] = useState<CancelResponse | null>(null);

  const handleSingleRelease = async () => {
    setResult(null);
    setCancelResult(null);
    const response = await fetch("/api/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerCode, date: singleDate, mode })
    });
    setResult((await response.json()) as ReleaseResponse);
  };

  const handleSeriesRelease = async () => {
    setResult(null);
    setCancelResult(null);
    const response = await fetch("/api/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerCode, startDate: seriesStart, endDate: seriesEnd, weekdays, mode })
    });
    setResult((await response.json()) as ReleaseResponse);
  };

  const handleSingleCancel = async () => {
    setCancelResult(null);
    setResult(null);
    const response = await fetch("/api/release", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerCode, date: singleDate })
    });
    setCancelResult((await response.json()) as CancelResponse);
  };

  const handleSeriesCancel = async () => {
    setCancelResult(null);
    setResult(null);
    const response = await fetch("/api/release", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerCode, startDate: seriesStart, endDate: seriesEnd, weekdays })
    });
    setCancelResult((await response.json()) as CancelResponse);
  };

  return (
    <div className="grid">
      <section className="card">
        <h2>Meinen Parkplatz freigeben</h2>
        <p>Owner-Code eingeben. Der Code bleibt nur in diesem Formular.</p>
        <label>
          Owner-Code
          <input value={ownerCode} onChange={(event) => setOwnerCode(event.target.value)} type="password" />
        </label>
        <label>
          Modus
          <select value={mode} onChange={(event) => setMode(event.target.value as "hard" | "soft")}>
            <option value="hard">Hard (Rollback bei Kollision)</option>
            <option value="soft">Soft (Freigabe was geht)</option>
          </select>
        </label>
      </section>

      <section className="card">
        <h3>Einzelner Tag</h3>
        <label>
          Datum
          <input type="date" value={singleDate} onChange={(event) => setSingleDate(event.target.value)} />
        </label>
        <div className="stack">
          <button onClick={handleSingleRelease}>Freigeben</button>
          <button className="secondary" onClick={handleSingleCancel}>
            Freigabe stornieren
          </button>
        </div>
      </section>

      <section className="card">
        <h3>Serie</h3>
        <div className="grid two">
          <label>
            Startdatum
            <input type="date" value={seriesStart} onChange={(event) => setSeriesStart(event.target.value)} />
          </label>
          <label>
            Enddatum
            <input type="date" value={seriesEnd} onChange={(event) => setSeriesEnd(event.target.value)} />
          </label>
          <label>
            Wochentage
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
        <div className="stack">
          <button onClick={handleSeriesRelease}>Serie freigeben</button>
          <button className="secondary" onClick={handleSeriesCancel}>
            Serie stornieren
          </button>
        </div>
      </section>

      {result && (
        <section className={`card ${result.ok ? "success" : "alert"}`}>
          <h3>{result.ok ? "Erfolg" : "Hinweis"}</h3>
          <p>{result.message}</p>
          {result.createdDates && result.createdDates.length > 0 && (
            <div>
              <h4>Freigegebene Tage</h4>
              <ul className="list">
                {result.createdDates.map((date) => (
                  <li key={date}>{date}</li>
                ))}
              </ul>
            </div>
          )}
          {result.collisions && result.collisions.length > 0 && (
            <div>
              <h4>Kollisionen</h4>
              <ul className="list">
                {result.collisions.map((date) => (
                  <li key={date}>{date}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {cancelResult && (
        <section className={`card ${cancelResult.ok ? "success" : "alert"}`}>
          <h3>{cancelResult.ok ? "Storniert" : "Hinweis"}</h3>
          <p>{cancelResult.message}</p>
          {cancelResult.removedDates && cancelResult.removedDates.length > 0 && (
            <div>
              <h4>Stornierte Tage</h4>
              <ul className="list">
                {cancelResult.removedDates.map((date) => (
                  <li key={date}>{date}</li>
                ))}
              </ul>
            </div>
          )}
          {cancelResult.missingDates && cancelResult.missingDates.length > 0 && (
            <div>
              <h4>Nicht gefunden</h4>
              <ul className="list">
                {cancelResult.missingDates.map((date) => (
                  <li key={date}>{date}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
