import { envMappings } from '@/config/config.schema';

/**
 * Step 1: Load environment variables and validate DATA_DIR
 */
export function loadFromEnvironment(): any {
  const envConfig: any = {};

  // Process each mapping
  for (const [configPath, envVar] of Object.entries(envMappings)) {
    const envValue = process.env[envVar];
    if (envValue !== undefined) {
      setNestedValue(envConfig, configPath, parseEnvValue(envValue));
    }
  }

  return envConfig;
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj: any, path: string, value: any): void {
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
 * Parse environment variable value to appropriate type
 */
function parseEnvValue(value: string): any {
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