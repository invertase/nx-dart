import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packageJson = JSON.parse(
  fs.readFileSync(path.join(dirname, '../package.json'), 'utf8')
);

const lernaJson = JSON.parse(
  fs.readFileSync(path.join(dirname, '../lerna.json'), 'utf8')
);

const nxVersion = packageJson.devDependencies.nx;
const nxDartVersion = lernaJson.version;

const versions = {
  NX_VERSION: nxVersion,
  NX_DART_VERSION: nxDartVersion,
};

const targetDir = process.argv[2];

substitute(targetDir, versions);

function substitute(dir, strings) {
  const children = fs.readdirSync(dir);
  for (const child of children) {
    const childPath = path.join(dir, child);
    const stat = fs.statSync(childPath);
    if (stat.isDirectory()) {
      substitute(childPath, strings);
      continue;
    }

    let contents = fs.readFileSync(childPath, 'utf-8');
    for (const [key, value] of Object.entries(strings)) {
      contents = contents.replace(new RegExp(`${key}`, 'g'), value);
    }
    fs.writeFileSync(childPath, contents, 'utf-8');
  }
}
