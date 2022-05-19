import { ensureNxProject, readFile, readJson } from '@nrwl/nx-plugin/testing';
import { readPubspec, runNxCommandAsync } from '@nx-dart/e2e-utils';

describe('preset generator', () => {
  it('should setup the workspace', async () => {
    ensureNxProject('@nx-dart/nx-dart', 'dist/packages/nx-dart');
    await runNxCommandAsync('generate @nx-dart/nx-dart:preset');

    const nxJson = readJson('nx.json');
    expect(nxJson.cli?.defaultCollection).toBe('@nx-dart/nx-dart');
    expect(nxJson.plugins).toContain('@nx-dart/nx-dart');

    const pubspec = readPubspec('.');
    expect(pubspec.dev_dependencies['lints']).toBeDefined();

    const analysisOptions = readFile('analysis_options.yaml');
    expect(analysisOptions).toContain(
      'include: package:lints/recommended.yaml'
    );
  }, 128000);
});
