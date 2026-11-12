const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const Posts = require('./posts');
const Pages = require('./pages');
const Tags = require('./tags');
const Authors = require('./authors');
const Newsletters = require('./newsletters');
const Settings = require('./settings');
const Snippets = require('./snippets');
const ThemeFiles = require('./themeFiles');
const ThemeSettings = require('./themeSettings');
const { readBlock } = require('./optional');

const KEY_HELP = [
  'Set GHOST_CONTENT_KEY and GHOST_ADMIN_KEY in the environment.',
  'Do not pass the keys as arguments: they are saved in shell history and shown by ps.',
  'Example: GHOST_CONTENT_KEY=... GHOST_ADMIN_KEY=... ghost-purge-images display'
];

function pick(override, fallback) {
  return override === undefined ? fallback : override;
}

function readArgv(argv = process.argv.slice(2), env = process.env) {
  const args = minimist(argv);
  return {
    url: args.url || args.URL || env.GHOST_URL || '',
    contentAPIKey: args['content-key'] || args.content_key || args.CONTENT_KEY || env.GHOST_CONTENT_KEY,
    adminAPIKey: args['admin-key'] || args.admin_key || args.ADMIN_KEY || env.GHOST_ADMIN_KEY
  };
}

function resolveOptions(overrides = {}, argv = process.argv.slice(2), env = process.env) {
  const args = readArgv(argv, env);
  return {
    url: pick(overrides.url, args.url),
    contentAPIKey: pick(overrides.contentAPIKey, args.contentAPIKey),
    adminAPIKey: pick(overrides.adminAPIKey, args.adminAPIKey)
  };
}

function missingKeysError(contentAPIKey, adminAPIKey) {
  const lines = [];
  if (!contentAPIKey) {
    lines.push('🔑 Required parameter CONTENT_KEY is missing!');
  }
  if (!adminAPIKey) {
    lines.push('🔑 Required parameter ADMIN_KEY is missing!');
  }
  if (!lines.length) {
    return null;
  }
  const error = new Error([...lines, ...KEY_HELP].join('\n'));
  error.code = 'MISSING_KEYS';
  return error;
}

function assertReady(overrides, argv, env) {
  const options = resolveOptions(overrides, argv, env);
  const error = missingKeysError(options.contentAPIKey, options.adminAPIKey);
  if (error) {
    throw error;
  }
  return options;
}

function readConfigUrl(cwd = process.cwd(), env = process.env) {
  const names = env.NODE_ENV === 'development'
    ? ['config.development.json', 'config.production.json']
    : ['config.production.json', 'config.development.json'];
  const errors = [];
  for (const name of names) {
    try {
      const raw = fs.readFileSync(path.join(cwd, name), 'utf8');
      const config = JSON.parse(raw);
      if (config && config.url) {
        return config.url;
      }
      errors.push(`${name} has no "url" property`);
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }
  throw new Error(`Error reading Ghost config (${names.join(' or ')}). ${errors.join('; ')}`);
}

function resolveUrl(customUrl, cwd, env) {
  const url = customUrl || readConfigUrl(cwd, env);
  return url.endsWith('/') ? url : `${url}/`;
}

function themesDirectory(argv = process.argv.slice(2)) {
  const args = minimist(argv);
  return args['themes-path'] || args.themes_path || args.THEMES_PATH || 'content/themes';
}

async function fetch(overrides, argv = process.argv.slice(2), env = process.env) {
  const options = assertReady(overrides, argv, env);
  const url = resolveUrl(options.url, undefined, env);
  const params = {
    url,
    adminAPIKey: options.adminAPIKey,
    contentAPIKey: options.contentAPIKey
  };
  const [
    authors,
    pages,
    posts,
    settings,
    tags,
    newsletters,
    adminSettings,
    themes,
    snippets,
    themeSettings,
    themeFiles
  ] = await Promise.all([
    Authors.list(params),
    Pages.list(params),
    Posts.list(params),
    Settings.list(params),
    Tags.list(params),
    Newsletters.list(params),
    Settings.listAdmin(params),
    Settings.listThemes(params),
    Snippets.list(params),
    ThemeSettings.list(params),
    ThemeFiles.read(themesDirectory(argv))
  ]);
  const incomplete = [
    authors,
    tags,
    newsletters,
    adminSettings,
    themes,
    snippets,
    themeSettings,
    themeFiles
  ].map(readBlock).filter(Boolean);
  return {
    authors,
    pages,
    posts,
    settings,
    tags,
    newsletters,
    adminSettings,
    themes,
    snippets,
    themeSettings,
    themeFiles,
    incomplete
  };
}

module.exports = {
  assertReady,
  fetch,
  readConfigUrl,
  resolveOptions
};
