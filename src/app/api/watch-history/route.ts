import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/watch-history — most recently watched channels, for "Continue Watching" / "Recently Opened"
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const history = await prisma.watchHistory.findMany({
    where: { userId: user.id },
    include: { channel: true },
    orderBy: { lastWatchedAt: 'desc' },
    take: 20,
  });
  return NextResponse.json({
    history: history.map((h: any) => ({ ...h.channel, progress: h.progress, lastWatchedAt: h.lastWatchedAt })),
  });
}

const upsertSchema = z.object({
  channelId: z.string().min(1),
  progress: z.number().min(0).max(100).optional(),
});

// POST /api/watch-history — call this when a channel is opened, and periodically while playing
// to keep "Continue Watching" progress in sync (e.g. every 15-30s from the player).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const parsed = upsertSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'channelId required.' }, { status: 400 });
  const { channelId, progress } = parsed.data;

  const entry = await prisma.watchHistory.upsert({
    where: { userId_channelId: { userId: user.id, channelId } },
    update: { progress: progress ?? undefined, lastWatchedAt: new Date() },
    create: { userId: user.id, channelId, progress: progress ?? 0 },
  });
  return NextResponse.json({ entry });
}
