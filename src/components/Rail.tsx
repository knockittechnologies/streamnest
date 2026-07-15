import ChannelCard from './ChannelCard';
import type { ChannelSummary } from '@/types';

export default function Rail({
  eyebrow, title, sub, channels, emptyText,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  channels: ChannelSummary[];
  emptyText?: string;
}) {
  return (
    <div className="px-9 mb-14">
      <div className="flex items-end justify-between mb-5 pb-3.5 border-b border-hair">
        <div>
          {eyebrow && <span className="block font-mono text-[10.5px] tracking-[.14em] text-bronze uppercase mb-1.5">{eyebrow}</span>}
          <h2 className="text-[20px] font-extrabold tracking-tight">{title}</h2>
        </div>
        {sub && <span className="font-mono text-[12px] text-text-faint">{sub}</span>}
      </div>
      {channels.length === 0 ? (
        <p className="text-sm text-text-faint py-6">{emptyText ?? 'Nothing here yet.'}</p>
      ) : (
        <div className="rail flex gap-4 overflow-x-auto -mx-9 px-9 pb-3">
          {channels.map((c, i) => <ChannelCard key={c.id} channel={c} delay={i * 40} />)}
        </div>
      )}
    </div>
  );
}
