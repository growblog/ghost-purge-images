const { execFile } = require('child_process');
const {
  readdir, lstat, realpath, unlink
} = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const argv = require('minimist')(process.argv.slice(2));
const execFileAsync = promisify(execFile);

const DEFAULT_CONTENT_IMAGES_PATH = argv['images-path'] || argv.images_path || argv.IMAGES_PATH || 'content/images';
const DEFAULT_CONTENT_MEDIA_PATH = argv['media-path'] || argv.media_path || argv.MEDIA_PATH || 'content/media';
const EXCLUDE_EXTENSION = argv['exclude-ext'] || argv.exclude_ext || argv.EXCLUDE_EXT || [];
const IMAGE_PREFIX = '/content/images/';
const MEDIA_PREFIX = '/content/media/';

function prefixFor(index) {
  return index === 0 ? IMAGE_PREFIX : MEDIA_PREFIX;
}

function urlPathFor(root, filePath, prefix) {
  const relativePath = path.relative(path.resolve(root), filePath);
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }
  return `${prefix}${relativePath.split(path.sep).join('/')}`;
}

function parseExtensions(excludeExtensions) {
  if (typeof excludeExtensions === 'string') {
    return excludeExtensions.split(',').map((extension) => extension.trim()).filter(Boolean);
  }
  if (Array.isArray(excludeExtensions)) {
    return excludeExtensions;
  }
  return [];
}

function isExcluded(filePath, excludeExtensions) {
  return excludeExtensions.some((extension) => filePath.endsWith(`.${extension}`));
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async() => {
    while (next < items.length) {
      const current = next;
      next += 1;
      // A bounded pool keeps a large image tree from opening every file at once.
      // eslint-disable-next-line no-await-in-loop
      results[current] = await worker(items[current]);
    }
  });
  await Promise.all(runners);
  return results;
}

function entryPath(entry) {
  return path.join(entry.parentPath || entry.path, entry.name);
}

function isGeneratedImageSize(filePath) {
  return filePath.split(path.sep).join('/').includes('/images/size/');
}

async function collectFiles(root, excludeExtensions, prefix) {
  const entries = await readdir(root, { withFileTypes: true, recursive: true });
  const files = entries.filter((entry) => {
    if (entry.isSymbolicLink() || !entry.isFile()) {
      return false;
    }
    const filePath = entryPath(entry);
    return !isGeneratedImageSize(filePath) && !isExcluded(filePath, excludeExtensions);
  });
  const described = await mapPool(files, 32, async(entry) => {
    const filePath = entryPath(entry);
    const info = await lstat(filePath);
    if (info.isSymbolicLink() || !info.isFile()) {
      return null;
    }
    return {
      path: filePath,
      size: info.size,
      urlPath: urlPathFor(root, filePath, prefix)
    };
  });
  return described.filter(Boolean);
}

function folderIsMissing(folder) {
  return lstat(folder).then(() => false, (err) => err.code === 'ENOENT');
}

// First folder is images. Later folders are media. Missing roots are listed on missingFolders.
async function list(
  folders = [DEFAULT_CONTENT_IMAGES_PATH, DEFAULT_CONTENT_MEDIA_PATH],
  excludeExtensions = EXCLUDE_EXTENSION
) {
  const excludedExtensions = parseExtensions(excludeExtensions);
  const scanned = await Promise.all(folders.map(async(folder, index) => {
    try {
      const root = await realpath(folder);
      const files = await collectFiles(folder, excludedExtensions, prefixFor(index));
      return { files, missing: null, root };
    } catch (err) {
      if (err.code === 'ENOENT' && await folderIsMissing(folder)) {
        console.warn(`⚠️  Skipping missing folder: ${folder}`);
        return { files: [], missing: folder };
      }
      throw err;
    }
  }));
  const files = scanned.flatMap((entry) => entry.files);
  files.missingFolders = scanned.map((entry) => entry.missing).filter(Boolean);
  files.roots = scanned.map((entry) => entry.root).filter(Boolean);
  return files;
}

function isInsideRoot(realFile, realRoot) {
  const prefix = realRoot.endsWith(path.sep) ? realRoot : `${realRoot}${path.sep}`;
  return realFile === realRoot || realFile.startsWith(prefix);
}

async function assertDeletable(file, roots) {
  const info = await lstat(file);
  if (info.isSymbolicLink()) {
    const error = new Error(`Refusing to delete symlink: ${file}`);
    error.code = 'EPERM';
    throw error;
  }
  if (!roots || !roots.length) {
    return;
  }
  const realFile = await realpath(file);
  const allowed = roots.some((root) => isInsideRoot(realFile, root));
  if (!allowed) {
    const error = new Error(`Refusing to delete outside upload roots: ${file}`);
    error.code = 'EPERM';
    throw error;
  }
}

function defaultPrivilegedRemove(file) {
  return execFileAsync('sudo', ['rm', '--', file]);
}

async function remove(file, options = {}) {
  await assertDeletable(file, options.roots);
  try {
    await unlink(file);
  } catch (err) {
    const canEscalate = (err.code === 'EACCES' || err.code === 'EPERM') && options.fixPermissions;
    if (!canEscalate) {
      throw err;
    }
    if (!options.roots || !options.roots.length) {
      const error = new Error(`Refusing to escalate delete without upload roots: ${file}`);
      error.code = 'EPERM';
      throw error;
    }
    const run = options.runPrivileged || defaultPrivilegedRemove;
    await run(file);
  }
}

module.exports = {
  list,
  remove
};
