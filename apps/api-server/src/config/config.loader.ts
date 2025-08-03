import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  APP_CONSTANTS,
  type AppConfig,
  configSchema,
  corsConfigSchema,
  databaseConfigSchema,
  docsConfigSchema,
  envMappings,
  fileConfigSchema,
  securityConfigSchema,
  serverConfigSchema,
} from './config.schema';

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

    // Step 1: Load ENV (or CLI args) and validate DATA_DIR
    const envConfig = this.loadFromEnvironment();
    this.validateDataDir(envConfig);

    // Step 2: Resolve final directory paths
    const resolvedDirs = this.resolveDirectoryPaths(envConfig);

    // Step 3: Ensure all paths exist
    const dirsCreated = this.createRequiredDirectories(resolvedDirs);

    // Step 4: Load config.json from CONFIG_DIR
    const configFile = options.configFile || join(resolvedDirs.configDir, 'config.json');
    const fileConfig = this.loadOrCreateConfigFile(configFile);

    // Step 5: Merge final config (ENV > config.json > defaults)
    const mergedConfig = this.mergeConfigs(envConfig, fileConfig, resolvedDirs);

    // Step 6: Validate final config
    try {
      const validatedConfig = configSchema.parse(mergedConfig);

      // Step 7: Log configuration summary
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
   * Step 1: Load environment variables and validate DATA_DIR
   */
  private loadFromEnvironment(): any {
    const envConfig: any = {};

    // Process each mapping
    for (const [configPath, envVar] of Object.entries(envMappings)) {
      const envValue = process.env[envVar];
      if (envValue !== undefined) {
        this.setNestedValue(envConfig, configPath, this.parseEnvValue(envValue));
      }
    }

    return envConfig;
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
      } catch (err){
        // Priority 3: Fail with helpful message
        console.error(`❌ DATA_DIR resolution failed! - ${err instanceof Error ? err.message : err}`);
        console.error(`   Neither DATA_DIR environment variable is set nor ${dockerDataDir} is available`);
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
        console.log(`📝 Creating default config: ${configPath}`);

        // Use Zod schema defaults by parsing individual sections
        const defaultConfig = this.getDefaultConfigFromSchema();
        writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
        console.log(`✅ Default config created`);
        return defaultConfig;
      }
    } catch (error) {
      console.error(
        `❌ Failed to handle config file ${configPath}:`,
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
    const serverDefaults = serverConfigSchema.parse({});
    const corsDefaults = corsConfigSchema.parse({});
    const docsDefaults = docsConfigSchema.parse({});
    const databaseDefaults = databaseConfigSchema.parse({});
    const securityDefaults = securityConfigSchema.parse({});
    const filsDefaults =  fileConfigSchema.parse({});

    return {
      server: serverDefaults,
      cors: corsDefaults,
      docs: docsDefaults,
      database: databaseDefaults,
      security: securityDefaults,
      files: filsDefaults,
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
   * Parse environment variable value to appropriate type
   */
  private parseEnvValue(value: string): any {
    // Boolean values
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Numeric values
    if (/^\d+$/.test(value)) return Number.parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return Number.parseFloat(value);

    // Array values (comma-separated)
    if (value.includes(',')) {
      return value.split(',').map(v => v.trim());
    }

    // String values
    return value;
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys.at(-1)] = value;
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

  /**
   * Generate example configuration file
   */
  generateExampleConfig(): string {
    return JSON.stringify(this.getDefaultConfigFromSchema(), null, 2);
  }
}

// Export singleton instance
export const configLoader = ConfigLoader.getInstance();

// Legacy function for NestJS compatibility
export const loadConfig = () => {
  return configLoader.loadConfig();
};
