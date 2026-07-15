'use client';

import { useState } from 'react';

export default function PlayerFavoriteButton({ channelId, initialFavorite }: { channelId: string; initialFavorite: boolean }) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const next = !favorite;
    setFavorite(next);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFavorite(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button onClick={toggle} className="px-4 py-2.5 rounded-xl border border-hair bg-white/[.04] font-bold text-[13px] flex items-center gap-2">
      <svg viewBox="0 0 24 24" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {favorite ? 'Favorited' : 'Add to Favorites'}
    </button>
  );
}
