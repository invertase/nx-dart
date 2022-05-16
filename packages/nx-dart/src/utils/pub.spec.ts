import * as path from 'path';
import { isFlutterPackage, Pubspec, pubspecPath } from './pub';

describe('pub utils', () => {
  it('pubspecPath returns correct path', () => {
    expect(pubspecPath('a/b')).toBe(path.join('a', 'b', 'pubspec.yaml'));
  });

  describe('isFlutterPackage', () => {
    it('should return true if flutter is environment', () => {
      const pubspec: Pubspec = {
        environment: {
          flutter: 'any',
        },
      };
      expect(isFlutterPackage(pubspec)).toBe(true);
    });

    it('should return true if flutter is dependencies', () => {
      const pubspec: Pubspec = {
        dependencies: {
          flutter: 'any',
        },
      };
      expect(isFlutterPackage(pubspec)).toBe(true);
    });
  });
});
