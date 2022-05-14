import {
  ensureNxProject,
  newNxProject,
  readJson,
} from '@nrwl/nx-plugin/testing';
import { runNxCommandAsync } from './utils';

describe('preset generator', () => {
  beforeAll(() => ensureNxProject('@nx-dart/nx-dart', 'dist/packages/nx-dart'));

  beforeEach(() => newNxProject('@nx-dart/nx-dart', 'dist/packages/nx-dart'));

  afterAll(() => runNxCommandAsync('reset'));

  it('smoke test', async () => {
    await runNxCommandAsync('generate @nx-dart/nx-dart:preset --lints core');
    const nxJson = readJson('nx.json');
    expect(nxJson.cli?.defaultCollection).toBe('@nx-dart/nx-dart');
    expect(nxJson.plugins).toContain('@nx-dart/nx-dart');
  }, 120000);
});
