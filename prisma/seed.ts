import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CAT_COLORS: Record<string, [string, string]> = {
  Tamil: ['#C9A25D', '#8C5A3C'],
  News: ['#6FE3D6', '#35505A'],
  Sports: ['#3FA796', '#6FE3D6'],
  Entertainment: ['#8C5A7A', '#C9A25D'],
  Music: ['#B0503F', '#C9A25D'],
  Kids: ['#6FE3D6', '#E8C87A'],
  Movies: ['#4A4E7C', '#8C5A7A'],
  International: ['#35505A', '#6FE3D6'],
};

const NAMES: Record<string, string[]> = {
  Tamil: ['Sun Vision', 'Kollywood Now', 'Tamil Pulse', 'Nadu Beat', 'Vetri Live'],
  News: ['Global Wire', 'Frontline 24', 'Nation Desk', 'Truth Network', 'Capital Report'],
  Sports: ['Arena Live', 'GoalZone', 'Court Central', 'Pitch & Play', 'Velocity Sports'],
  Entertainment: ['Prime Buzz', 'StarStream', 'Velvet Screen', 'Marquee TV', 'Nightlife Now'],
  Music: ['Rhythm House', 'BeatWave', 'Studio 88', 'Melody Loop', 'Bassline'],
  Kids: ['ToonNest', 'Little Sprouts', 'Playhouse Live', 'Wonder Kids', 'Sunny Studio'],
  Movies: ['Cine Reel', 'Vault Cinema', 'Silver Screen', 'Backlot', 'Premiere Now'],
  International: ['World Feed', 'AtlasTV', 'Border Cross', 'Continental', 'Meridian'],
};

async function main() {
  console.log('Seeding…');

  // Demo admin + regular user (change the password after first login)
  const passwordHash = await bcrypt.hash('streamnest123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@streamnest.local' },
    update: {},
    create: { email: 'admin@streamnest.local', passwordHash, name: 'Admin', role: 'ADMIN' },
  });
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@streamnest.local' },
    update: {},
    create: { email: 'demo@streamnest.local', passwordHash, name: 'Demo User', role: 'USER' },
  });

  for (const user of [admin, demoUser]) {
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  for (const category of Object.keys(NAMES)) {
    const [colorFrom, colorTo] = CAT_COLORS[category];
    for (const name of NAMES[category]) {
      const existing = await prisma.channel.findFirst({ where: { name, category } });
      if (existing) continue;
      const channel = await prisma.channel.create({
        data: {
          name,
          category,
          colorFrom,
          colorTo,
          // Leave streamUrl null — add real, authorized URLs via /admin
          streamUrl: null,
        },
      });
      // seed a little watch history / favorites for the demo account
      if (Math.random() > 0.6) {
        await prisma.watchHistory.create({
          data: {
            userId: demoUser.id,
            channelId: channel.id,
            progress: Math.floor(Math.random() * 90) + 5,
          },
        });
      }
      if (Math.random() > 0.75) {
        await prisma.favorite.create({ data: { userId: demoUser.id, channelId: channel.id } });
      }
    }
  }

  console.log('Seed complete. Demo login: admin@streamnest.local / demo@streamnest.local — password: streamnest123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });