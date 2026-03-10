# TruckSpot

Real-time food truck tracking SaaS platform. GPS broadcasting, demand heatmaps, reroute intelligence, and POS integration — built for food truck operators and POS resellers.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-org%2Ftruckspot&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,PUSHER_APP_ID,PUSHER_KEY,PUSHER_SECRET,PUSHER_CLUSTER,NEXT_PUBLIC_PUSHER_KEY,NEXT_PUBLIC_PUSHER_CLUSTER&envDescription=Required%20environment%20variables%20for%20TruckSpot&project-name=truckspot)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL                                │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  │
│  │  /map    │  │ /operator│  │ /pricing  │  │  /api/*   │  │
│  │ (public) │  │(authed)  │  │ (static)  │  │ (routes)  │  │
│  └────┬─────┘  └────┬─────┘  └───────────┘  └─────┬─────┘  │
│       │              │                              │        │
│       │         ┌────┴─────┐                        │        │
│       │         │next-auth │                        │        │
│       │         │(JWT/cred)│                        │        │
│       │         └──────────┘                        │        │
│       │                                             │        │
│  ┌────┴─────────────────────────────────────────────┴────┐  │
│  │                  Next.js API Routes                    │  │
│  │  POST /api/trucks           — register truck           │  │
│  │  POST /api/trucks/[id]/loc  — GPS update + Pusher      │  │
│  │  PATCH /api/trucks/[id]     — toggle live status       │  │
│  │  POST /api/transactions     — POS sale log             │  │
│  │  GET  /api/hotspots         — demand clusters          │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
  ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
  │ PostgreSQL │  │  Pusher   │  │  Leaflet  │
  │  (Prisma)  │  │(WebSocket)│  │   (Maps)  │
  └───────────┘  └───────────┘  └───────────┘

  Models: Operator, Truck, GpsEvent, Transaction, Subscription
```

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
- Pusher account (free tier at https://pusher.com)

### Steps

```bash
# 1. Clone and install
git clone <repo-url> && cd truckspot
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, Pusher keys, and NEXTAUTH_SECRET

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Seed test data
npm run db:seed

# 5. Start development server
npm run dev
```

Open http://localhost:3000

### Test Accounts

| Email                    | Password      | Tier       |
|--------------------------|---------------|------------|
| mike@tacoking.com        | password123   | Basic      |
| sarah@bbqbus.com         | password123   | Pro        |
| james@fusionbites.com    | password123   | Enterprise |

All trucks are seeded around Austin, TX (30.2672, -97.7431).

---

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel dashboard (or use the deploy button above)
3. Add environment variables in Vercel project settings:
   - `DATABASE_URL` — your PostgreSQL connection string (e.g. Neon, Supabase, Railway)
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Vercel production URL
   - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
   - `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`
4. Run `npx prisma migrate deploy` against your production database
5. Seed production data: `npm run db:seed`

The `postinstall` script runs `prisma generate` automatically during Vercel builds.

---

## Subscription Tiers

| Tier       | Price   | Features                                           |
|------------|---------|----------------------------------------------------|
| Basic      | $29/mo  | GPS broadcasting, public map listing               |
| Pro        | $79/mo  | + Heatmap overlay, reroute suggestions, hotspot API |
| Enterprise | $199/mo | + White-label, POS webhook, dedicated support       |

---

## Reseller Integration Guide

TruckSpot is designed to be embedded by POS (point-of-sale) companies as a paid add-on for their food truck merchants. Here's how to integrate:

### 1. Transaction Webhook

Your POS system pushes each sale to TruckSpot, tagging it with the truck's GPS coordinate:

```typescript
// POST https://your-truckspot.vercel.app/api/transactions
const response = await fetch("https://your-truckspot.vercel.app/api/transactions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <API_KEY>"
  },
  body: JSON.stringify({
    itemName: "Brisket Plate",
    price: 14.99,
    lat: 30.2672,
    lng: -97.7431,
    truckId: "truck_abc123"
  })
});
```

This data powers the heatmap and reroute features.

### 2. Truck Registration

Register each merchant's truck when they enable the TruckSpot add-on:

```typescript
// POST https://your-truckspot.vercel.app/api/trucks
const response = await fetch("https://your-truckspot.vercel.app/api/trucks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Mike's Tacos",
    cuisineType: "Mexican",
    operatorId: "operator_xyz"
  })
});
```

### 3. GPS Updates

Push GPS coordinates from the merchant's device (or your POS hardware):

```typescript
// POST https://your-truckspot.vercel.app/api/trucks/{truckId}/location
const response = await fetch(`https://your-truckspot.vercel.app/api/trucks/${truckId}/location`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    lat: 30.2672,
    lng: -97.7431
  })
});
```

Each update triggers a Pusher event on channel `truck-{id}`, event `location-updated`.

### 4. Subscription Management

Assign a subscription tier to control feature access. The tier determines which dashboard features the operator can see:

- **Basic**: GPS broadcasting only
- **Pro**: GPS + heatmap overlay + reroute suggestions
- **Enterprise**: All Pro features + white-label + POS webhook integration

### 5. Embedding the Customer Map

Embed the public map in your POS dashboard or merchant portal by iframing `/map`:

```html
<iframe
  src="https://your-truckspot.vercel.app/map"
  width="100%"
  height="600"
  frameborder="0"
></iframe>
```

Or use the `/api/trucks?live=true` endpoint to build a custom map in your own UI.

### 6. Hotspot Data

Pull demand hotspots to display in your POS analytics dashboard:

```typescript
// GET https://your-truckspot.vercel.app/api/hotspots
// Returns clusters with transaction count > 1 in the last 2 hours
const response = await fetch("https://your-truckspot.vercel.app/api/hotspots");
const { data } = await response.json();
// data: [{ lat: 30.267, lng: -97.743, count: 5 }, ...]
```

### Revenue Model

Charge your merchants a monthly add-on fee (e.g. $49/mo) and pay TruckSpot the wholesale tier rate ($29-$199/mo). The margin is yours.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: next-auth (credentials provider, JWT sessions)
- **Real-time**: Pusher (WebSocket events)
- **Maps**: Leaflet via react-leaflet
- **Hosting**: Vercel
