import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/channels?category=Sports&favoritesOnly=1&q=arena
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q');
  const favoritesOnly = searchParams.get('favoritesOnly') === '1';

  const channels = await prisma.channel.findMany({
    where: {
      ...(category && category !== 'all' ? { category } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      ...(favoritesOnly && user
        ? { favorites: { some: { userId: user.id } } }
        : {}),
    },
    orderBy: { channelNumber: 'asc' },
    include: user
      ? {
          favorites: { where: { userId: user.id }, select: { id: true } },
          watchHistory: { where: { userId: user.id }, select: { progress: true, lastWatchedAt: true } },
        }
      : undefined,
  });

  const shaped = channels.map((c: any) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    channelNumber: c.channelNumber,
    isLive: c.isLive,
    colorFrom: c.colorFrom,
    colorTo: c.colorTo,
    hasStream: Boolean(c.streamUrl),
    favorite: user ? c.favorites?.length > 0 : false,
    progress: user ? c.watchHistory?.[0]?.progress ?? null : null,
    lastWatchedAt: user ? c.watchHistory?.[0]?.lastWatchedAt ?? null : null,
  }));

  return NextResponse.json({ channels: shaped });
}

const createSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  streamUrl: z.string().url().optional().nullable(),
  colorFrom: z.string().optional(),
  colorTo: z.string().optional(),
});

// POST /api/channels — admin only, creates a channel
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const channel = await prisma.channel.create({ data: parsed.data });
  return NextResponse.json({ channel });
}
