const expect = require('chai').expect;
const Authors = require('../../lib/ghost/authors');
const Tags = require('../../lib/ghost/tags');
const Newsletters = require('../../lib/ghost/newsletters');
const Settings = require('../../lib/ghost/settings');
const Snippets = require('../../lib/ghost/snippets');
const ThemeSettings = require('../../lib/ghost/themeSettings');
const { mockGetJson } = require('../support/mockClient');

const params = {
  url: 'https://blog.example/',
  authToken: 'token',
  contentAPIKey: 'content-key'
};

function httpError(status) {
  const error = new Error(`status ${status}`);
  error.response = { status };
  return error;
}

function emptyPage(resourceKey, item) {
  return {
    [resourceKey]: item ? [item] : [],
    meta: { pagination: { page: 1, limit: 100, pages: item ? 1 : 0, total: item ? 1 : 0 } }
  };
}

describe('optional Ghost resources', () => {
  it('blocks deletion data when admin users cannot be read', async () => {
    const urls = [];
    const restore = mockGetJson(async (url) => {
      urls.push(url);
      if (url.includes('/admin/users/')) {
        throw httpError(403);
      }
      return emptyPage('authors', { profile_image: null });
    });
    try {
      const authors = await Authors.list(params);
      expect(authors).to.deep.equal([]);
      expect(authors.blocked).to.deep.equal({ resource: 'users', status: 403 });
      expect(urls).to.deep.equal([
        'https://blog.example/ghost/api/admin/users/?limit=100&page=1'
      ]);
    } finally {
      restore();
    }
  });

  it('uses the Content API when the admin users endpoint does not exist', async () => {
    const urls = [];
    const restore = mockGetJson(async (url) => {
      urls.push(url);
      if (url.includes('/admin/users/')) {
        throw httpError(404);
      }
      return emptyPage('authors', { profile_image: null });
    });
    try {
      const authors = await Authors.list(params);
      expect(authors).to.deep.equal([{ profile_image: null }]);
      expect(authors.blocked).to.equal(undefined);
      expect(urls[0]).to.include('/ghost/api/admin/users/');
      expect(urls[1]).to.equal('https://blog.example/ghost/api/content/authors/?limit=100&page=1&key=content-key');
      expect(urls[1]).to.not.include('fields=');
    } finally {
      restore();
    }
  });

  it('does not fall back when the admin token is rejected', async () => {
    let calls = 0;
    const restore = mockGetJson(async () => {
      calls += 1;
      throw httpError(401);
    });
    try {
      await Authors.list(params);
      expect.fail('expected the admin error to propagate');
    } catch (err) {
      expect(err.response.status).to.equal(401);
      expect(calls).to.equal(1);
    } finally {
      restore();
    }
  });

  it('falls back to content tags without a fields filter', async () => {
    const urls = [];
    const restore = mockGetJson(async (url) => {
      urls.push(url);
      if (url.includes('/admin/tags/')) {
        throw httpError(404);
      }
      return emptyPage('tags');
    });
    try {
      const tags = await Tags.list(params);
      expect(tags).to.deep.equal([]);
      expect(urls[1]).to.equal('https://blog.example/ghost/api/content/tags/?limit=100&page=1&key=content-key');
      expect(urls[1]).to.not.include('fields=');
    } finally {
      restore();
    }
  });

  it('treats a missing newsletters endpoint as an empty list', async () => {
    const restore = mockGetJson(async () => {
      throw httpError(404);
    });
    try {
      expect(await Newsletters.list(params)).to.deep.equal([]);
    } finally {
      restore();
    }
  });

  it('blocks the scan when newsletters cannot be read', async () => {
    const restore = mockGetJson(async () => {
      throw httpError(403);
    });
    try {
      const newsletters = await Newsletters.list(params);
      expect(newsletters).to.deep.equal([]);
      expect(newsletters.blocked).to.deep.equal({ resource: 'newsletters', status: 403 });
    } finally {
      restore();
    }
  });

  it('returns no admin settings when that endpoint is unavailable', async () => {
    const restore = mockGetJson(async () => {
      throw httpError(403);
    });
    try {
      const settings = await Settings.listAdmin(params);
      const themes = await Settings.listThemes(params);
      expect(settings).to.deep.equal([]);
      expect(settings.blocked).to.deep.equal({ resource: 'admin settings', status: 403 });
      expect(themes.blocked).to.deep.equal({ resource: 'themes', status: 403 });
    } finally {
      restore();
    }
  });

  it('treats a missing snippets endpoint as an empty list', async () => {
    const restore = mockGetJson(async () => {
      throw httpError(404);
    });
    try {
      expect(await Snippets.list(params)).to.deep.equal([]);
    } finally {
      restore();
    }
  });

  it('blocks the scan when snippets cannot be read', async () => {
    const urls = [];
    const restore = mockGetJson(async (url) => {
      urls.push(url);
      throw httpError(403);
    });
    try {
      const snippets = await Snippets.list(params);
      expect(snippets).to.deep.equal([]);
      expect(snippets.blocked).to.deep.equal({ resource: 'snippets', status: 403 });
      expect(urls[0]).to.include('formats=mobiledoc,lexical');
      expect(urls[0]).to.not.include('html');
    } finally {
      restore();
    }
  });

  it('blocks the scan when custom theme settings cannot be read', async () => {
    const restore = mockGetJson(async () => {
      throw httpError(422);
    });
    try {
      const settings = await ThemeSettings.list(params);
      expect(settings).to.deep.equal([]);
      expect(settings.blocked).to.deep.equal({ resource: 'custom theme settings', status: 422 });
    } finally {
      restore();
    }
  });

  it('returns no custom theme settings when that endpoint does not exist', async () => {
    const restore = mockGetJson(async () => {
      throw httpError(404);
    });
    try {
      const settings = await ThemeSettings.list(params);
      expect(settings).to.deep.equal([]);
      expect(settings.blocked).to.equal(undefined);
    } finally {
      restore();
    }
  });

  it('rejects a custom theme settings response without the collection', async () => {
    const restore = mockGetJson(async () => ({ settings: [] }));
    try {
      await ThemeSettings.list(params);
      expect.fail('expected an invalid response');
    } catch (err) {
      expect(err.message).to.include('Custom theme settings API - Not valid response');
    } finally {
      restore();
    }
  });

  it('scans admin settings when Ghost returns an object', async () => {
    const restore = mockGetJson(async () => ({
      settings: { logo: 'https://blog.example/content/images/2024/01/logo.png' }
    }));
    try {
      const settings = await Settings.listAdmin(params);
      expect(Settings.isBeingUsed(
        { path: '/var/www/ghost/content/images/2024/01/logo.png' },
        settings
      )).to.equal(true);
    } finally {
      restore();
    }
  });
});
