'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ChannelSummary } from '@/types';

export default function Spotlight({ channels }: { channels: ChannelSummary[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (channels.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % channels.length), 5200);
    return () => clearInterval(t);
  }, [channels.length]);

  if (!channels.length) return null;
  const active = channels[idx];
  const chNum = `CH.${String(active.channelNumber).padStart(2, '0')}`;

  return (
    <div className="px-9 mb-14">
      <div className="relative h-[64vh] min-h-[440px] max-h-[660px] rounded-card overflow-hidden border border-hair">
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ background: `radial-gradient(60% 70% at 25% 20%, ${active.colorFrom}77, transparent 60%), radial-gradient(50% 60% at 85% 90%, ${active.colorTo}66, transparent 55%), #0A0908` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/35 to-bg/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/55 to-transparent" />

        <div className="relative z-[2] h-full flex flex-col justify-end px-11 pb-10 max-w-[640px]">
          <div className="flex items-center gap-2.5 font-mono text-[12px] text-ice mb-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-live live-pulse" />
            {chNum} — {active.category.toUpperCase()} · LIVE NOW
          </div>
          <h1 className="text-[clamp(30px,4.4vw,48px)] font-extrabold tracking-tight leading-[1.04] mb-3">{active.name}</h1>
          <p className="text-[14.5px] text-text-dim max-w-md leading-relaxed mb-6">
            Currently streaming from your authorized {active.category} source. Jump back in, or explore what else is playing.
          </p>
          <div className="flex gap-2.5 flex-wrap">
            <Link href={`/player/${active.id}`} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-bronze to-ice text-bg font-bold text-[13px] flex items-center gap-2 hover:brightness-110 transition">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px]"><path d="M8 5v14l11-7z" /></svg>Watch Now
            </Link>
            <Link href="/live-tv" className="px-5 py-2.5 rounded-xl border border-hair bg-white/[.04] font-bold text-[13px]">Browse Live TV</Link>
          </div>
        </div>

        <div className="absolute z-[3] right-11 bottom-10 flex gap-2">
          {channels.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setIdx(i)}
              className="w-[26px] h-[2px] bg-white/25 relative overflow-hidden"
            >
              {i === idx && <span className="absolute inset-0 bg-bronze origin-left animate-[spotfill_5.2s_linear_forwards]" />}
            </button>
          ))}
        </div>
      </div>
      <style>{`@keyframes spotfill { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
    </div>
  );
}
