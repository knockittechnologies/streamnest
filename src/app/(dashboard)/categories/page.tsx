import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CATEGORIES } from '@/types';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const channels = await prisma.channel.findMany({ select: { category: true, colorFrom: true, colorTo: true } });

  return (
    <div>
      <div className="px-9 py-6 border-b border-hair">
        <span className="block font-mono text-[10.5px] tracking-[.14em] text-bronze uppercase mb-1.5">Index</span>
        <h1 className="text-[27px] font-extrabold tracking-tight">Categories</h1>
        <div className="font-mono text-[11.5px] text-text-faint mt-1">{CATEGORIES.length} CATEGORIES</div>
      </div>
      <div className="grid gap-4 px-9 py-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
        {CATEGORIES.map((cat) => {
          const sample = channels.find((c: { category: string }) => c.category === cat);
          const count = channels.filter((c: { category: string }) => c.category === cat).length;
          return (
            <Link
              key={cat}
              href={`/live-tv?category=${encodeURIComponent(cat)}`}
              className="relative h-[150px] rounded-card overflow-hidden border border-hair flex flex-col justify-end p-4 hover:-translate-y-1 transition-transform"
            >
              <div className="absolute inset-0" style={{ background: `linear-gradient(150deg, ${sample?.colorFrom ?? '#C9A25D'}, ${sample?.colorTo ?? '#6FE3D6'})` }} />
              <span className="relative z-[2] font-mono text-[10px] opacity-80 mb-1">{count} CHANNELS</span>
              <span className="relative z-[2] font-extrabold text-[18px] tracking-tight">{cat}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
