import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import ChannelCard from '@/components/ChannelCard';
import { CATEGORIES } from '@/types';
import type { ChannelSummary } from '@/types';

export const dynamic = 'force-dynamic';

export default async function LiveTvPage({ searchParams }: { searchParams: { category?: string; q?: string } }) {
  const user = await getCurrentUser();
  const category = searchParams.category;
  const q = searchParams.q;

  const channels = await prisma.channel.findMany({
    where: {
      ...(category && category !== 'all' ? { category } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: { channelNumber: 'asc' },
    include: user
      ? {
          favorites: { where: { userId: user.id }, select: { id: true } },
          watchHistory: { where: { userId: user.id }, select: { progress: true, lastWatchedAt: true } },
        }
      : undefined,
  });

  const shaped: ChannelSummary[] = channels.map((c: any) => ({
    id: c.id, name: c.name, category: c.category, channelNumber: c.channelNumber, isLive: c.isLive,
    colorFrom: c.colorFrom, colorTo: c.colorTo, hasStream: Boolean(c.streamUrl),
    favorite: user ? c.favorites?.length > 0 : false,
    progress: user ? c.watchHistory?.[0]?.progress ?? null : null,
    lastWatchedAt: user ? c.watchHistory?.[0]?.lastWatchedAt?.toISOString() ?? null : null,
  }));

  const activeCat = category || 'all';

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap px-9 py-6 border-b border-hair">
        <div>
          <span className="block font-mono text-[10.5px] tracking-[.14em] text-bronze uppercase mb-1.5">Index</span>
          <h1 className="text-[27px] font-extrabold tracking-tight">Live TV</h1>
          <div className="font-mono text-[11.5px] text-text-faint mt-1">{shaped.length} CHANNELS{q ? ` MATCHING "${q.toUpperCase()}"` : ''}</div>
        </div>
      </div>

      <div className="px-9 pt-4">
        <div className="rail flex gap-2 overflow-x-auto pb-1">
          {['all', ...CATEGORIES].map((c) => (
            <Link
              key={c}
              href={c === 'all' ? '/live-tv' : `/live-tv?category=${encodeURIComponent(c)}`}
              className={`flex-none px-4 py-1.5 rounded-lg border text-[12px] font-semibold font-mono tracking-wide ${activeCat === c ? 'bg-text text-bg border-text' : 'border-hair text-text-dim hover:text-text'}`}
            >
              {c === 'all' ? 'ALL' : c.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 px-9 py-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(216px, 1fr))' }}>
        {shaped.length === 0 ? (
          <p className="col-span-full text-text-faint py-16 text-center">No channels match. Try a different category or search term.</p>
        ) : (
          shaped.map((c, i) => <ChannelCard key={c.id} channel={c} delay={i * 20} />)
        )}
      </div>
    </div>
  );
}
