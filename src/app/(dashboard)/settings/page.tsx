'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Settings = {
  theme: string; accent: string; layout: string; startupPage: string; language: string; autoplayNext: boolean;
};

const ACCENTS: Record<string, [string, string]> = {
  bronze: ['#C9A25D', '#6FE3D6'], crimson: ['#E63946', '#C9A25D'], emerald: ['#3FA796', '#6FE3D6'], plum: ['#8C5A7A', '#C9A25D'],
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [toast, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setSignedIn(Boolean(d.user)));
    fetch('/api/settings').then((r) => (r.ok ? r.json() : null)).then((d) => d && setSettings(d.settings));
  }, []);

  function flash(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  }

  async function patch(partial: Partial<Settings>) {
    setSettings((s) => (s ? { ...s, ...partial } : s));
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (res.ok) flash('Preference saved');
  }

  if (signedIn === false) {
    return (
      <div className="px-9 py-20 text-center">
        <h1 className="text-2xl font-extrabold mb-3">Sign in to manage settings</h1>
        <p className="text-text-faint mb-6">Preferences sync to your account across devices.</p>
        <Link href="/login" className="px-5 py-2.5 rounded-xl bg-white text-bg font-bold text-sm">Sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="px-9 py-6 border-b border-hair">
        <span className="block font-mono text-[10.5px] tracking-[.14em] text-bronze uppercase mb-1.5">Configure</span>
        <h1 className="text-[27px] font-extrabold tracking-tight">Settings</h1>
      </div>

      <div className="px-9 py-6 max-w-[740px] space-y-4">
        {!settings ? (
          <p className="text-text-faint">Loading…</p>
        ) : (
          <>
            <Block title="Appearance" desc="Choose how StreamNest looks on this device.">
              <Row label="Dark mode" sub="Auto dark mode follows your system by default">
                <Switch on={settings.theme === 'dark'} onClick={() => patch({ theme: settings.theme === 'dark' ? 'light' : 'dark' })} />
              </Row>
              <Row label="Accent color" sub="Applied to badges, buttons and highlights">
                <div className="flex gap-2.5">
                  {Object.keys(ACCENTS).map((k) => (
                    <button
                      key={k}
                      onClick={() => patch({ accent: k })}
                      className={`w-[22px] h-[22px] rounded-full border-2 transition-transform ${settings.accent === k ? 'border-text scale-[1.15]' : 'border-transparent'}`}
                      style={{ background: `linear-gradient(135deg, ${ACCENTS[k][0]}, ${ACCENTS[k][1]})` }}
                    />
                  ))}
                </div>
              </Row>
              <Row label="Layout density" sub="Grid or list for browsing screens">
                <div className="flex bg-surface-2 border border-hair rounded-lg p-0.5">
                  {['grid', 'list'].map((l) => (
                    <button key={l} onClick={() => patch({ layout: l })} className={`px-3 py-1.5 rounded-md text-[11.5px] font-mono font-semibold ${settings.layout === l ? 'bg-white/10' : 'text-text-dim'}`}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </Row>
            </Block>

            <Block title="Playback" desc="Player preferences and defaults.">
              <Row label="Default startup page" sub="What opens when StreamNest launches">
                <select value={settings.startupPage} onChange={(e) => patch({ startupPage: e.target.value })} className="bg-surface-2 border border-hair rounded-lg px-3 py-2 text-[12.5px] font-mono font-semibold">
                  <option value="home">Home</option><option value="livetv">Live TV</option><option value="favorites">Favorites</option>
                </select>
              </Row>
              <Row label="Autoplay next in related" sub="Continue to a related channel automatically">
                <Switch on={settings.autoplayNext} onClick={() => patch({ autoplayNext: !settings.autoplayNext })} />
              </Row>
              <Row label="Language" sub="Interface language">
                <select value={settings.language} onChange={(e) => patch({ language: e.target.value })} className="bg-surface-2 border border-hair rounded-lg px-3 py-2 text-[12.5px] font-mono font-semibold">
                  <option>English</option><option>Tamil</option><option>Hindi</option><option>Spanish</option>
                </select>
              </Row>
            </Block>

            <div className="bg-surface border border-hair rounded-card p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold mb-1">Channel Management</h3>
                <p className="text-xs text-text-faint">Add live stream URLs and manage channels (admin only).</p>
              </div>
              <Link href="/admin" className="px-4 py-2 rounded-lg bg-white text-bg text-[12.5px] font-bold whitespace-nowrap">Open Admin</Link>
            </div>
          </>
        )}
      </div>

      {toast && <div className="fixed bottom-5 right-5 bg-surface-2 border border-hair rounded-xl px-4 py-3 text-[13px] font-semibold shadow-2xl">{toast}</div>}
    </div>
  );
}

function Block({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-hair rounded-card p-5">
      <h3 className="text-[14px] font-bold mb-1">{title}</h3>
      <p className="text-xs text-text-faint mb-4">{desc}</p>
      {children}
    </div>
  );
}
function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-t border-hair first:border-t-0 first:pt-0 gap-4">
      <div><div className="text-[13px] font-semibold">{label}</div>{sub && <div className="text-[11px] text-text-faint mt-0.5">{sub}</div>}</div>
      {children}
    </div>
  );
}
function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-[38px] h-[22px] rounded-full border relative transition-colors flex-shrink-0 ${on ? 'bg-bronze/20 border-bronze' : 'bg-surface-2 border-hair'}`}>
      <span className={`absolute top-[2px] w-[16px] h-[16px] rounded-full transition-all ${on ? 'left-[18px] bg-bronze' : 'left-[2px] bg-text-faint'}`} />
    </button>
  );
}
