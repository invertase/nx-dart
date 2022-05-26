import { GitignoreOptions, GlobbyFilterFunction } from 'globby';

export function isGitIgnored(
  options?: GitignoreOptions
): Promise<GlobbyFilterFunction>;
