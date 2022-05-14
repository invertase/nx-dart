import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { LintRules } from '../common/setup-workspace';
import { expectNxJsonHasPlugin } from '../testing/asserts';
import generator from './generator';

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
});
