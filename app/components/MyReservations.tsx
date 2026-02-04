"use client";

import { useEffect, useState } from "react";

type ReservationToken = {
  date: string;
  spotLabel: string;
  token: string;
};

const STORAGE_KEY = "parkplatzTokens";

export default function MyReservations() {
  const [tokens, setTokens] = useState<ReservationToken[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setTokens([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as ReservationToken[];
      setTokens(Array.isArray(parsed) ? parsed : []);
    } catch {
      setTokens([]);
    }
  }, []);

  return (
    <div className="card">
      <h2>Meine Buchungen (dieses Gerät)</h2>
      {tokens.length === 0 ? (
        <p className="alert">Noch keine gespeicherten Buchungen.</p>
      ) : (
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
      )}
    </div>
  );
}
