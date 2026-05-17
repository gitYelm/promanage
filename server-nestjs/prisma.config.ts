import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed:
      'ts-node prisma/seed.ts && ts-node prisma/seed-project-management-menu.ts && ts-node prisma/seed-bug-workflow-permissions.ts && ts-node prisma/seed-defect-menu-names.ts && ts-node prisma/seed-dashboard-menu-names.ts && ts-node prisma/seed-role-user-cleanup.ts && ts-node prisma/seed-notification.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
