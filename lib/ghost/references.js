const PUBLIC_PATH = /^\/content\/(?:images|media)\//;
const ABSOLUTE_START = /\/content\/(?:images|media)\//g;
const RELATIVE_START = /(?:^|[\s"'=(])content\/(?:images|media)\//g;
const URL_PREFIX = /[A-Za-z0-9\-._~:/?@!$&*+,;=%]/;

function cleanReference(raw) {
  let value = String(raw).replace(/\\/g, '/').trim();
  if (!value.startsWith('/')) {
    value = `/${value}`;
  }
  const cut = value.search(/[?#]/);
  if (cut !== -1) {
    value = value.slice(0, cut);
  }
  value = value.replace(/\.+$/g, '');
  try {
    return decodeURIComponent(value);
  } catch (err) {
    return value;
  }
}

function countChar(value, char) {
  return value.split(char).length - 1;
}

function trimClosers(raw) {
  let value = String(raw);
  while (/[.,;:!>]$/.test(value)) {
    value = value.slice(0, -1);
  }
  while (value.endsWith(')') && countChar(value, ')') > countChar(value, '(')) {
    value = value.slice(0, -1);
  }
  while (value.endsWith(',') || value.endsWith('\'') || value.endsWith('"')) {
    value = value.slice(0, -1);
  }
  return value;
}

function openingQuote(text, index) {
  let cursor = index - 1;
  while (cursor >= 0 && URL_PREFIX.test(text[cursor])) {
    cursor -= 1;
  }
  if (cursor >= 0 && (text[cursor] === '"' || text[cursor] === '\'')) {
    return text[cursor];
  }
  return null;
}

function readReference(text, start) {
  const quote = openingQuote(text, start);
  let end = start;
  while (end < text.length) {
    const ch = text[end];
    if (quote && (ch === quote || ch === '\n' || ch === '\r')) {
      break;
    }
    if (!quote && /[\s<>"#`]/.test(ch)) {
      break;
    }
    end += 1;
  }
  return trimClosers(text.slice(start, end));
}

function addMatch(into, raw) {
  const candidates = [raw];
  String(raw).split(/[\s,]+/).forEach((piece) => {
    if (piece) {
      candidates.push(piece);
    }
  });
  candidates.forEach((piece) => {
    const value = cleanReference(trimClosers(piece));
    if (PUBLIC_PATH.test(value)) {
      into.add(value);
    }
  });
}

function collectFromText(text, into) {
  const normalized = text.replace(/\\/g, '/');
  Array.from(normalized.matchAll(ABSOLUTE_START)).forEach((match) => {
    addMatch(into, readReference(normalized, match.index));
  });
  Array.from(normalized.matchAll(RELATIVE_START)).forEach((match) => {
    const contentAt = match[0].lastIndexOf('content/');
    addMatch(into, readReference(normalized, match.index + contentAt));
  });
}

function collectReferences(value, into = new Set()) {
  if (typeof value === 'string') {
    collectFromText(value, into);
    return into;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectReferences(item, into));
    return into;
  }
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      if (key === 'incomplete') {
        return;
      }
      collectReferences(value[key], into);
    });
  }
  return into;
}

function contentPathFromDisk(filePath) {
  if (!filePath) {
    return null;
  }
  const normalized = String(filePath).replace(/\\/g, '/');
  const match = normalized.match(/(?:^|\/)(content\/(?:images|media)\/.+)$/);
  if (!match) {
    return null;
  }
  return cleanReference(`/${match[1]}`);
}

function publicPaths(upload) {
  if (!upload) {
    return [];
  }
  const paths = [];
  [upload.urlPath, contentPathFromDisk(upload.path)].forEach((candidate) => {
    if (!candidate) {
      return;
    }
    const value = cleanReference(candidate);
    if (PUBLIC_PATH.test(value) && !paths.includes(value)) {
      paths.push(value);
    }
  });
  return paths;
}

// Files that cannot be mapped to a public Ghost path are kept.
function isReferenced(upload, references) {
  const paths = publicPaths(upload);
  if (paths.length === 0) {
    return true;
  }
  return paths.some((item) => references.has(item));
}

function isReferencedBy(upload, value) {
  return isReferenced(upload, collectReferences(value));
}

module.exports = {
  collectReferences,
  contentPathFromDisk,
  isReferenced,
  isReferencedBy,
  publicPaths
};
