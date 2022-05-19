import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { readAnalysisOptions } from '../utils/package';
import { ensureWorkspaceAnalysisOptions, LintRules } from './analysis-options';
import {
  ensureWorkspacePubspec,
  setupWorkspaceForNxDart,
} from './setup-workspace';

describe('analysis options generation', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
    ensureWorkspacePubspec(appTree);
    ensureWorkspaceAnalysisOptions(appTree);
  });

  it('should exclude node_modules from analysis', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });

    const analysisOptions = readAnalysisOptions(appTree);
    expect(analysisOptions?.analyzer.exclude).toEqual(['node_modules/**']);
  });

  it('should support core lint rules', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });

    const analysisOptions = readAnalysisOptions(appTree);
    expect(analysisOptions.include).toBe('package:lints/core.yaml');
  });

  it('should support recommended lint rules', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.recommended });

    const analysisOptions = readAnalysisOptions(appTree);
    expect(analysisOptions.include).toBe('package:lints/recommended.yaml');
  });

  it('should support flutter lint rules', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.flutter });

    const analysisOptions = readAnalysisOptions(appTree);
    expect(analysisOptions.include).toBe('package:flutter_lints/flutter.yaml');
  });

  it('should support all lint rules', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.all });

    expect(appTree.exists('all_lint_rules.yaml')).toBe(true);

    const analysisOptions = readAnalysisOptions(appTree);
    expect(analysisOptions.include).toBe('./all_lint_rules.yaml');
  });
});
