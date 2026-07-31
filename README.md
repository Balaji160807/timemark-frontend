# TimeMark — Frontend (Phase 3)

Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui-style components.
Consumes the TimeMark backend's REST API exactly as documented in its README.

This build has been verified end-to-end with `npm run build` (all 4 routes compile,
zero TypeScript errors) as part of putting this together.

## Run with Docker

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 -t timemark-frontend .
docker run -p 3000:3000 timemark-frontend
```
Note: `NEXT_PUBLIC_API_URL` is inlined into the client bundle at **build** time —
pass it as a `--build-arg`, not a `docker run -e` flag, or it won't take effect.

## CI/CD
`.github/workflows/ci.yml` installs dependencies and runs `npm run build` (which
also runs the TypeScript checks) on every push/PR, then builds and pushes a Docker
image to GitHub Container Registry on pushes to `main`.

## Setup

```bash
npm install
cp .env.local.example .env.local   # point at your running backend
npm run dev
```

Open `http://localhost:3000`. Make sure the backend (see `timemark-backend/`) is
running on the URL set in `.env.local` (defaults to `http://localhost:8080`).

## What's here
- `app/login` — sign in, redirects by role afterward
- `app/employee` — check-in/out (uses the browser Geolocation API), leave request form,
  your leave history
- `app/admin` — today's team attendance table, leave approval queue (HR/Manager/Admin only)
- `lib/api.ts` — typed fetch client mapped 1:1 to the backend's DTOs
- `lib/auth.ts` — session storage + role guard helpers
- `components/ui/*` — shadcn-style primitives (Button, Input, Card, Badge) — these are
  copied source files you own and can restyle freely, not an installed package, which is
  the actual shadcn/ui convention

## Notes on a few real decisions (good interview material)
- **Session in `localStorage`, not an httpOnly cookie.** Fine for a student/demo build
  where the frontend and backend are both yours; call this out explicitly if asked —
  production should move the token into an httpOnly cookie set by the backend to
  reduce XSS exposure.
- **Geolocation is requested client-side and sent with check-in**, but if the user denies
  permission, check-in still succeeds without coordinates rather than blocking them —
  the backend treats geofencing as a Phase 4 enforcement step, not a Phase 3 blocker.
- **No global state library.** Each page fetches what it needs on mount. Reasonable at
  this size; if the app grows shared state across many pages, that's the natural point
  to introduce something like Zustand or React Query.

## Next
- Phase 4: wire real geofence validation (reject check-ins outside the office radius),
  add a QR check-in flow as an alternative to GPS.
- Phase 5: deploy this to Vercel or alongside the backend on EC2, wire CI to run
  `npm run build` on every PR.
