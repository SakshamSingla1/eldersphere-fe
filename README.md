# ElderSphere — Frontend

React + TypeScript (Vite) frontend for **ElderSphere**, an elderly-care marketplace: family
members discover and book verified caretakers for their elders, share medical records with
those caretakers, and can trigger emergency alerts. Talks to the Spring Boot backend in
`../eldersphere-be`.

Architecture (folder taxonomy, service-hook pattern, shared Listing/Form-shell CRUD
pattern) mirrors the reference project at `../../Portfolio/portfolio-fe`, adapted to this
domain — see **Scope decisions** below for where and why it diverges.

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
```

Requires the backend running at `http://localhost:8080` (see `../eldersphere-be`) with CORS
configured to allow `http://localhost:5173` (its default `app.frontend.url`).

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | Base URL the axios client (`src/services/index.ts`) targets. |

Copy `.env.example` to `.env` (already done for local dev) and adjust if the backend runs
elsewhere.

### Other scripts

```bash
npm run build      # tsc -b && vite build — type-checks then produces dist/
npm run preview    # serve the production build locally
npm run lint       # eslint
```

## Route map

### Public (unauthenticated)

| Path | Page |
|---|---|
| `/` | Landing page (hero, features, how-it-works, testimonials, FAQ, contact form) |
| `/login` | Login |
| `/register` | Register (choose Family member or Caretaker) |
| `/forgot-password` | Request a password reset email |
| `/reset-password?token=...` | Set a new password from the emailed link |

### Family (`userType: FAMILY` or `ELDER`)

| Path | Page |
|---|---|
| `/family/dashboard` | Elder count, upcoming bookings, quick actions |
| `/family/elder-profiles` | CRUD for the elders this family member manages |
| `/family/caretakers` | Search/filter verified caretakers |
| `/family/caretakers/:id` | Caretaker profile, reviews, and the booking form |
| `/family/bookings` | List bookings, cancel, jump to leave a review |
| `/family/medical-records` | View records a caretaker has shared, per elder |
| `/family/reviews` | Leave a review for a completed booking (`?bookingId=`) |
| `/family/notifications` | In-app notifications |
| `/family/emergency` | One-tap emergency alert trigger + alert history |
| `/family/settings` | Account info + change password |

### Caretaker (`userType: CARETAKER`)

| Path | Page |
|---|---|
| `/caretaker/dashboard` | Stats (bookings, rating, verification) + upcoming bookings |
| `/caretaker/profile` | Bio, specialties, rate, experience, photo, verification status |
| `/caretaker/bookings` | Accept / decline / start / complete bookings |
| `/caretaker/reviews` | Reviews received |
| `/caretaker/notifications` | In-app notifications |
| `/caretaker/settings` | Account info + change password |

### Admin (`userType: ADMIN`)

| Path | Page |
|---|---|
| `/admin/dashboard` | Platform stats + recent activity |
| `/admin/users` | User CRUD, status, role assignment |
| `/admin/caretaker-verification` | Approve/reject caretaker profiles |
| `/admin/elder-profiles` | Elder profile lookup-by-ID (see Scope decisions) |
| `/admin/services` | Service offering catalog CRUD |
| `/admin/bookings` | All bookings, status transitions |
| `/admin/medical-records` | Medical records lookup-by-elder-ID |
| `/admin/reviews` | Reviews lookup-by-caretaker-ID |
| `/admin/emergency-alerts` | Live emergency alert queue, acknowledge/resolve |
| `/admin/landing-management` | Hero/CTA config + Features/FAQs/Testimonials CRUD |
| `/admin/contact-us` | Contact form submissions, status, delete |
| `/admin/roles-permissions` | Roles CRUD, Permissions CRUD, role↔permission assignment |
| `/admin/platform-settings` | Platform name, support contacts, emergency SLA |
| `/admin/settings` | Account info + change password |

## Scope decisions

**UI kit.** The reference project layers Tailwind + react-jss + framer-motion + Radix UI +
a large hand-rolled design system on top of MUI. This build uses **MUI** as the sole UI kit
(plus small typed atom wrappers — `Button`, `TextField`, `Select`, `Checkbox`, `StatusChip`,
`DatePicker`) instead of reproducing that whole custom system, to keep ~13 admin modules +
3 authenticated shells + a full public site tractable. `framer-motion`, `react-jss`,
Tailwind, Radix, `jodit` (rich text), `dnd-kit`, `react-icon-cloud`/`react-github-calendar`
(portfolio-specific embeds), `qrcode.react`, and `vaul` were dropped — none of them have an
ElderSphere equivalent need.

**i18n dropped.** No `react-i18next`/locale files — the app ships English-only. The
reference's i18n setup exists for a portfolio-builder that serves many public sites in many
languages; there's no such requirement here.

**Data fetching dropped `@tanstack/react-query`.** Service hooks + `useState`/`useEffect`
(see the shared `CrudModule` template) are enough for this app's CRUD needs and keep one
fewer moving part; nothing here needed cross-component cache invalidation.

**One generic `CrudModule` instead of per-module Add/Edit/View pages.** The reference
project gives each entity (e.g. Skill) its own `Add*.page.tsx` / `Edit*.page.tsx` /
`View*.page.tsx` routed at `/add` and `/:id/edit`, all composing the same
`ListingShell`/`FormShell`/`TableV1`. With 13 admin modules here (vs. the reference's own
long list), those shells were kept but wired through one reusable
`components/templates/Shared/CrudModule.template.tsx` that owns list/pagination/search/
dialog state; each admin page just supplies its columns, fields, and service calls. Add/Edit
happens in a dialog rather than a dedicated route. `ListingShell.template.tsx` and
`FormShell.template.tsx` are still there and still the reused chrome underneath it.

**Backend contract gaps that shaped three admin pages** (discovered reading the actual
controllers, not a frontend choice):
- `ElderProfileController`'s `GET /elder-profiles` is scoped to the calling family user's
  own elders — there is no admin "list all" endpoint. **Admin → Elder Profiles** is
  therefore a lookup-by-ID + delete tool, not a browsable table.
- `MedicalRecordController` only lists per elder (`GET /medical-records/elder/{id}`) — no
  global listing. **Admin → Medical Records** requires an elder ID first.
- `ReviewController` only lists per caretaker (`GET /reviews/caretaker/{id}`) — no global
  listing. **Admin → Reviews** requires a caretaker ID first.
- `CaretakerController` has no admin list-all either, so **Admin → Caretaker Verification**
  reuses the public `GET /search/caretakers` endpoint (filterable by `verificationStatus`)
  as its queue source.

**Booking "reschedule" is cancel + rebook.** `BookingController` only exposes `POST`
(create) and `PUT /{id}/status` (status transitions) — there's no "update date/time"
endpoint to call, so the brief's "reschedule" is implemented as cancelling the existing
booking and creating a new one from the caretaker's profile page.

**Caretaker "availability" omitted.** `CaretakerProfileRequest`/`CaretakerProfileResponse`
only model `bio`, `specialties`, `yearsOfExperience`, `hourlyRate` and verification status —
there's no availability/schedule field on the backend to manage, so it isn't fabricated on
the frontend.

**Auth relies on the httpOnly cookie, not a stored JWT string.** `AuthController` sets both
an `accessToken` and `refreshToken` httpOnly cookie on login (`JwtAuthFilter` accepts either
that cookie or a `Bearer` header), and CORS is configured with `allowCredentials(true)` for
the dev frontend origin. `src/services/index.ts` sets `withCredentials: true` on every
request and interceptors a `401` into one `/auth/refresh` call + retry before redirecting to
`/login`; the frontend never reads or stores the raw token (it isn't accessible from JS
anyway since the cookie is httpOnly). `AuthenticatedUserContext` persists the non-sensitive
profile fields (name/email/role/userType) to `localStorage` for the UI, nothing else.

**Landing page copy.** Dynamic sections (hero headline/subheadline, CTA, feature cards,
FAQs, testimonials) are fetched from `GET /landing/page` and rendered with sensible
fallbacks. Sections with no backend model at all (nav links, the 4-step "How It Works",
footer link groups, contact details) are the real copy adapted from the reference
marketing site (https://help-at-hand-now.lovable.app/, itself branded "CareHive") rebranded
to ElderSphere — not invented generic placeholder text.
