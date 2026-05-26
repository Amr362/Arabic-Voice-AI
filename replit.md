# ArabVoice AI

A full-stack Arabic AI Voice SaaS platform — converts text to natural Arabic speech and clones voices using AI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/arabvoice run dev` — run the React frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `HF_TOKEN`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS v4, shadcn/ui, framer-motion, wouter, @tanstack/react-query
- Auth: Supabase Auth (`@supabase/supabase-js`)
- API: Express 5, contract-first OpenAPI → Orval codegen
- DB: PostgreSQL + Drizzle ORM
- TTS Engine 1: Edge-TTS (Microsoft Azure Edge voice endpoint)
- TTS Engine 2: Hugging Face XTTS-v2 (voice cloning, Pro Clone plan only)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/arabvoice/` — React+Vite frontend
  - `src/pages/` — all page components (Landing, Login, Signup, Dashboard, Generate, Clone, History, Subscription, Profile, Admin)
  - `src/components/` — shared components (DashboardLayout, AudioPlayer, shadcn/ui)
  - `src/context/AuthContext.tsx` — Supabase auth state
  - `src/lib/auth.ts` — auth helpers + setAuthTokenGetter wiring
  - `src/lib/supabase.ts` — Supabase client
- `artifacts/api-server/` — Express 5 API
  - `src/routes/` — voices, tts, history, user, admin, auth middleware
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/` — generated React Query hooks + Zod schemas
- `lib/db/` — Drizzle schema (`usersTable`, `generationsTable`, `subscriptionsTable`)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval generates React Query hooks + Zod schemas. Never write fetch calls by hand.
- Supabase Auth for user management; JWT passed as Bearer token from `setAuthTokenGetter` in `custom-fetch.ts`.
- Edge-TTS handles free/starter/creator plans; XTTS-v2 via Hugging Face only for Pro Clone.
- WhatsApp-based payment flow (Egyptian market): Vodafone Cash, Orange Cash, Etisalat Cash, InstaPay.
- Admin panel accessible to users whose email ends with `@admin.arabvoice.ai`.
- Dark mode only (deep navy + amber/gold theme, RTL Arabic support throughout).

## Product

- **Landing page**: Arabic hero with animated waveform, feature grid, pricing (4 plans in EGP), testimonials, FAQ
- **Auth**: Supabase email/password signup + login, protected routes via ProtectedRoute component
- **Generate**: Arabic TTS with voice selector (10 voices across Egyptian, Saudi, UAE, Kuwaiti, Moroccan dialects), speed + pitch controls, text templates
- **Voice Clone** (Pro Clone only): Upload audio sample → XTTS-v2 clones voice
- **History**: Paginated list of all generations with inline audio player + delete
- **Subscription**: Plan comparison with WhatsApp payment links
- **Profile**: Edit name, view plan + join date
- **Admin**: User list, credit usage, plan management with live updates
- **Audio Player**: HTML5 Audio with waveform bars, seek bar, download

## Credit limits by plan

| Plan | Daily/Monthly | Engine |
|------|--------------|--------|
| free | 10/day | Edge-TTS |
| starter | 200/month | Edge-TTS |
| creator | 1000/month | Edge-TTS |
| pro_clone | unlimited | Edge-TTS + XTTS |

## User preferences

- RTL Arabic throughout all user-facing text; admin panel uses English
- Dark mode only — deep navy background (`224 71% 4%`) with amber/gold primary (`43 96% 58%`)
- Egyptian market focus — prices in EGP, WhatsApp payment

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec.
- VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are injected at build time via `vite.config.ts` define block (reads from env vars SUPABASE_URL and SUPABASE_ANON_KEY).
- Audio generation via Edge-TTS calls Microsoft's speech endpoint — requires network access.
- XTTS requires the HF_TOKEN secret and calls the Hugging Face Inference API.
- Supabase storage bucket "generations" must be created in the Supabase dashboard for audio file storage to work.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
