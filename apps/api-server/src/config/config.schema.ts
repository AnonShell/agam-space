import { z } from 'zod';

const portSchema = z.coerce.number().int().min(1).max(65_535);

// Server configuration - only what users should configure
export const serverConfigSchema = z.object({
  port: portSchema.default(3331),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('production'),
  apiPrefix: z.string().default('api/v1'),
});

// CORS configuration
export const corsConfigSchema = z.object({
  origin: z.string().default('*'),
  credentials: z.boolean().default(true),
});

// Documentation configuration
export const docsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  path: z.string().default('docs'),
});

// Database configuration - PostgreSQL only
export const databaseConfigSchema = z.object({
  host: z.string(),
  port: portSchema.default(5432),
  username: z.string(),
  password: z.string(),
  database: z.string().default('agam_space'),
  ssl: z.boolean().default(false),
  maxConnections: z.number().default(100),
  connectionTimeout: z.number().default(30_000),
});

// Directory configuration - paths resolved in loader
export const directoryConfigSchema = z.object({
  dataDir: z.string(), // Required after validation (either from env or /app/data default)
  filesDir: z.string().optional(), // If not set, becomes ${dataDir}/files
  configDir: z.string().optional(), // If not set, becomes ${dataDir}/config
  logDir: z.string().optional(), // If not set, becomes ${dataDir}/logs
  cacheDir: z.string().optional(), // If not set, becomes ${dataDir}/cache
});

// file configuration
export const fileConfigSchema = z.object({
  maxFileSize: z.coerce.number().int().min(1).max(1_000_000_000).default(1_000_000_000), // 1GB default
  chunkSize: z.coerce.number().int().min(1).max(32 * 1024 * 1024).default(8 * 1024 * 1024), // 8MB default chunk size
  uploadConcurrency: z.coerce.number().int().min(1).max(10).default(2), // Max concurrent uploads
  // maxFileMetadataSize: z.coerce.number().int().min(1).max(10_000).default(1000), // Max file metadata size in bytes

  trashCleanupIntervalDays: z.coerce.number().int().min(1).max(30).default(7),
});

// Security configuration
export const securityConfigSchema = z.object({
  sessionTimeout: z.string().default('7d'), // Session timeout (e.g., '7d', '24h', '30m')
  sessionDurationDays: z.coerce.number().int().min(1).max(365).default(30), // Session duration in days
  maxSessionsPerUser: z.coerce.number().int().min(1).max(100).default(10), // Max concurrent sessions per user
  cleanupIntervalHours: z.coerce.number().int().min(1).max(168).default(24), // Session cleanup interval in hours
});

export const accountConfigSchema = z.object({
  allowNewSignup: z.boolean().default(true),
  defaultUserStorageQuota: z.coerce.number().int().min(1).default(10_000_000_000), // 10GB default quota
});

// SSO configuration schema
export const ssoConfigSchema = z
  .object({
    issuer: z.string().url(),
    clientId: z.string(),
    clientSecret: z.string(),
    redirectUri: z.string().url(),
    autoCreateUser: z.boolean().optional().default(false), // Automatically create user on first SSO login
  })
  .optional();

// Main configuration schema - only user-configurable settings
export const configSchema = z.object({
  server: serverConfigSchema,
  cors: corsConfigSchema,
  docs: docsConfigSchema,
  database: databaseConfigSchema,
  directories: directoryConfigSchema,
  files: fileConfigSchema,
  security: securityConfigSchema,
  account: accountConfigSchema,
  sso: ssoConfigSchema,
});

export type AppConfig = z.infer<typeof configSchema>;

// Get version from environment (set at build time) with fallback
const getAppVersion = (): string => {
  return process.env.APP_VERSION || '0.1.0';
};

// Application constants (truly non-configurable)
export const APP_CONSTANTS = {
  version: getAppVersion(),
} as const;

// Environment variable mappings - clearer naming
export const envMappings = {
  // HTTP Server
  'server.port': 'HTTP_PORT',
  'server.host': 'HTTP_HOST',
  'server.nodeEnv': 'NODE_ENV',
  'server.apiPrefix': 'API_PREFIX',

  // CORS
  'cors.origin': 'CORS_ORIGIN',
  'cors.credentials': 'CORS_CREDENTIALS',

  // Documentation
  'docs.enabled': 'DOCS_ENABLED',
  'docs.path': 'DOCS_PATH',

  // Database (PostgreSQL)
  'database.host': 'DATABASE_HOST',
  'database.port': 'DATABASE_PORT',
  'database.username': 'DATABASE_USERNAME',
  'database.password': 'DATABASE_PASSWORD',
  'database.database': 'DATABASE_NAME',
  'database.ssl': 'DATABASE_SSL',
  'database.maxConnections': 'DATABASE_MAX_CONNECTIONS',
  'database.connectionTimeout': 'DATABASE_CONNECTION_TIMEOUT',

  // Directories
  'directories.dataDir': 'DATA_DIR',
  'directories.filesDir': 'FILES_DIR',
  'directories.configDir': 'CONFIG_DIR',
  'directories.logDir': 'LOG_DIR',
  'directories.cacheDir': 'CACHE_DIR',

  // File configuration
  'file.maxFileSize': 'MAX_FILE_SIZE',
  'file.chunkSize': 'CHUNK_SIZE',
  'file.trashCleanupIntervalDays': 'TRASH_CLEANUP_INTERVAL_DAYS',
  // 'file.maxFileMetadataSize': 'MAX_FILE_METADATA_SIZE', // Uncomment if needed

  // Security
  'security.sessionTimeout': 'SESSION_TIMEOUT',
  'security.jwtSecret': 'JWT_SECRET',

  // Account configuration
  'account.allowNewSignup': 'ALLOW_NEW_SIGNUP',
  'account.defaultUserStorageQuota': 'DEFAULT_USER_STORAGE_QUOTA',

  // SSO (OIDC)
  'sso.issuer': 'SSO_ISSUER',
  'sso.clientId': 'SSO_CLIENT_ID',
  'sso.clientSecret': 'SSO_CLIENT_SECRET',
  'sso.redirectUri': 'SSO_REDIRECT_URI',
  'sso.autoCreateUser': 'SSO_AUTO_CREATE_USER',
} as const;
