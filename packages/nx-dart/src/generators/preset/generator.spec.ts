import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { expectNxJsonHasPlugin } from '../testing/asserts';
import generator from './generator';
import { LintRules } from './schema';

describe('preset generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should setup workspace for @nx-dart', async () => {
    await generator(
      appTree,
      { lints: LintRules.core },
      { installDependencies: false }
    );
    expectNxJsonHasPlugin(appTree);
  });

  describe('lint', () => {
    it('it should enable strict type checks', async () => {
      await generator(
        appTree,
        { lints: LintRules.core },
        { installDependencies: false }
      );

      const analysisOptions = appTree.read('analysis_options.yaml', 'utf8');

      const strictRules = [
        'strict-casts',
        'strict-inference',
        'strict-raw-types',
      ];
      for (const rule of strictRules) {
        expect(analysisOptions).toContain(`${rule}: true`);
      }
    });

    it('it should support core lint rules', async () => {
      await generator(
        appTree,
        { lints: LintRules.core },
        { installDependencies: false }
      );

      expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
        'include: package:lints/core.yaml'
      );
    });

    it('it should support recommended lint rules', async () => {
      await generator(
        appTree,
        { lints: LintRules.recommended },
        { installDependencies: false }
      );

      expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
        'include: package:lints/recommended.yaml'
      );
    });

    it('it should support flutter lint rules', async () => {
      await generator(
        appTree,
        { lints: LintRules.flutter },
        { installDependencies: false }
      );

      expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
        'include: package:flutter_lints/flutter.yaml'
      );
    });

    it('it should support all lint rules', async () => {
      await generator(
        appTree,
        { lints: LintRules.all },
        { installDependencies: false }
      );

      expect(appTree.read('analysis_options.yaml', 'utf8')).toContain(
        'linter:\n  rules:\n    -'
      );
    });
  });
});
