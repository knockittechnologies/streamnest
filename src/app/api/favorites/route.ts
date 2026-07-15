import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/favorites — the current user's favorited channels
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { channel: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ channels: favorites.map((f: any) => f.channel) });
}

const toggleSchema = z.object({ channelId: z.string().min(1) });

// POST /api/favorites — toggles favorite status for a channel, returns new state
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const parsed = toggleSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'channelId required.' }, { status: 400 });
  const { channelId } = parsed.data;

  const existing = await prisma.favorite.findUnique({
    where: { userId_channelId: { userId: user.id, channelId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorite: false });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, channelId } });
    return NextResponse.json({ favorite: true });
  }
}
