'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  streamUrl: string | null;
  channelName: string;
  posterFrom: string;
  posterTo: string;
};

/**
 * Renders whatever kind of authorized source the admin configured:
 *  - .m3u8            -> hls.js (or native HLS on Safari)
 *  - .mp4 / .webm      -> plain <video>
 *  - anything else      -> <iframe> (covers embed-only providers)
 *  - null               -> empty state prompting configuration
 */
export default function Player({ streamUrl, channelName, posterFrom, posterTo }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'video' | 'iframe' | 'none'>('none');

  useEffect(() => {
    if (!streamUrl) { setMode('none'); return; }

    const isPlayableFile = /\.(m3u8|mp4|webm)(\?.*)?$/i.test(streamUrl);
    setMode(isPlayableFile ? 'video' : 'iframe');

    if (isPlayableFile && videoRef.current) {
      const video = videoRef.current;

      if (streamUrl.endsWith('.m3u8')) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari / iOS: native HLS support, no library needed
          video.src = streamUrl;
        } else {
          // Chrome / Firefox / Edge: use hls.js, loaded dynamically so it
          // never ships in the bundle for users who never open a player
          let hls: any;
          import('hls.js').then(({ default: Hls }) => {
            if (Hls.isSupported()) {
              hls = new Hls();
              hls.loadSource(streamUrl);
              hls.attachMedia(video);
            }
          });
          return () => hls?.destroy();
        }
      } else {
        video.src = streamUrl;
      }
    }
  }, [streamUrl]);

  if (mode === 'none') {
    return (
      <div
        className="relative w-full aspect-video rounded-card overflow-hidden border border-hair flex flex-col items-center justify-center gap-4 text-center px-6"
        style={{ background: `radial-gradient(120% 140% at 20% 10%, ${posterFrom}33, transparent 60%), radial-gradient(100% 120% at 90% 100%, ${posterTo}33, transparent 55%), #0A0908` }}
      >
        <div className="w-14 h-14 rounded-2xl border border-hair flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#C9A25D" strokeWidth="1.8" className="w-6 h-6">
            <rect x="2" y="6" width="20" height="13" rx="2" /><path d="M8 21h8M12 19v2" />
          </svg>
        </div>
        <h3 className="text-base font-bold">{channelName} — no source configured</h3>
        <p className="text-sm text-text-dim max-w-sm">
          This channel doesn&rsquo;t have an authorized stream URL yet. Add one from{' '}
          <a href="/admin" className="text-bronze underline underline-offset-2">Admin → Channel Management</a>.
        </p>
      </div>
    );
  }

  if (mode === 'iframe') {
    return (
      <div className="relative w-full aspect-video rounded-card overflow-hidden border border-hair bg-black">
        <iframe
          src={streamUrl!}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-card overflow-hidden border border-hair bg-black">
      <video ref={videoRef} controls autoPlay playsInline className="w-full h-full object-contain bg-black" />
    </div>
  );
}
