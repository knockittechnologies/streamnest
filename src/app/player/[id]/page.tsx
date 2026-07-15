import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Player from '@/components/Player';
import Rail from '@/components/Rail';
import PlayerFavoriteButton from '@/components/PlayerFavoriteButton';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { ChannelSummary } from '@/types';

export const dynamic = 'force-dynamic';

export default async function PlayerPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const channel = await prisma.channel.findUnique({ where: { id: params.id } });
  if (!channel) notFound();

  let favorite = false;
  let progress: number | null = null;

  if (user) {
    // Log the open as watch history (keeps "Continue Watching" / "Recently Opened" fresh)
    const existing = await prisma.watchHistory.findUnique({
      where: { userId_channelId: { userId: user.id, channelId: channel.id } },
    });
    await prisma.watchHistory.upsert({
      where: { userId_channelId: { userId: user.id, channelId: channel.id } },
      update: { lastWatchedAt: new Date() },
      create: { userId: user.id, channelId: channel.id, progress: 0 },
    });
    progress = existing?.progress ?? null;

    const fav = await prisma.favorite.findUnique({ where: { userId_channelId: { userId: user.id, channelId: channel.id } } });
    favorite = Boolean(fav);
  }

  const related = await prisma.channel.findMany({
    where: { category: channel.category, id: { not: channel.id } },
    take: 6,
    include: user ? { favorites: { where: { userId: user.id } }, watchHistory: { where: { userId: user.id } } } : undefined,
  });
  const relatedShaped: ChannelSummary[] = related.map((c: any) => ({
    id: c.id, name: c.name, category: c.category, channelNumber: c.channelNumber, isLive: c.isLive,
    colorFrom: c.colorFrom, colorTo: c.colorTo, hasStream: Boolean(c.streamUrl),
    favorite: user ? c.favorites?.length > 0 : false,
    progress: user ? c.watchHistory?.[0]?.progress ?? null : null,
    lastWatchedAt: user ? c.watchHistory?.[0]?.lastWatchedAt?.toISOString() ?? null : null,
  }));

  const chNum = `CH.${String(channel.channelNumber).padStart(2, '0')}`;
  const streamUrl = user ? channel.streamUrl : null;

  return (
    <>
      <Header />
      <div className="px-9 py-6 max-w-[1400px]">
        <Player streamUrl={streamUrl} channelName={channel.name} posterFrom={channel.colorFrom} posterTo={channel.colorTo} />

        {!user && (
          <p className="mt-3 text-xs text-text-faint">
            <Link href="/login" className="text-bronze underline underline-offset-2">Sign in</Link> to load this channel&rsquo;s configured stream and save your progress.
          </p>
        )}

        <div className="flex items-start justify-between gap-4 flex-wrap mt-5">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight mb-1.5">{channel.name}</h1>
            <div className="flex items-center gap-2 font-mono text-[11.5px] text-text-faint">
              <span>{chNum}</span><span>·</span><span>{channel.category.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <PlayerFavoriteButton channelId={channel.id} initialFavorite={favorite} />
            <Link href="/live-tv" className="px-4 py-2.5 rounded-xl border border-hair bg-white/[.04] font-bold text-[13px]">Back to Live TV</Link>
          </div>
        </div>

        {progress != null && (
          <div className="bg-surface border border-hair rounded-card p-5 mt-6">
            <h3 className="text-sm font-bold mb-1">Continue Watching</h3>
            <p className="text-xs text-text-faint mb-3">You were {progress}% through this session.</p>
            <div className="h-[2px] bg-hair overflow-hidden"><div className="h-full bg-bronze" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
      </div>

      <div className="mt-10">
        <Rail eyebrow="Related" title={`More in ${channel.category}`} channels={relatedShaped} />
      </div>
    </>
  );
}
