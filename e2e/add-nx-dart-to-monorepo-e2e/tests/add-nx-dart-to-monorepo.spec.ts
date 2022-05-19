import {
  readFile,
  readJson,
  runNxCommandAsync,
  tmpProjPath,
} from '@nrwl/nx-plugin/testing';
import {
  newNonNxWorkspace,
  runCommandAsync,
  writePubspec,
} from '@nx-dart/e2e-utils';
import * as path from 'path';

describe('add-nx-dart-to-monorepo', () => {
  beforeAll(() => {});

  afterAll(() => runNxCommandAsync('reset'));

  it('does not throw', async () => {
    newNonNxWorkspace();
    writePubspec('packages/a/pubspec.yaml', {
      name: 'a',
    });

    const { stdout, stderr } = await runCommandAsync(
      `${addNxDartToMonorepoBin()} --nxCloud false --lints core`
    );

    expect(stdout).toContain('🎉 Done!');
    expect(stderr).toBe('');

    expect(readFile('analysis_options.yaml')).toContain(
      'include: package:lints/core.yaml'
    );

    const workspace = readJson('workspace.json');
    expect(workspace.projects['a']).toBeDefined();
  }, 240000);
});

function addNxDartToMonorepoBin() {
  return path.resolve(
    tmpProjPath(),
    '../../../node_modules/.bin/add-nx-dart-to-monorepo'
  );
}
