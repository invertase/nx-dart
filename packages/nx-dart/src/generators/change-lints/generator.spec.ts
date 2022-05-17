import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { LintRules } from '../workspace/analysis-options';
import generator from './generator';

describe('change-lints generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should work without preexisting pubspec.yaml and analysis_options.yaml', async () => {
    await generator(appTree, { lints: LintRules.core });

    const analysisOptions = appTree.read('analysis_options.yaml', 'utf-8');
    expect(analysisOptions).toContain('include: package:lints/core.yaml');
  });

  it('should work with preexisting pubspec.yaml and analysis_options.yaml', async () => {
    await generator(appTree, { lints: LintRules.core });
    await generator(appTree, { lints: LintRules.flutter });

    const analysisOptions = appTree.read('analysis_options.yaml', 'utf-8');
    expect(analysisOptions).toContain(
      'include: package:flutter_lints/flutter.yaml'
    );
  });
});
