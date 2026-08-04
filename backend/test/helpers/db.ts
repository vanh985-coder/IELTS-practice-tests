import { PrismaClient } from '../../generated/prisma/client';

export async function truncateAll(prisma: PrismaClient) {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;

  const names = tables
    .map((t) => t.tablename)
    .filter((n) => n !== '_prisma_migrations')
    .map((n) => `"public"."${n}"`)
    .join(', ');

  if (names) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`,
    );
  }
}