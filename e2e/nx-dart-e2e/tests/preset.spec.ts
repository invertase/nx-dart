import { ensureNxProject, readJson } from '@nrwl/nx-plugin/testing';
import { runNxCommandAsync } from './utils';

describe('preset generator', () => {
  it('smoke test', async () => {
    ensureNxProject('@nx-dart/nx-dart', 'dist/packages/nx-dart');
    await runNxCommandAsync('generate @nx-dart/nx-dart:preset --lints core');
    const nxJson = readJson('nx.json');
    expect(nxJson.cli?.defaultCollection).toBe('@nx-dart/nx-dart');
    expect(nxJson.plugins).toContain('@nx-dart/nx-dart');
  }, 120000);
});
