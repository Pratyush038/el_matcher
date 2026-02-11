# EL Matcher

Team matchmaking platform for RVCE students to form EL (Experiential Learning) project teams.

## Features

- **Registration & Auth** — Sign up with your `@rvce.edu.in` email and USN via Supabase Auth
- **Create Teams** — Start a team, get a unique 8-character invite code, and share it
- **Join with Code** — Enter an invite code to instantly join a team
- **Cluster Constraints** — Set limits on how many members can join from each cluster (CS, EC, ME)
- **Browse Teams** — Find open teams that need someone from your branch or cluster
- **Looking for Team** — Mark yourself as available so team leaders can find you
- **Profile Management** — Update your info, interests, and branch

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth & Database:** Supabase (Auth + PostgreSQL with RLS)
- **UI:** shadcn/ui + Tailwind CSS v4
- **State:** React Query + custom hooks
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone <repo-url>
   cd el_matcher
   npm install
   ```

2. Copy the env template and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```

3. Run the SQL schema in your Supabase SQL Editor:
   ```
   supabase/schema.sql
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to access the app.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (default)/          # Authenticated layout with sidebar
│   │   ├── dashboard/      # User dashboard
│   │   ├── browse/         # Browse open teams
│   │   ├── looking/        # Students looking for teams
│   │   ├── profile/        # Edit profile
│   │   └── teams/          # Create, join, and view teams
│   ├── api/signup/         # Server-side registration endpoint
│   ├── register/           # Registration page
│   └── signin/             # Sign-in page
├── components/             # UI and feature components
├── hooks/                  # React hooks
└── lib/                    # Utilities, types, configs, Supabase clients
supabase/
└── schema.sql              # Full database schema with RLS & seed data
```

## License

MIT
