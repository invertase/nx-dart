import * as path from 'path';
import { dartToolPath, packageConfigPath, pubspecPath } from './pub';

describe('pub utils', () => {
  it('pubspecPath returns correct path', () => {
    expect(pubspecPath('a/b')).toBe(path.join('a', 'b', 'pubspec.yaml'));
  });

  it('dartToolPath returns correct path', () => {
    expect(dartToolPath('a/b')).toBe(path.join('a', 'b', '.dart_tool'));
  });

  it('packageConfigPath returns correct path', () => {
    expect(packageConfigPath('a/b')).toBe(
      path.join('a', 'b', '.dart_tool', 'package_config.json')
    );
  });
});
