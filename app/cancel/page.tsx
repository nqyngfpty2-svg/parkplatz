"use client";

import { useEffect, useState } from "react";

type CancelResponse = {
  ok: boolean;
  deletedCount?: number;
  message?: string;
};

type StoredToken = {
  date: string;
  spotLabel: string;
  token: string;
};

const STORAGE_KEY = "parkplatzTokens";

export default function CancelPage() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [stored, setStored] = useState<StoredToken[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setStored([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as StoredToken[];
      setStored(Array.isArray(parsed) ? parsed : []);
    } catch {
      setStored([]);
    }
  }, []);

  const handleCancel = async (cancelToken: string) => {
    setMessage(null);
    const response = await fetch("/api/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelToken })
    });
    const data = (await response.json()) as CancelResponse;
    if (data.ok) {
      setMessage(data.message ?? "Storno erfolgt.");
      const next = stored.filter((item) => item.token !== cancelToken);
      setStored(next);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      setMessage(data.message ?? "Storno fehlgeschlagen.");
    }
  };

  return (
    <div className="grid">
      <section className="card">
        <h2>Buchung stornieren</h2>
        <label>
          Cancel-Token
          <input value={token} onChange={(event) => setToken(event.target.value)} />
        </label>
        <button onClick={() => handleCancel(token)}>Stornieren</button>
        {message && <p className="alert success">{message}</p>}
      </section>

      <section className="card">
        <h3>Gespeicherte Tokens</h3>
        {stored.length === 0 ? (
          <p className="alert">Keine gespeicherten Tokens vorhanden.</p>
        ) : (
          <ul className="list">
            {stored.map((item) => (
              <li key={`${item.spotLabel}-${item.date}`}>
                <span className="badge">
                  {item.spotLabel} am {item.date}
                </span>
                <div>
                  <code>{item.token}</code>
                </div>
                <button className="secondary" onClick={() => handleCancel(item.token)}>
                  Dieses Token stornieren
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
