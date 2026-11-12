const fs = require('fs');
const os = require('os');
const path = require('path');
const expect = require('chai').expect;
const themeFiles = require('../../lib/ghost/themeFiles');

function tempTheme() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-theme-'));
}

describe('lib/ghost/themeFiles', () => {
  it('reads template text and skips node_modules', async () => {
    const dir = tempTheme();
    fs.writeFileSync(path.join(dir, 'default.hbs'), '<img src="/content/images/logo.png">');
    fs.mkdirSync(path.join(dir, 'assets'));
    fs.writeFileSync(path.join(dir, 'assets', 'screen.css'), 'body{background:url(/content/images/bg.jpg)}');
    fs.mkdirSync(path.join(dir, 'node_modules', 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'node_modules', 'pkg', 'index.js'), '/content/images/secret.png');
    fs.symlinkSync(
      path.join(dir, 'default.hbs'),
      path.join(dir, 'node_modules', 'pkg', 'linked.hbs')
    );
    try {
      const texts = await themeFiles.read(dir);
      const joined = texts.join('\n');
      expect(joined).to.include('/content/images/logo.png');
      expect(joined).to.include('/content/images/bg.jpg');
      expect(joined).to.not.include('secret.png');
      expect(texts.blocked).to.equal(undefined);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports a missing directory', async () => {
    const missing = await themeFiles.read(path.join(os.tmpdir(), 'ghost-theme-missing'));
    expect(missing).to.deep.equal([]);
    expect(missing.blocked).to.deep.equal({ resource: 'theme files', status: 'missing' });
  });

  it('reads a theme directory that is a symlink', async () => {
    const theme = tempTheme();
    const root = tempTheme();
    fs.writeFileSync(path.join(theme, 'default.hbs'), '<img src="/content/images/linked.png">');
    fs.mkdirSync(path.join(theme, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(theme, 'node_modules', 'index.js'), '/content/images/secret.png');
    fs.symlinkSync(theme, path.join(root, 'casper'));
    fs.symlinkSync(root, path.join(root, 'cycle'));
    try {
      const texts = await themeFiles.read(root);
      const joined = texts.join('\n');
      expect(joined).to.include('/content/images/linked.png');
      expect(joined).to.not.include('secret.png');
      expect(texts.blocked).to.equal(undefined);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(theme, { recursive: true, force: true });
    }
  });

  it('stops when a template is a symlink', async () => {
    const dir = tempTheme();
    const outside = path.join(dir, 'outside.hbs');
    fs.writeFileSync(outside, '<img src="/content/images/outside.png">');
    fs.mkdirSync(path.join(dir, 'partials'));
    fs.symlinkSync(outside, path.join(dir, 'partials', 'linked.hbs'));
    try {
      const texts = await themeFiles.read(dir);
      expect(texts).to.deep.equal([]);
      expect(texts.blocked).to.deep.equal({ resource: 'theme files', status: 'symlink' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('stops when a template is too large to read safely', async () => {
    const dir = tempTheme();
    fs.writeFileSync(path.join(dir, 'default.hbs'), '<img src="/content/images/logo.png">');
    try {
      const texts = await themeFiles.read(dir, { maxBytes: 4 });
      expect(texts.blocked).to.deep.equal({ resource: 'theme files', status: 'too large' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
