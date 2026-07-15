import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  return NextResponse.json({ settings });
}

const patchSchema = z.object({
  theme: z.enum(['dark', 'light']).optional(),
  accent: z.enum(['bronze', 'crimson', 'emerald', 'plum']).optional(),
  layout: z.enum(['grid', 'list']).optional(),
  startupPage: z.enum(['home', 'livetv', 'favorites']).optional(),
  language: z.string().optional(),
  autoplayNext: z.boolean().optional(),
});

// PATCH /api/settings — partial update, syncs instantly across devices on next load
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: { userId: user.id, ...parsed.data },
  });
  return NextResponse.json({ settings });
}
