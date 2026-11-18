const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

const MANIFEST_NAME = 'manifest.json';
const MANIFEST_VERSION = 1;
const DEFAULT_BACKUP_ROOT = argv['backup-path'] || argv.backup_path || 'content/ghost-purge-backup';
const DEFAULT_QUARANTINE_ROOT = argv['quarantine-path'] || argv.quarantine_path
  || 'content/ghost-purge-quarantine';

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function isInsideRoot(realFile, realRoot) {
  const prefix = realRoot.endsWith(path.sep) ? realRoot : `${realRoot}${path.sep}`;
  return realFile === realRoot || realFile.startsWith(prefix);
}

function resolveExisting(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch (err) {
    return path.resolve(filePath);
  }
}

function relativeUnderRoots(filePath, roots) {
  const absolute = resolveExisting(filePath);
  for (const root of roots || []) {
    const absoluteRoot = resolveExisting(root);
    if (!isInsideRoot(absolute, absoluteRoot)) {
      continue;
    }
    const relative = path.relative(absoluteRoot, absolute);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      continue;
    }
    return path.join(path.basename(absoluteRoot), relative);
  }
  return path.basename(absolute);
}

function absoluteSource(filePath) {
  return resolveExisting(filePath);
}

function readManifest(archiveDir) {
  const manifestPath = path.join(archiveDir, MANIFEST_NAME);
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  if (!manifest || manifest.version !== MANIFEST_VERSION || !Array.isArray(manifest.files)) {
    throw new Error(`Invalid archive manifest: ${manifestPath}`);
  }
  return manifest;
}

function writeManifest(archiveDir, manifest) {
  const manifestPath = path.join(archiveDir, MANIFEST_NAME);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
}

async function createArchiveDir(parentDir) {
  const archiveDir = path.join(parentDir, stamp());
  await fsp.mkdir(archiveDir, { recursive: true });
  return archiveDir;
}

function archiveEntry(item, roots) {
  const storedAs = relativeUnderRoots(item.path, roots);
  return {
    source: absoluteSource(item.path),
    storedAs: storedAs.split(path.sep).join('/'),
    destination: null,
    size: item.size
  };
}

function withDestination(entry, archiveDir) {
  return {
    ...entry,
    destination: path.join(archiveDir, entry.storedAs)
  };
}

function buildManifest(mode, files) {
  return {
    version: MANIFEST_VERSION,
    mode,
    createdAt: new Date().toISOString(),
    files: files.map((file) => ({
      source: file.source,
      storedAs: file.storedAs,
      size: file.size
    }))
  };
}

function listArchiveCandidates(parentDirs) {
  const archives = [];
  for (const parent of parentDirs) {
    if (!parent || !fs.existsSync(parent)) {
      continue;
    }
    const entries = fs.readdirSync(parent, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const archiveDir = path.join(parent, entry.name);
      const manifestPath = path.join(archiveDir, MANIFEST_NAME);
      if (!fs.existsSync(manifestPath)) {
        continue;
      }
      const info = fs.statSync(manifestPath);
      archives.push({ archiveDir, mtimeMs: info.mtimeMs });
    }
  }
  return archives.sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function resolveArchiveDir(options = {}) {
  if (options.from) {
    const archiveDir = path.resolve(options.from);
    readManifest(archiveDir);
    return archiveDir;
  }
  const parents = [
    options.backupPath || DEFAULT_BACKUP_ROOT,
    options.quarantinePath || DEFAULT_QUARANTINE_ROOT
  ];
  const [latest] = listArchiveCandidates(parents);
  if (!latest) {
    throw new Error('No backup or quarantine archive found. Pass --from=/path/to/archive');
  }
  return latest.archiveDir;
}

async function restoreFiles(options = {}) {
  const archiveDir = resolveArchiveDir(options);
  const manifest = readManifest(archiveDir);
  const copyFile = options.copyFile;
  const restored = [];
  const errors = [];
  for (const entry of manifest.files) {
    const stored = path.join(archiveDir, entry.storedAs);
    const destination = entry.source;
    try {
      // eslint-disable-next-line no-await-in-loop
      await copyFile(stored, destination);
      restored.push({
        source: stored,
        destination,
        size: entry.size
      });
    } catch (err) {
      errors.push({ entry, err });
    }
  }
  return {
    archiveDir, manifest, restored, errors
  };
}

module.exports = {
  MANIFEST_NAME,
  MANIFEST_VERSION,
  DEFAULT_BACKUP_ROOT,
  DEFAULT_QUARANTINE_ROOT,
  relativeUnderRoots,
  readManifest,
  writeManifest,
  createArchiveDir,
  archiveEntry,
  withDestination,
  buildManifest,
  resolveArchiveDir,
  restoreFiles,
  listArchiveCandidates
};
