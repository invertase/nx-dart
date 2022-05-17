import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
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

  it('should support core lint rules', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.core });

    expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
      'include: package:lints/core.yaml'
    );
  });

  it('should support recommended lint rules', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.recommended });

    expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
      'include: package:lints/recommended.yaml'
    );
  });

  it('should support flutter lint rules', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.flutter });

    expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
      'include: package:flutter_lints/flutter.yaml'
    );
  });

  it('should support all lint rules', async () => {
    await setupWorkspaceForNxDart(appTree, { lints: LintRules.all });

    expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
      'linter:\n  rules:\n    -'
    );
  });
});
