import { packageNameFromUri } from './dart-source';

describe('dart source', () => {
  it('packageNameFromUri returns package name', () => {
    expect(packageNameFromUri('dart:a')).toBeUndefined();
    expect(packageNameFromUri('a.dart')).toBeUndefined();
    expect(packageNameFromUri('package:a/b.dart')).toEqual('a');
  });
});
