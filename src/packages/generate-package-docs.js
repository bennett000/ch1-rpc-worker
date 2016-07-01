const UTF8 = 'utf8';
const fs = require('fs');
const path = require('path');
const sourceRoot = path.join(__dirname, '..');
const outputRoot = path.join(sourceRoot, '..', 'dist');

const dirs = fs.readdirSync(sourceRoot);

const packageJson = readOrDie(path.join(sourceRoot, '..', 'package.json'));
const parsedPackageJson = parse(packageJson, 'package.json');
if (!parsedPackageJson) {
  process.exit(1);
}
const license = readOrDie(path.join(sourceRoot, '..', 'LICENSE'));

// this is Free software the package is public
// however the main package json is set to private to avoid accidental
// publishing
parsedPackageJson.private = false;

// remove deps
delete parsedPackageJson.dependencies;
delete parsedPackageJson.devDependencies;
delete parsedPackageJson.peerDependencies;
delete parsedPackageJson.scripts;

dirs.forEach((fileOrFolder) => {
  try {
    const fullPath = path.join(sourceRoot, fileOrFolder);
    const stat = fs.statSync(fullPath);
    if (!stat.isDirectory()) {
      return;
    }

    const packagePath = path.join(fullPath, `package.${fileOrFolder}.json`);

    const readmePath = path.join(fullPath, `README.${fileOrFolder}.md`);

    const file = fs.readFileSync(packagePath, UTF8);
    const readme = fs.readFileSync(readmePath, UTF8);

    const parsed = parse(file, fullPath);

    const destPath = path.join(outputRoot, fileOrFolder);
    const destPackage = path.join(destPath, 'package.json');
    const destReadme = path.join(destPath, 'README.md');

    const packString = JSON.stringify(
      merge(parsedPackageJson, parsed), null, 2);

    fs.writeFileSync(destPackage, packString);
    fs.writeFileSync(path.join(destPath, 'LICENSE'), license);
    fs.writeFileSync(destReadme, readme);
  } catch (err) {
    // swallow errors
  }
});

function parse(file, desc) {
  try {
    return JSON.parse(file);
  } catch (err) {
    console.log('Could not parse', desc);
    return null;
  }
}

function readOrDie(file) {
  try {
    return fs.readFileSync(file, UTF8);
  } catch (err) {
    console.log(`Failed to load requisite: ${file}`);
    process.exit(1);
    return '';
  }
}

function merge(a, b) {
  for (const i in b) {
    if (!a[i]) {
      a[i] = b[i];
    } else  if (Array.isArray(b[i])) {
      a[i] = b[i];
    } else if (typeof b[i] === 'object') {
      if (a[i] && typeof a[i] === 'object') {
        a[i] = merge(a[i], b[i]);
      } else {
        a[i] = b[i];
      }
    } else {
      a[i] = b[i];
    }
  }

  return a;
}
