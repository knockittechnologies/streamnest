'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ChannelSummary } from '@/types';

export default function ChannelCard({ channel, delay = 0 }: { channel: ChannelSummary; delay?: number }) {
  const [favorite, setFavorite] = useState(channel.favorite);
  const [pending, setPending] = useState(false);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const next = !favorite;
    setFavorite(next); // optimistic
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channel.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFavorite(!next); // revert on failure
    } finally {
      setPending(false);
    }
  }

  const chNum = `CH.${String(channel.channelNumber).padStart(2, '0')}`;

  return (
    <Link
      href={`/player/${channel.id}`}
      className="group card-in relative flex-none w-[232px] rounded-card overflow-hidden bg-surface border border-hair transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className="relative h-[130px] w-full overflow-hidden bg-surface-2">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(160deg, ${channel.colorFrom}, ${channel.colorTo})` }}
        />
        <span className="absolute top-[9px] left-[9px] font-mono text-[10px] tracking-wide text-white/85 bg-black/45 backdrop-blur px-[7px] py-[3px] rounded">
          {chNum}
        </span>
        {channel.isLive && (
          <span className="absolute top-[9px] right-[9px] flex items-center gap-[5px] font-mono text-[9.5px] font-semibold tracking-wide text-white bg-black/50 backdrop-blur px-[7px] py-[3px] rounded">
            <span className="w-[5px] h-[5px] rounded-full bg-live live-pulse" /> LIVE
          </span>
        )}
        <button
          onClick={toggleFavorite}
          aria-label="Toggle favorite"
          className={`absolute bottom-[9px] right-[9px] w-[26px] h-[26px] rounded-lg bg-black/50 backdrop-blur flex items-center justify-center transition-opacity ${favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <svg viewBox="0 0 24 24" fill={favorite ? '#C9A25D' : 'none'} stroke={favorite ? '#C9A25D' : 'white'} strokeWidth="2" className="w-[13px] h-[13px]">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>
      </div>
      <div className="px-[14px] pt-[13px] pb-[15px]">
        <div className="text-[13.5px] font-bold truncate mb-1">{channel.name}</div>
        <div className="flex items-center justify-between font-mono text-[10.5px] text-text-faint">
          <span>{channel.category}</span>
        </div>
        {channel.lastWatchedAt && (
          <div className="mt-2 font-mono text-[10px] text-text-faint">
            {new Date(channel.lastWatchedAt).toLocaleString()}
          </div>
        )}
        {channel.progress != null && (
          <div className="h-[2px] bg-hair mt-2 overflow-hidden">
            <div className="h-full bg-bronze" style={{ width: `${channel.progress}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}
