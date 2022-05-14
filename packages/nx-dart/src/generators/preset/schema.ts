export enum LintRules {
  core = 'core',
  recommended = 'recommended',
  flutter = 'flutter',
  all = 'all',
}

export interface PresetGeneratorSchema {
  lints: LintRules;
}
