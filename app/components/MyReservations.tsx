"use client";

import { useEffect, useMemo, useState } from "react";

type ReservationToken = {
  date: string;
  spotLabel: string;
  token: string;
};

type StatusResponse = {
  ok: boolean;
  statuses?: TokenStatus[];
  message?: string;
};

type TokenStatus = {
  date: string;
  spotLabel: string;
  status: "active" | "owner-cancelled" | "missing" | "unknown";
};

const STORAGE_KEY = "parkplatzTokens";

function buildKey(spotLabel: string, date: string) {
  return `${spotLabel}:${date}`;
}

export default function MyReservations() {
  const [tokens, setTokens] = useState<ReservationToken[]>([]);
  const [statusMap, setStatusMap] = useState<Map<string, TokenStatus>>(new Map());

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

  useEffect(() => {
    if (tokens.length === 0) {
      setStatusMap(new Map());
      return;
    }

    const loadStatuses = async () => {
      const response = await fetch("/api/reservations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens })
      });
      const data = (await response.json()) as StatusResponse;
      if (!data.ok || !data.statuses) {
        setStatusMap(new Map());
        return;
      }
      setStatusMap(
        new Map(
          data.statuses.map((status) => [buildKey(status.spotLabel, status.date), status])
        )
      );
    };

    loadStatuses();
  }, [tokens]);

  const statusLabel = useMemo(
    () => ({
      active: "Aktiv",
      "owner-cancelled": "Nicht mehr gültig (Owner storniert)",
      missing: "Nicht mehr gültig",
      unknown: "Unbekannter Parkplatz"
    }),
    []
  );

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
              {statusMap.get(buildKey(token.spotLabel, token.date)) && (
                <span
                  className={`status ${statusMap.get(buildKey(token.spotLabel, token.date))?.status ?? ""}`}
                >
                  {statusLabel[
                    statusMap.get(buildKey(token.spotLabel, token.date))?.status ?? "active"
                  ]}
                </span>
              )}
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
