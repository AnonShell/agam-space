import type { Config } from 'drizzle-kit';

import { configLoader } from './src/config/config.loader';

// Load configuration to get PostgreSQL database settings
const config = configLoader.loadConfig({ validateOnly: true });
const dbConfig = config.database;

// Build PostgreSQL connection URL for Drizzle Kit
const connectionUrl = `postgresql://${dbConfig.username}:${encodeURIComponent(dbConfig.password)}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

export default {
  schema: './src/database/schema/*',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionUrl,
  },
  verbose: false,
  strict: true,
} satisfies Config;
