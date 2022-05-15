import * as path from 'path';
import { pubspecPath } from './pub';

describe('pub utils', () => {
  it('pubspecPath returns correct path', () => {
    expect(pubspecPath('a/b')).toBe(path.join('a', 'b', 'pubspec.yaml'));
  });
});
