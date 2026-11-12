const {
  lstat, readFile, readdir, realpath, stat
} = require('fs').promises;
const path = require('path');
const { markBlocked } = require('./optional');

const TEXT_EXTENSIONS = new Set([
  '.hbs', '.css', '.js', '.mjs', '.cjs', '.json',
  '.md', '.html', '.htm', '.txt', '.yml', '.yaml', '.svg'
]);
const MAX_TEXT_BYTES = 20 * 1024 * 1024;
const MAX_DEPTH = 30;
const MAX_ENTRIES = 20000;

function blocked(status) {
  return markBlocked([], { resource: 'theme files', status });
}

function isText(name) {
  return TEXT_EXTENSIONS.has(path.extname(name).toLowerCase());
}

async function readOne(filePath, maxBytes) {
  const info = await lstat(filePath);
  if (info.isSymbolicLink() || !info.isFile()) {
    return { skip: true };
  }
  if (info.size > maxBytes) {
    return { status: 'too large' };
  }
  return { text: await readFile(filePath, 'utf8') };
}

// A linked theme directory has to be read. A linked template file blocks the scan:
// skipping it could hide the only reference to an image.
async function visitLink(filePath, entry, maxBytes, state) {
  let info;
  try {
    info = await stat(filePath);
  } catch (err) {
    const extension = path.extname(entry.name);
    if (!isText(entry.name) && extension !== '') {
      return null;
    }
    return err.code === 'ENOENT' ? 'symlink' : (err.code || 'symlink');
  }
  if (info.isDirectory()) {
    state.depth += 1;
    // eslint-disable-next-line no-use-before-define
    const status = await walk(filePath, maxBytes, state);
    state.depth -= 1;
    return status;
  }
  if (isText(entry.name)) {
    return 'symlink';
  }
  return null;
}

async function readEntry(filePath, entry, maxBytes, state) {
  if (entry.isSymbolicLink()) {
    return visitLink(filePath, entry, maxBytes, state);
  }
  if (entry.isDirectory()) {
    state.depth += 1;
    // eslint-disable-next-line no-use-before-define
    const status = await walk(filePath, maxBytes, state);
    state.depth -= 1;
    return status;
  }
  if (!entry.isFile() || !isText(entry.name)) {
    return null;
  }
  const result = await readOne(filePath, maxBytes);
  if (result.status) {
    return result.status;
  }
  if (result.text !== undefined) {
    state.texts.push(result.text);
  }
  return null;
}

async function walk(directory, maxBytes, state) {
  if (state.depth > MAX_DEPTH) {
    return 'too large';
  }
  let real;
  try {
    real = await realpath(directory);
  } catch (err) {
    return err.code || 'unreadable';
  }
  if (state.seen.has(real)) {
    return null;
  }
  state.seen.add(real);

  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (err) {
    return err.code || 'unreadable';
  }

  for (const entry of entries) {
    state.entries += 1;
    if (state.entries > MAX_ENTRIES) {
      return 'too large';
    }
    if (entry.name === 'node_modules') {
      continue;
    }
    const filePath = path.join(directory, entry.name);
    // Themes are small. One entry at a time keeps a single failure from continuing the scan.
    // eslint-disable-next-line no-await-in-loop
    const status = await readEntry(filePath, entry, maxBytes, state);
    if (status) {
      return status;
    }
  }
  return null;
}

async function read(directory, options = {}) {
  const maxBytes = options.maxBytes || MAX_TEXT_BYTES;
  let root;
  try {
    root = await stat(directory);
  } catch (err) {
    const status = err.code === 'ENOENT' ? 'missing' : (err.code || 'unreadable');
    return blocked(status);
  }
  if (!root.isDirectory()) {
    return blocked('unreadable');
  }

  const state = {
    seen: new Set(),
    texts: [],
    depth: 0,
    entries: 0
  };
  const status = await walk(directory, maxBytes, state);
  if (status) {
    return blocked(status);
  }
  return state.texts;
}

module.exports = {
  read
};
