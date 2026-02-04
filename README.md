# Parkplatz-Freigabe & Buchung

Anonyme Web-App zur Freigabe und Buchung von Parkplätzen ohne personenbezogene Daten.

## Ziele / Privacy
- Es werden **keine personenbezogenen Daten** gespeichert (keine Namen, Emails, Mitarbeiter-IDs, IP-Logs).
- Gespeichert werden ausschließlich Parkplatz-Labels, Freigaben, Buchungen und **gehashte Tokens**.
- Kein Login.

## Tech-Stack
- Next.js (App Router) + TypeScript
- Prisma + SQLite

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Nach dem Seed erscheinen einmalige Owner-Codes in der Ausgabe. Diese an die jeweiligen Parkplatzbesitzer:innen verteilen.

## Docker

```bash
docker build -t parkplatz .
docker run -p 3000:3000 -e DATABASE_URL=file:./dev.db parkplatz
```

Beim ersten Start im Container Migration ausführen:

```bash
docker run -p 3000:3000 -e DATABASE_URL=file:./dev.db parkplatz sh -c "npx prisma migrate deploy && node .next/standalone/server.js"
```

## API

### POST /api/release
Freigabe eines Parkplatzes (Owner-Code erforderlich).

Body (Single):
```json
{ "ownerCode": "...", "date": "2024-01-05", "mode": "hard" }
```

Body (Serie):
```json
{ "ownerCode": "...", "startDate": "2024-01-01", "endDate": "2024-01-31", "weekdays": ["mon","tue"], "mode": "soft" }
```

### POST /api/reserve
Buchung eines Spots.

Body (Single):
```json
{ "spotLabel": "P-01", "date": "2024-01-05" }
```

Body (Serie):
```json
{ "spotLabel": "P-01", "startDate": "2024-01-01", "endDate": "2024-01-31", "weekdays": ["mon","tue"], "mode": "soft" }
```

### POST /api/cancel
Storno per Cancel-Token.

Body:
```json
{ "cancelToken": "..." }
```

## Hinweise zur Token-Logik
- Owner-Codes und Cancel-Tokens werden **nur gehasht gespeichert** (SHA-256).
- Cancel-Tokens werden einmalig angezeigt und lokal im Browser gespeichert (localStorage).

## Tests

```bash
npm test
```
