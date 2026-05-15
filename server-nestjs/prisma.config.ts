import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts && ts-node prisma/seed-notification.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
