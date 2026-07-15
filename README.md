# StreamNest

A personal streaming dashboard: organize and launch your own **authorized** live channels
in one premium, dark-mode interface. Next.js 14 (App Router) + TypeScript + Tailwind +
Prisma/PostgreSQL.

StreamNest does not bundle, embed, or provide access to any third-party streams. Every
channel is empty until you — the account admin — attach a stream URL you're authorized to use.

---

## 1. Prerequisites

- Node.js 18.18+ (20 LTS recommended)
- A PostgreSQL database (local install, Docker, or a hosted service like Supabase/Neon/Railway)

## 2. Install

```bash
npm install
```

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/streamnest?schema=public"
JWT_SECRET="a long random string — e.g. `openssl rand -hex 32`"
```

Quick local Postgres via Docker if you don't have one:

```bash
docker run --name streamnest-db -e POSTGRES_USER=streamnest -e POSTGRES_PASSWORD=streamnest \
  -e POSTGRES_DB=streamnest -p 5432:5432 -d postgres:16
```

## 4. Create the database schema

```bash
npx prisma migrate dev --name init
```

## 5. Seed demo data (categories, channels, a demo user, an admin user)

```bash
npm run seed
```

This creates:
- `[email protected]` / password `streamnest123` — role **ADMIN**, can manage channels at `/admin`
- `[email protected]` / password `streamnest123` — role USER, has sample favorites/history

**Change these passwords (or delete the seed accounts) before deploying anywhere public.**

## 6. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`, sign in with the admin account, and go to **Settings → Open Admin**
(or `/admin` directly) to attach real stream URLs.

---

## Adding a live stream URL

1. Sign in as an admin (`role: ADMIN` in the `User` table — the seed script creates one).
2. Go to `/admin`.
3. Pick a channel from **Set Live Stream URL**, paste the URL, and save. Two kinds of URLs work:
   - **`.m3u8` (HLS) or `.mp4`/`.webm`** — played inline via `hls.js` (Chrome/Firefox/Edge) or
     native HLS (Safari/iOS). This is what most IPTV/restreaming panels give you.
   - **Any other URL** — rendered as an `<iframe>`. Use this for providers that only give you
     an embeddable player page rather than a raw manifest.
4. Open the channel from Live TV / Home — the player at `/player/[id]` picks the right mode
   automatically (see `src/components/Player.tsx`).

Stream URLs are only ever returned by the API to authenticated users (`src/app/api/channels/[id]/route.ts`),
so they aren't exposed on the public channel list.

To make another account an admin, update it directly in the database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = '[email protected]';
```

or via Prisma Studio: `npm run prisma:studio`.

---

## Project structure

```
prisma/
  schema.prisma        # User, Channel, Favorite, WatchHistory, UserSettings, RecentSearch
  seed.ts              # demo data
src/
  app/
    (dashboard)/        # pages that share the Header: home, live-tv, categories, favorites, recent, settings, admin
    player/[id]/         # the watch screen
    login/                # sign in / register
    api/                  # REST endpoints (see below)
  components/            # Header, Spotlight, Rail, ChannelCard, Player, PlayerFavoriteButton
  lib/
    prisma.ts             # Prisma client singleton
    auth.ts                # password/session helpers (JWT in an httpOnly cookie)
  types/index.ts           # shared TS types + CATEGORIES constant
```

## API reference

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account, starts a session |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current signed-in user |
| GET | `/api/channels` | List channels (`?category=`, `?q=`, `?favoritesOnly=1`) — no stream URLs |
| POST | `/api/channels` | Create a channel (admin) |
| GET | `/api/channels/:id` | Channel detail, including `streamUrl` (signed-in users only) |
| PATCH | `/api/channels/:id` | Update a channel, including setting `streamUrl` (admin) |
| DELETE | `/api/channels/:id` | Remove a channel (admin) |
| GET/POST | `/api/favorites` | List / toggle favorites |
| GET/POST | `/api/watch-history` | List / update "Continue Watching" progress |
| GET/PATCH | `/api/settings` | Read / update synced user preferences |

## Notes on scope

This is a complete, runnable full-stack app — auth, Postgres persistence, favorites, watch
history, synced settings, and channel/admin management are all real and working. A few things
you'll likely want before shipping publicly:

- **Rate limiting / CSRF** on the auth routes for production use.
- **Password reset flow** (email delivery isn't wired up here).
- **Analytics dashboard** in `/admin` (the schema already tracks `WatchHistory`, so aggregate
  queries are straightforward to add — e.g. total minutes per category per week).
- **Voice search** in the header is a UI affordance point; wiring it to the Web Speech API is a
  small addition in `Header.tsx`.
- **Real PWA install prompt/offline cache** — `manifest.json` is included; add a service worker
  (e.g. via `next-pwa`) if you want installability and offline metadata caching.

---

## Deploying to AWS EC2 (cheapest option)

This runs the Next.js app, PostgreSQL, and an Nginx reverse proxy as three Docker containers
on a single EC2 instance — no RDS bill, no load balancer, no Amplify build minutes.

**Cost:** a `t3.micro` (1 GiB RAM) is free-tier eligible for 12 months, then ~$7-8/mo; a
`t3.small` (2 GiB, more comfortable headroom for Postgres + Node together) runs ~$15/mo.
Either works for low-to-moderate traffic.

### 1. Launch the instance
- AMI: **Ubuntu 22.04 LTS** (or Amazon Linux 2023 — the setup script handles both)
- Instance type: `t3.micro` or `t3.small`
- Storage: 20 GB gp3 is plenty to start
- Security group: allow inbound **22** (SSH, ideally locked to your IP), **80**, **443**
- Attach an Elastic IP so the address doesn't change on reboot

### 2. Point a domain at it (optional but recommended for HTTPS)
Create an A record for your domain/subdomain pointing at the instance's Elastic IP.

### 3. Provision Docker on the instance
```bash
ssh -i your-key.pem ubuntu@<instance-ip>
curl -fsSL https://raw.githubusercontent.com/<you>/<repo>/main/scripts/ec2-setup.sh | bash
# log out and back in so the docker group applies
```
(Or copy `scripts/ec2-setup.sh` up with `scp` and run it directly if the repo isn't public yet.)

### 4. Clone your repo and configure secrets
```bash
git clone <your-repo-url> streamnest
cd streamnest
cp .env.production.example .env
nano .env   # set POSTGRES_PASSWORD and JWT_SECRET (openssl rand -hex 32)
```

### 5. Start everything
```bash
docker compose up -d --build
```
This builds the app image, starts Postgres, runs `prisma migrate deploy` automatically on
boot, and puts Nginx in front on port 80. Visit `http://<instance-ip>` — you should see
StreamNest. Seed demo data with:
```bash
docker compose exec app npx tsx prisma/seed.ts
```

### 6. Add HTTPS (once your domain resolves to the instance)
```bash
docker run -it --rm \
  -v $(pwd)/nginx:/etc/nginx/conf.d \
  -v certbot_www:/var/www/certbot \
  -v certbot_conf:/etc/letsencrypt \
  -p 80:80 certbot/certbot certonly --standalone \
  -d streamnest.example.com --email [email protected] --agree-tos -n
```
Then uncomment the HTTPS `server` block in `nginx/nginx.conf`, point the plain-HTTP block to
redirect to HTTPS instead of proxying, and reload:
```bash
docker compose exec nginx nginx -s reload
```
Renewals: add a cron job that runs `certbot renew` and reloads nginx every ~60 days.

### 7. Redeploying after changes
```bash
git pull
docker compose up -d --build
```

### Making yourself an admin
```bash
docker compose exec db psql -U streamnest -d streamnest \
  -c "UPDATE \"User\" SET role='ADMIN' WHERE email='[email protected]';"
```
"# streamnest" 
