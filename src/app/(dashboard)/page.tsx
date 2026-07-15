import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import Rail from '@/components/Rail';
import Spotlight from '@/components/Spotlight';
import type { ChannelSummary } from '@/types';

export const dynamic = 'force-dynamic';

async function getHomeData(userId: string | null) {
  const channels = await prisma.channel.findMany({
    orderBy: { channelNumber: 'asc' },
    include: userId
      ? {
          favorites: { where: { userId }, select: { id: true } },
          watchHistory: { where: { userId }, select: { progress: true, lastWatchedAt: true } },
        }
      : undefined,
  });

  const shaped: ChannelSummary[] = channels.map((c: any) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    channelNumber: c.channelNumber,
    isLive: c.isLive,
    colorFrom: c.colorFrom,
    colorTo: c.colorTo,
    hasStream: Boolean(c.streamUrl),
    favorite: userId ? c.favorites?.length > 0 : false,
    progress: userId ? c.watchHistory?.[0]?.progress ?? null : null,
    lastWatchedAt: userId ? c.watchHistory?.[0]?.lastWatchedAt?.toISOString() ?? null : null,
  }));

  return shaped;
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const channels = await getHomeData(user?.id ?? null);

  const continueWatching = channels.filter((c) => c.progress != null).sort((a, b) => (b.lastWatchedAt || '').localeCompare(a.lastWatchedAt || '')).slice(0, 8);
  const favorites = channels.filter((c) => c.favorite);
  const recent = channels.filter((c) => c.lastWatchedAt).sort((a, b) => (b.lastWatchedAt || '').localeCompare(a.lastWatchedAt || '')).slice(0, 10);
  const trending = channels.slice(0, 10); // swap for a real "views" metric once you track it
  const spotlightChannels = (favorites.length >= 3 ? favorites : channels).slice(0, 3);

  const categories = Array.from(new Set(channels.map((c) => c.category)));

  return (
    <div>
      <Spotlight channels={spotlightChannels} />

      <div className="flex gap-9 px-9 -mt-8 mb-14 flex-wrap relative z-[3]">
        <Stat value={channels.length} label="Channels Live" />
        <Stat value={favorites.length} label="Favorites Saved" />
        <Stat value={categories.length} label="Categories" />
        <Stat value={continueWatching.length} label="In Progress" />
      </div>

      {continueWatching.length > 0 && (
        <Rail eyebrow="01 — Pick Up" title="Continue Watching" sub={`${continueWatching.length} in progress`} channels={continueWatching} />
      )}
      <Rail eyebrow="02 — Saved" title="Favorite Channels" sub={`${favorites.length} saved`} channels={favorites.length ? favorites : channels.slice(0, 6)} emptyText="No favorites yet — tap the heart on any channel." />
      <Rail eyebrow="03 — History" title="Recently Opened" channels={recent} emptyText="Channels you open will show up here." />
      <Rail eyebrow="04 — Now Trending" title="Trending Channels" sub="Most watched this week" channels={trending} />

      <div className="px-9 mb-14">
        <div className="flex items-end justify-between mb-5 pb-3.5 border-b border-hair">
          <div><span className="block font-mono text-[10.5px] tracking-[.14em] text-bronze uppercase mb-1.5">05 — Browse</span><h2 className="text-[20px] font-extrabold tracking-tight">Categories</h2></div>
        </div>
        <div className="rail flex gap-4 overflow-x-auto -mx-9 px-9 pb-3">
          {categories.map((cat) => {
            const sample = channels.find((c) => c.category === cat)!;
            const count = channels.filter((c) => c.category === cat).length;
            return (
              <Link key={cat} href={`/live-tv?category=${encodeURIComponent(cat)}`} className="relative flex-none w-[210px] h-[118px] rounded-card overflow-hidden border border-hair flex flex-col justify-end p-4 hover:-translate-y-1 transition-transform">
                <div className="absolute inset-0" style={{ background: `linear-gradient(150deg, ${sample.colorFrom}, ${sample.colorTo})` }} />
                <span className="relative z-[2] font-mono text-[10px] opacity-80 mb-1">{count} CHANNELS</span>
                <span className="relative z-[2] font-extrabold text-[16px] tracking-tight">{cat}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="font-mono">
      <b className="block text-[20px] font-bold">{value}</b>
      <span className="text-[10.5px] text-text-faint uppercase tracking-wider">{label}</span>
    </div>
  );
}
