export interface TestExecutorSchema {
  coverage?: boolean;
  targets?: string[];
  [option: string]: unknown;
}
