import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import ChannelCard from '@/components/ChannelCard';
import type { ChannelSummary } from '@/types';

export const dynamic = 'force-dynamic';

export default async function RecentPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="px-9 py-20 text-center">
        <h1 className="text-2xl font-extrabold mb-3">Sign in to see your history</h1>
        <p className="text-text-faint mb-6">Your watch history syncs to your account.</p>
        <Link href="/login" className="px-5 py-2.5 rounded-xl bg-white text-bg font-bold text-sm">Sign in</Link>
      </div>
    );
  }

  const history = await prisma.watchHistory.findMany({
    where: { userId: user.id },
    include: { channel: { include: { favorites: { where: { userId: user.id } } } } },
    orderBy: { lastWatchedAt: 'desc' },
    take: 30,
  });

  const shaped: ChannelSummary[] = history.map((h: any) => ({
    id: h.channel.id, name: h.channel.name, category: h.channel.category, channelNumber: h.channel.channelNumber,
    isLive: h.channel.isLive, colorFrom: h.channel.colorFrom, colorTo: h.channel.colorTo, hasStream: Boolean(h.channel.streamUrl),
    favorite: h.channel.favorites?.length > 0, progress: h.progress, lastWatchedAt: h.lastWatchedAt.toISOString(),
  }));

  return (
    <div>
      <div className="px-9 py-6 border-b border-hair">
        <span className="block font-mono text-[10.5px] tracking-[.14em] text-bronze uppercase mb-1.5">Index</span>
        <h1 className="text-[27px] font-extrabold tracking-tight">Recently Viewed</h1>
        <div className="font-mono text-[11.5px] text-text-faint mt-1">{shaped.length} CHANNELS</div>
      </div>
      <div className="grid gap-4 px-9 py-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(216px, 1fr))' }}>
        {shaped.length === 0 ? (
          <p className="col-span-full text-text-faint py-16 text-center">Channels you open will show up here.</p>
        ) : (
          shaped.map((c, i) => <ChannelCard key={c.id} channel={c} delay={i * 20} />)
        )}
      </div>
    </div>
  );
}
