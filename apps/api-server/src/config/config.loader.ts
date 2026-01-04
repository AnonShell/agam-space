import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  accountConfigSchema,
  APP_CONSTANTS,
  type AppConfig,
  configSchema,
  databaseConfigSchema,
  docsConfigSchema,
  fileConfigSchema,
  securityConfigSchema,
  serverConfigSchema,
} from './config.schema';
import { loadFromEnvironment } from '@/config/env.loader';

interface ConfigOptions {
  configFile?: string;
  validateOnly?: boolean;
}

class ConfigLoader {
  private static instance: ConfigLoader;
  private config: AppConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Bootstrap and load configuration
   * This is the main entry point that follows the user's plan
   */
  loadConfig(options: ConfigOptions = {}): AppConfig {
    if (this.config && !options.validateOnly) {
      return this.config;
    }

    console.log('🚀 Bootstrapping Agam Space...');

    // Step 1: Load ENV
    const envConfig = loadFromEnvironment();

    // Step 2: Load config.json from CONFIG_DIR
    const fileConfig = this.loadOrCreateConfigFile(options.configFile ?? this.getConfigFilePath());

    const merged = this.mergeConfigs(envConfig, fileConfig, {});

    // Step 3: Validate DATA_DIR early
    this.validateDataDir(merged);

    // Step 4: Resolve final directory paths
    const resolvedDirs = this.resolveDirectoryPaths(merged);

    // Step 5: Ensure all paths exist
    const dirsCreated = this.createRequiredDirectories(resolvedDirs);

    // Step 6: Final merge + validation
    const finalConfig = this.mergeConfigs(envConfig, fileConfig, resolvedDirs);

    try {
      const validatedConfig = configSchema.parse(finalConfig);

      this.logConfigSummary(validatedConfig, dirsCreated);

      this.config = validatedConfig;
      return validatedConfig;
    } catch (error) {
      console.error('❌ Configuration validation failed:');
      if (error instanceof Error) {
        console.error(error.message);
      }
      throw new Error(`Invalid configuration: ${error}`);
    }
  }

  /**
   * Step 2: Validate that DATA_DIR is provided (fail fast)
   */
  private validateDataDir(envConfig: any): void {
    const envDataDir = envConfig?.directories?.dataDir || process.env.DATA_DIR;
    let resolvedDataDir: string;

    if (envDataDir) {
      // Priority 1: Use DATA_DIR from environment (developer override)
      resolvedDataDir = envDataDir;
      console.log(`✅ DATA_DIR (from env): ${resolvedDataDir}`);
    } else {
      // Priority 2: Try default Docker path
      const dockerDataDir = '/data';
      try {
        // Check if we can access/create the Docker path
        if (existsSync(dockerDataDir) || this.canCreateDirectory(dockerDataDir)) {
          resolvedDataDir = dockerDataDir;
          console.log(`✅ DATA_DIR (default): ${resolvedDataDir}`);
        } else {
          throw new Error('Cannot access default Docker path');
        }
      } catch (err) {
        // Priority 3: Fail with helpful message
        console.error(
          `❌ DATA_DIR resolution failed! - ${err instanceof Error ? err.message : err}`
        );
        console.error(
          `   Neither DATA_DIR environment variable is set nor ${dockerDataDir} is available`
        );
        console.error('   Solutions:');
        console.error('   - Set DATA_DIR environment variable (e.g., DATA_DIR=./local/data)');
        console.error(`   - Mount a volume to ${dockerDataDir} in Docker`);
        console.error(`   - Ensure ${dockerDataDir} directory exists and is writable`);
        process.exit(1);
      }
    }

    // Store the resolved DATA_DIR for later use
    if (!envConfig.directories) {
      envConfig.directories = {};
    }
    envConfig.directories.dataDir = resolvedDataDir;
  }

  private getConfigFilePath(): string {
    const configDir = process.env.CONFIG_DIR || '/config';
    return join(configDir, 'config.json');
  }

  /**
   * Check if we can create a directory (used for Docker path validation)
   */
  private canCreateDirectory(path: string): boolean {
    try {
      mkdirSync(path, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Step 3: Resolve final directory paths with defaults
   */
  private resolveDirectoryPaths(envConfig: any): any {
    // DATA_DIR was already resolved and set in validateDataDir
    const dataDir = this.resolvePath(envConfig.directories.dataDir);

    return {
      dataDir,
      filesDir: envConfig?.directories?.filesDir
        ? this.resolvePath(envConfig.directories.filesDir)
        : join(dataDir, 'files'),
      configDir: envConfig?.directories?.configDir
        ? this.resolvePath(envConfig.directories.configDir)
        : join(dataDir, 'config'),
      logDir: envConfig?.directories?.logDir
        ? this.resolvePath(envConfig.directories.logDir)
        : join(dataDir, 'logs'),
      cacheDir: envConfig?.directories?.cacheDir
        ? this.resolvePath(envConfig.directories.cacheDir)
        : join(dataDir, 'cache'),
    };
  }

  /**
   * Step 4: Ensure all directory paths exist
   */
  private createRequiredDirectories(dirs: any): string[] {
    const createdDirs: string[] = [];

    for (const [name, path] of Object.entries(dirs)) {
      try {
        if (!existsSync(path as string)) {
          mkdirSync(path as string, { recursive: true });
          createdDirs.push(`${name}: ${path}`);
        }
      } catch (error) {
        console.error(
          `❌ Failed to create ${name} directory ${path}:`,
          error instanceof Error ? error.message : error
        );
        throw error;
      }
    }

    if (createdDirs.length > 0) {
      console.log('📂 Created directories:');
      for (const dir of createdDirs) console.log(`   ✅ ${dir}`);
    }

    return createdDirs;
  }

  /**
   * Step 5: Load config.json from CONFIG_DIR or create default
   */
  private loadOrCreateConfigFile(configPath: string): any {
    try {
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf8');
        return JSON.parse(content);
      } else {
        console.warn(
          `⚠️ No config.json found at ${configPath}. Proceeding with environment variables and schema defaults.`
        );
        return {};
      }
    } catch (error) {
      console.error(
        `❌ Failed to fetch config file ${configPath}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  }

  /**
   * Generate default configuration using individual Zod schema defaults
   */
  private getDefaultConfigFromSchema(): any {
    // Parse each schema section with empty object to get Zod defaults
    const serverDefaults = serverConfigSchema.partial().parse({});
    const docsDefaults = docsConfigSchema.partial().parse({});
    const databaseDefaults = databaseConfigSchema.partial().parse({});
    const securityDefaults = securityConfigSchema.partial().parse({});
    const filsDefaults = fileConfigSchema.partial().parse({});
    const accountDefaults = accountConfigSchema.partial().parse({});

    return {
      server: serverDefaults,
      docs: docsDefaults,
      database: databaseDefaults,
      security: securityDefaults,
      files: filsDefaults,
      account: accountDefaults,
    };
  }

  /**
   * Step 6: Merge configurations with precedence DEFAULTS → CONFIG_FILE → ENV
   */
  private mergeConfigs(envConfig: any, fileConfig: any, resolvedDirs: any): any {
    // Start with schema defaults (this ensures backward compatibility)
    const schemaDefaults = this.getDefaultConfigFromSchema();

    // Start with directory config and schema defaults
    const baseConfig = {
      directories: resolvedDirs,
      ...schemaDefaults,
    };

    // Apply file config (overrides defaults)
    this.deepMerge(baseConfig, fileConfig);

    // Apply env config (highest priority - overrides everything)
    this.deepMerge(baseConfig, envConfig);

    return baseConfig;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): void {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  /**
   * Resolve path with support for ~ and relative paths
   */
  private resolvePath(path: string): string {
    if (path.startsWith('~/')) {
      return resolve(homedir(), path.slice(2));
    }
    if (!path.startsWith('/')) {
      return resolve(process.cwd(), path);
    }
    return path;
  }

  /**
   * Step 7: Log configuration summary
   */
  private logConfigSummary(config: AppConfig, createdDirs: string[]): void {
    console.log('\n📋 Configuration Summary:');
    console.log(`   App: Agam Space API v${APP_CONSTANTS.version}`);
    console.log(`   Server: ${config.server.host}:${config.server.port}`);
    console.log(`   Environment: ${config.server.nodeEnv}`);
    console.log(`   API Prefix: /${config.server.apiPrefix}`);
    console.log(`   Data Directory: ${config.directories.dataDir}`);
    console.log(
      `   Database: ${config.database.host}:${config.database.port}/${config.database.database}`
    );
    if (config.docs.enabled) {
      console.log(`   API Docs: /${config.docs.path}`);
    }

    const isFirstTime = createdDirs.length > 0;
    if (isFirstTime) {
      console.log('🎉 First-time setup complete!\n');
    } else {
      console.log('✅ Bootstrap complete!\n');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Validate configuration without loading
   */
  validateConfig(configData: any): { valid: boolean; errors?: string[] } {
    try {
      configSchema.parse(configData);
      return { valid: true };
    } catch (error) {
      const errors = error instanceof Error ? [error.message] : ['Unknown validation error'];
      return { valid: false, errors };
    }
  }
}

// Export singleton instance
export const configLoader = ConfigLoader.getInstance();
