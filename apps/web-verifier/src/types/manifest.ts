export interface IntegrityManifest {
  manifestVersion: string;
  build: {
    version: string;
    commit: string;
    timestamp: string;
  };
  assets: Record<string, string>;
  manifestHash: string;
}

export interface VerificationStep {
  name: string;
  status: 'pending' | 'success' | 'failed' | 'warning';
  message: string;
  details?: string;
}

export interface VerificationResult {
  success: boolean;
  authentic: boolean;
  instanceUrl: string;
  version: string;
  commit: string;
  totalFiles: number;
  matchedFiles: number;
  modifiedFiles: string[];
  missingFiles: string[];
  extraFiles: string[];
  details: FileComparison[];
  steps: VerificationStep[];
}

export interface FileComparison {
  path: string;
  instanceHash: string | null;
  officialHash: string | null;
  status: 'match' | 'modified' | 'missing' | 'extra';
}
