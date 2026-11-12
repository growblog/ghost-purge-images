const fs = require('fs');
const os = require('os');
const path = require('path');
const expect = require('chai').expect;
const content = require('../../lib/ghost/content');
const core = require('../../lib/core');
const { mockGetJson } = require('../support/mockClient');

const adminAPIKey = `integration:${'ab'.repeat(32)}`;
const options = {
  url: 'https://blog.example',
  contentAPIKey: 'content-key',
  adminAPIKey
};

function resourceName(url) {
  if (url.includes('/custom_theme_settings/')) return 'customThemeSettings';
  if (url.includes('/admin/settings/')) return 'adminSettings';
  if (url.includes('/content/settings/')) return 'settings';
  if (url.includes('/themes/')) return 'themes';
  if (url.includes('/newsletters/')) return 'newsletters';
  if (url.includes('/snippets/')) return 'snippets';
  if (url.includes('/users/')) return 'users';
  if (url.includes('/authors/')) return 'authors';
  if (url.includes('/tags/')) return 'tags';
  if (url.includes('/posts/')) return 'posts';
  if (url.includes('/pages/')) return 'pages';
  return 'unknown';
}

function emptyThemesArgv() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-themes-'));
  return {
    argv: ['--themes-path', dir],
    dir,
    cleanup() {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

function bodyFor(url) {
  const name = resourceName(url);
  if (name === 'settings') {
    return {
      settings: {
        logo: 'https://blog.example/content/images/2024/01/logo.png',
        icon: null,
        cover_image: null,
        og_image: null,
        twitter_image: null,
        codeinjection_head: null,
        codeinjection_foot: null
      }
    };
  }
  if (name === 'adminSettings') return { settings: [] };
  if (name === 'customThemeSettings') return { custom_theme_settings: [] };
  if (name === 'themes') return { themes: [] };
  return emptyCollection(name);
}

function emptyCollection(resourceKey) {
  return {
    [resourceKey]: [],
    meta: { pagination: { page: 1, limit: 100, pages: 0, total: 0 } }
  };
}

describe('lib/ghost/content', () => {
  describe('assertReady()', () => {
    it('throws before any request when a key is missing', () => {
      expect(() => content.assertReady({ contentAPIKey: 'only-content' }, [], {}))
        .to.throw('ADMIN_KEY')
        .with.property('code', 'MISSING_KEYS');
    });

    it('accepts keys from the environment instead of argv', () => {
      const options = content.resolveOptions({}, [], {
        GHOST_CONTENT_KEY: 'content-from-env',
        GHOST_ADMIN_KEY: 'admin-from-env'
      });
      expect(options.contentAPIKey).to.equal('content-from-env');
      expect(options.adminAPIKey).to.equal('admin-from-env');
    });

    it('names every missing key', () => {
      try {
        content.assertReady({}, [], {});
        expect.fail('expected a missing key error');
      } catch (err) {
        expect(err.code).to.equal('MISSING_KEYS');
        expect(err.message).to.include('CONTENT_KEY');
        expect(err.message).to.include('ADMIN_KEY');
      }
    });
  });

  describe('fetch()', () => {
    it('does not call Ghost when a key is missing', async () => {
      let called = false;
      const restore = mockGetJson(async () => {
        called = true;
        return {};
      });
      try {
        await content.fetch({ url: 'https://blog.example', contentAPIKey: 'only-content' }, [], {});
        expect.fail('expected a missing key error');
      } catch (err) {
        expect(err.code).to.equal('MISSING_KEYS');
        expect(called).to.equal(false);
      } finally {
        restore();
      }
    });

    it('reads config.development.json when that is the Ghost environment', () => {
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-config-'));
      fs.writeFileSync(path.join(dir, 'config.development.json'), JSON.stringify({
        url: 'https://dev.example'
      }));
      fs.writeFileSync(path.join(dir, 'config.production.json'), JSON.stringify({
        url: 'https://prod.example'
      }));
      try {
        expect(content.readConfigUrl(dir, { NODE_ENV: 'development' })).to.equal('https://dev.example');
        expect(content.readConfigUrl(dir, { NODE_ENV: 'production' })).to.equal('https://prod.example');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('throws when config.production.json is missing and no url was given', async () => {
      let called = false;
      const restore = mockGetJson(async () => {
        called = true;
        return {};
      });
      try {
        await content.fetch({ contentAPIKey: 'content-key', adminAPIKey }, [], {});
        expect.fail('expected a config error');
      } catch (err) {
        expect(err.message).to.include('config.production.json');
        expect(called).to.equal(false);
      } finally {
        restore();
      }
    });

    it('keeps referenced files when every paginated API returns 0 pages', async () => {
      const urls = [];
      const restore = mockGetJson(async (url) => {
        urls.push(url);
        return bodyFor(url);
      });

      const logo = {
        path: '/var/www/ghost/content/images/2024/01/logo.png',
        size: 20
      };
      const orphan = {
        path: '/var/www/ghost/content/images/2024/01/orphan.png',
        size: 8
      };

      const themes = emptyThemesArgv();
      try {
        const fetched = await content.fetch(options, themes.argv);
        const unused = core.filterUnused({
          uploads: [logo, orphan],
          content: fetched
        });
        const calls = urls.reduce((counts, url) => {
          const name = resourceName(url);
          counts[name] = (counts[name] || 0) + 1;
          return counts;
        }, {});

        expect(fetched.posts).to.deep.equal([]);
        expect(fetched.pages).to.deep.equal([]);
        expect(fetched.authors).to.deep.equal([]);
        expect(fetched.tags).to.deep.equal([]);
        expect(calls).to.deep.equal({
          adminSettings: 1,
          customThemeSettings: 1,
          newsletters: 1,
          pages: 1,
          posts: 1,
          settings: 1,
          snippets: 1,
          tags: 1,
          themes: 1,
          users: 1
        });
        expect(urls.some((url) => url.includes('page=2'))).to.equal(false);
        expect(unused.list).to.deep.equal([orphan]);
        expect(unused.totalSpace).to.equal(8);
        expect(unused.totalUploads).to.equal(2);
        expect(fetched.incomplete).to.deep.equal([]);
        expect(unused.incomplete).to.deep.equal([]);
      } finally {
        themes.cleanup();
        restore();
      }
    });

    it('records an incomplete scan when newsletters cannot be read', async () => {
      const restore = mockGetJson(async (url) => {
        if (resourceName(url) === 'newsletters') {
          const error = new Error('forbidden');
          error.response = { status: 403 };
          throw error;
        }
        return bodyFor(url);
      });
      const themes = emptyThemesArgv();
      try {
        const fetched = await content.fetch(options, themes.argv);
        const unused = core.filterUnused({
          uploads: [{
            path: '/var/www/ghost/content/images/2024/01/orphan.png',
            size: 8
          }],
          content: fetched
        });
        expect(fetched.posts).to.deep.equal([]);
        expect(fetched.incomplete).to.deep.equal([{ resource: 'newsletters', status: 403 }]);
        expect(unused.incomplete).to.deep.equal(fetched.incomplete);
        expect(unused.list).to.have.length(1);
      } finally {
        themes.cleanup();
        restore();
      }
    });

    it('throws when settings are missing so purge cannot run', async () => {
      const restore = mockGetJson(async (url) => {
        if (resourceName(url) === 'settings') return {};
        return bodyFor(url);
      });
      try {
        await content.fetch(options, []);
        expect.fail('expected an invalid settings response');
      } catch (err) {
        expect(err.message).to.include('Settings API - Not valid response');
      } finally {
        restore();
      }
    });

    it('keeps images used by a snippet or a custom theme setting', async () => {
      const urls = [];
      const restore = mockGetJson(async (url) => {
        urls.push(url);
        const name = resourceName(url);
        if (name === 'snippets') {
          return {
            snippets: [{
              lexical: '{"src":"https://blog.example/content/images/2024/01/snippet.png"}'
            }],
            meta: { pagination: { page: 1, limit: 100, pages: 1, total: 1 } }
          };
        }
        if (name === 'customThemeSettings') {
          return {
            custom_theme_settings: [{
              key: 'logo_image',
              value: 'https://blog.example/content/images/2024/01/theme-logo.png'
            }]
          };
        }
        return bodyFor(url);
      });
      const themes = emptyThemesArgv();
      try {
        const fetched = await content.fetch(options, themes.argv);
        const unused = core.filterUnused({
          uploads: [
            { path: '/var/www/ghost/content/images/2024/01/snippet.png', size: 2 },
            { path: '/var/www/ghost/content/images/2024/01/theme-logo.png', size: 3 },
            { path: '/var/www/ghost/content/images/2024/01/orphan.png', size: 4 }
          ],
          content: fetched
        });
        const snippetUrl = urls.find((url) => url.includes('/snippets/'));
        expect(snippetUrl).to.include('formats=mobiledoc,lexical');
        expect(snippetUrl).to.not.include('html');
        expect(unused.list.map((file) => file.path)).to.deep.equal([
          '/var/www/ghost/content/images/2024/01/orphan.png'
        ]);
        expect(fetched.incomplete).to.deep.equal([]);
      } finally {
        themes.cleanup();
        restore();
      }
    });

    it('keeps an image referenced only from a theme template', async () => {
      const restore = mockGetJson(async (url) => bodyFor(url));
      const themes = emptyThemesArgv();
      fs.writeFileSync(path.join(themes.dir, 'default.hbs'), [
        '<img src="https://blog.example/content/images/2024/01/theme.png">'
      ].join(''));
      try {
        const fetched = await content.fetch(options, themes.argv);
        const unused = core.filterUnused({
          uploads: [
            { path: '/var/www/ghost/content/images/2024/01/theme.png', size: 2 },
            { path: '/var/www/ghost/content/images/2024/01/orphan.png', size: 4 }
          ],
          content: fetched
        });
        expect(unused.list.map((file) => file.path)).to.deep.equal([
          '/var/www/ghost/content/images/2024/01/orphan.png'
        ]);
        expect(fetched.incomplete).to.deep.equal([]);
      } finally {
        themes.cleanup();
        restore();
      }
    });

    it('blocks the scan when the themes directory is missing', async () => {
      const restore = mockGetJson(async (url) => bodyFor(url));
      try {
        const fetched = await content.fetch(options, [
          '--themes-path',
          path.join(os.tmpdir(), 'ghost-themes-missing')
        ]);
        expect(fetched.incomplete).to.deep.equal([
          { resource: 'theme files', status: 'missing' }
        ]);
      } finally {
        restore();
      }
    });
  });
});
