'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/types';

type Channel = {
  id: string; name: string; category: string; channelNumber: number; streamUrl: string | null; isLive: boolean;
};

export default function AdminPage() {
  const [me, setMe] = useState<{ role: string } | null | undefined>(undefined);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [urlDraft, setUrlDraft] = useState('');
  const [newChannel, setNewChannel] = useState({ name: '', category: CATEGORIES[0] as string, streamUrl: '' });
  const [toast, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setMe(d.user));
    loadChannels();
  }, []);

  async function loadChannels() {
    const res = await fetch('/api/channels');
    const data = await res.json();
    // /api/channels doesn't expose streamUrl for the list view (by design) —
    // admins fetch detail per-channel when editing, so pull details in bulk here.
    const detailed = await Promise.all(
      data.channels.map((c: any) => fetch(`/api/channels/${c.id}`).then((r) => r.json()).then((d) => d.channel))
    );
    setChannels(detailed);
    if (detailed[0]) { setSelectedId(detailed[0].id); setUrlDraft(detailed[0].streamUrl || ''); }
  }

  function flash(msg: string) { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2600); }

  function selectChannel(id: string) {
    setSelectedId(id);
    setUrlDraft(channels.find((c) => c.id === id)?.streamUrl || '');
  }

  async function saveStreamUrl() {
    const res = await fetch(`/api/channels/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamUrl: urlDraft.trim() || null }),
    });
    if (res.ok) { flash('Stream URL saved'); loadChannels(); }
    else flash((await res.json()).error || 'Failed to save');
  }

  async function deleteChannel(id: string) {
    if (!confirm('Remove this channel? This cannot be undone.')) return;
    const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
    if (res.ok) { flash('Channel removed'); loadChannels(); }
  }

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!newChannel.name.trim()) return;
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newChannel.name.trim(),
        category: newChannel.category,
        streamUrl: newChannel.streamUrl.trim() || undefined,
      }),
    });
    if (res.ok) {
      flash('Channel added');
      setNewChannel({ name: '', category: CATEGORIES[0], streamUrl: '' });
      loadChannels();
    } else {
      flash((await res.json()).error || 'Failed to add channel');
    }
  }

  if (me === undefined) return <div className="px-9 py-20 text-text-faint">Loading…</div>;
  if (!me) {
    return (
      <div className="px-9 py-20 text-center">
        <h1 className="text-2xl font-extrabold mb-3">Sign in required</h1>
        <Link href="/login" className="px-5 py-2.5 rounded-xl bg-white text-bg font-bold text-sm">Sign in</Link>
      </div>
    );
  }
  if (me.role !== 'ADMIN') {
    return <div className="px-9 py-20 text-center text-text-faint">Admin access required for this account.</div>;
  }

  return (
    <div className="px-9 py-6 max-w-[860px] space-y-5">
      <div>
        <span className="block font-mono text-[10.5px] tracking-[.14em] text-bronze uppercase mb-1.5">Configure</span>
        <h1 className="text-[27px] font-extrabold tracking-tight">Channel Management</h1>
        <p className="text-text-faint text-sm mt-1">Add authorized stream sources for your own channels. Nothing here is bundled — you supply the URLs.</p>
      </div>

      {/* --- Add / update stream URL for an existing channel --- */}
      <div className="bg-surface border border-hair rounded-card p-5">
        <h3 className="text-sm font-bold mb-4">Set Live Stream URL</h3>
        <div className="space-y-3">
          <select value={selectedId} onChange={(e) => selectChannel(e.target.value)} className="w-full bg-surface-2 border border-hair rounded-lg px-3 py-2.5 text-[13px] font-mono">
            {channels.map((c) => <option key={c.id} value={c.id}>CH.{String(c.channelNumber).padStart(2, '0')} — {c.name}</option>)}
          </select>
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://your-authorized-source.example/stream.m3u8"
            className="w-full bg-surface-2 border border-hair rounded-lg px-3 py-2.5 text-[12.5px] font-mono"
          />
          <p className="text-[11px] text-text-faint">Accepts an <code>.m3u8</code> / <code>.mp4</code> direct link (played inline), or any embed URL from an authorized provider (rendered in an iframe).</p>
          <button onClick={saveStreamUrl} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-bronze to-ice text-bg font-bold text-[13px]">Save Stream URL</button>
        </div>
      </div>

      {/* --- Add a brand new channel --- */}
      <form onSubmit={createChannel} className="bg-surface border border-hair rounded-card p-5 space-y-3">
        <h3 className="text-sm font-bold">Add a New Channel</h3>
        <input
          value={newChannel.name}
          onChange={(e) => setNewChannel((s) => ({ ...s, name: e.target.value }))}
          placeholder="Channel name"
          className="w-full bg-surface-2 border border-hair rounded-lg px-3 py-2.5 text-[13px]"
        />
        <select value={newChannel.category} onChange={(e) => setNewChannel((s) => ({ ...s, category: e.target.value }))} className="w-full bg-surface-2 border border-hair rounded-lg px-3 py-2.5 text-[13px] font-mono">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input
          value={newChannel.streamUrl}
          onChange={(e) => setNewChannel((s) => ({ ...s, streamUrl: e.target.value }))}
          placeholder="Stream URL (optional, can add later)"
          className="w-full bg-surface-2 border border-hair rounded-lg px-3 py-2.5 text-[12.5px] font-mono"
        />
        <button type="submit" className="px-5 py-2.5 rounded-xl border border-hair bg-white/[.04] font-bold text-[13px]">Add Channel</button>
      </form>

      {/* --- All channels list --- */}
      <div className="bg-surface border border-hair rounded-card overflow-hidden">
        <div className="p-5 pb-0"><h3 className="text-sm font-bold mb-4">All Channels ({channels.length})</h3></div>
        <div className="divide-y divide-hair max-h-[420px] overflow-y-auto">
          {channels.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-[13px] font-semibold">CH.{String(c.channelNumber).padStart(2, '0')} — {c.name}</div>
                <div className="text-[11px] font-mono text-text-faint mt-0.5">
                  {c.category.toUpperCase()} · {c.streamUrl ? <span className="text-ice">SOURCE CONFIGURED</span> : <span className="text-text-faint">NO SOURCE</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => selectChannel(c.id)} className="px-3 py-1.5 rounded-lg border border-hair text-[11.5px] font-semibold">Edit</button>
                <button onClick={() => deleteChannel(c.id)} className="px-3 py-1.5 rounded-lg border border-hair text-[11.5px] font-semibold text-live">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && <div className="fixed bottom-5 right-5 bg-surface-2 border border-hair rounded-xl px-4 py-3 text-[13px] font-semibold shadow-2xl">{toast}</div>}
    </div>
  );
}
