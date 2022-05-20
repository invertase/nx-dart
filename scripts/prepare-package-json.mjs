import * as fs from 'fs';
import * as process from 'process';

const packageRoot = process.argv[2];

const packageJson = JSON.parse(
  fs.readFileSync(`${packageRoot}/package.json`, 'utf-8')
);

// Change `main` from being relative to the package source directory to being
// relative to the dist package directory.
// The main path in the source dir looks something likes this:
// ../../dist/packages/<package>/src/index.js
// We want to remove ../../dist/packages/<package> from the main path so it is just src/index.js.
// So we remove the first 5 segments of the path.
const mainPathSegments = packageJson.main.split('/');
if (mainPathSegments.length < 5) {
  throw new Error(`Invalid main path: ${packageJson.main}`);
}
const distMain = mainPathSegments.slice(5).join('/');
packageJson.main = distMain;

fs.writeFileSync(
  `${packageRoot}/package.json`,
  JSON.stringify(packageJson, null, 2)
);
