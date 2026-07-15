'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-bg">
      <div className="w-full max-w-[380px]">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-[18.5px] tracking-tight justify-center mb-8">
          <span className="w-[26px] h-[26px] border border-hair rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-[13px] h-[13px] text-bronze"><path d="M5 4L19 12L5 20V4Z" fill="currentColor" /></svg>
          </span>
          Stream<span className="text-bronze">Nest</span>
        </Link>

        <div className="bg-surface border border-hair rounded-card p-6">
          <div className="flex bg-surface-2 border border-hair rounded-lg p-0.5 mb-5">
            <button onClick={() => setMode('login')} className={`flex-1 py-2 rounded-md text-[13px] font-semibold ${mode === 'login' ? 'bg-white/10' : 'text-text-faint'}`}>Sign In</button>
            <button onClick={() => setMode('register')} className={`flex-1 py-2 rounded-md text-[13px] font-semibold ${mode === 'register' ? 'bg-white/10' : 'text-text-faint'}`}>Create Account</button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="w-full bg-surface-2 border border-hair rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-bronze"
              />
            )}
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              className="w-full bg-surface-2 border border-hair rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-bronze"
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              className="w-full bg-surface-2 border border-hair rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-bronze"
            />
            {error && <p className="text-[12.5px] text-live">{error}</p>}
            <button disabled={loading} type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-bronze to-ice text-bg font-bold text-[13px] disabled:opacity-60">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11.5px] text-text-faint mt-5 font-mono">
          DEMO: [email protected] / [email protected] · PASSWORD: streamnest123
        </p>
      </div>
    </div>
  );
}
