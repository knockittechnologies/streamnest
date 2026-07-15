'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { SessionUser } from '@/types';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/live-tv', label: 'Live TV' },
  { href: '/categories', label: 'Categories' },
  { href: '/favorites', label: 'Favorites' },
  { href: '/recent', label: 'Recently Viewed' },
  { href: '/settings', label: 'Settings' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setUser(d.user));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/live-tv?q=${encodeURIComponent(query.trim())}`);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 flex items-center gap-6 px-9 py-4 backdrop-blur-xl bg-gradient-to-b from-bg/95 via-bg/80 to-transparent border-b border-transparent">
      <Link href="/" className="flex items-center gap-2.5 font-extrabold text-[18.5px] tracking-tight flex-shrink-0">
        <span className="w-[26px] h-[26px] border border-hair rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-[13px] h-[13px] text-bronze"><path d="M5 4L19 12L5 20V4Z" fill="currentColor" /></svg>
        </span>
        Stream<span className="text-bronze">Nest</span>
      </Link>

      <nav className="hidden lg:flex items-center gap-0.5 flex-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors ${pathname === item.href ? 'text-text' : 'text-text-faint hover:text-text'}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <form onSubmit={handleSearch} className="relative flex-1 lg:flex-none lg:w-[300px]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search channels, categories…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-hair bg-white/[.045] text-[13px] focus:border-bronze focus:bg-surface-2 outline-none transition-colors"
        />
      </form>

      <div className="flex items-center gap-2 flex-shrink-0">
        {user ? (
          <button onClick={handleLogout} title={`Sign out (${user.email})`} className="w-8 h-8 rounded-lg border border-hair bg-white/[.045] flex items-center justify-center font-mono text-[12px] text-bronze hover:border-bronze transition-colors">
            {user.name.slice(0, 2).toUpperCase()}
          </button>
        ) : (
          <Link href="/login" className="px-4 py-2 rounded-lg bg-white text-bg text-[13px] font-bold">Sign in</Link>
        )}
      </div>
    </header>
  );
}
