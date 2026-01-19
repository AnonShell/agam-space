export interface ShouldRunResult {
  shouldRun: boolean;
  permanent: boolean;
}

export interface Migration {
  getName(): string;
  getDescription(): string;
  shouldRun(): Promise<ShouldRunResult>;
  run(): Promise<void>;
}
