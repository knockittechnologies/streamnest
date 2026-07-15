import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/channels/:id — full detail, including the actual playable streamUrl
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const channel = await prisma.channel.findUnique({
    where: { id: params.id },
    include: user
      ? {
          favorites: { where: { userId: user.id }, select: { id: true } },
          watchHistory: { where: { userId: user.id }, select: { progress: true } },
        }
      : undefined,
  });
  if (!channel) return NextResponse.json({ error: 'Channel not found.' }, { status: 404 });

  // Only authenticated users receive the actual stream URL
  const streamUrl = user ? channel.streamUrl : null;

  return NextResponse.json({
    channel: {
      ...channel,
      streamUrl,
      favorite: user ? (channel as any).favorites?.length > 0 : false,
      progress: user ? (channel as any).watchHistory?.[0]?.progress ?? null : null,
    },
  });
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  streamUrl: z.string().url().nullable().optional(),
  colorFrom: z.string().optional(),
  colorTo: z.string().optional(),
  isLive: z.boolean().optional(),
});

// PATCH /api/channels/:id — admin only. This is the "add live URL" endpoint:
// { "streamUrl": "https://your-authorized-source.example/stream.m3u8" }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const channel = await prisma.channel.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ channel });
}

// DELETE /api/channels/:id — admin only
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  await prisma.channel.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
