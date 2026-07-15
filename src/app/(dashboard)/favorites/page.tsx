import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import ChannelCard from '@/components/ChannelCard';
import type { ChannelSummary } from '@/types';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="px-9 py-20 text-center">
        <h1 className="text-2xl font-extrabold mb-3">Sign in to see your favorites</h1>
        <p className="text-text-faint mb-6">Favorites are saved to your account and sync across devices.</p>
        <Link href="/login" className="px-5 py-2.5 rounded-xl bg-white text-bg font-bold text-sm">Sign in</Link>
      </div>
    );
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { channel: { include: { watchHistory: { where: { userId: user.id } } } } },
    orderBy: { createdAt: 'desc' },
  });

  const shaped: ChannelSummary[] = favorites.map((f: any) => ({
    id: f.channel.id, name: f.channel.name, category: f.channel.category, channelNumber: f.channel.channelNumber,
    isLive: f.channel.isLive, colorFrom: f.channel.colorFrom, colorTo: f.channel.colorTo, hasStream: Boolean(f.channel.streamUrl),
    favorite: true, progress: f.channel.watchHistory?.[0]?.progress ?? null, lastWatchedAt: f.channel.watchHistory?.[0]?.lastWatchedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <div className="px-9 py-6 border-b border-hair">
        <span className="block font-mono text-[10.5px] tracking-[.14em] text-bronze uppercase mb-1.5">Index</span>
        <h1 className="text-[27px] font-extrabold tracking-tight">Favorites</h1>
        <div className="font-mono text-[11.5px] text-text-faint mt-1">{shaped.length} CHANNELS</div>
      </div>
      <div className="grid gap-4 px-9 py-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(216px, 1fr))' }}>
        {shaped.length === 0 ? (
          <p className="col-span-full text-text-faint py-16 text-center">No favorites yet — tap the heart on any channel to save it here.</p>
        ) : (
          shaped.map((c, i) => <ChannelCard key={c.id} channel={c} delay={i * 20} />)
        )}
      </div>
    </div>
  );
}
