const expect = require('chai').expect;
const Posts = require('../../lib/ghost/posts');
const Pages = require('../../lib/ghost/pages');
const Authors = require('../../lib/ghost/authors');
const Tags = require('../../lib/ghost/tags');
const { readCollection } = require('../../lib/ghost/collection');
const { mockGetJson } = require('../support/mockClient');

const params = {
  url: 'https://blog.example/',
  authToken: 'token',
  contentAPIKey: 'content-key'
};

const resources = [
  {
    name: 'posts',
    list: Posts.list,
    key: 'posts',
    expectAuth: true,
    url: 'https://blog.example/ghost/api/admin/posts/?limit=100&page=1&formats=html,mobiledoc,lexical'
  },
  {
    name: 'pages',
    list: Pages.list,
    key: 'pages',
    expectAuth: true,
    url: 'https://blog.example/ghost/api/admin/pages/?limit=100&page=1&formats=html,mobiledoc,lexical'
  },
  {
    name: 'authors',
    list: Authors.list,
    key: 'users',
    expectAuth: true,
    url: 'https://blog.example/ghost/api/admin/users/?limit=100&page=1'
  },
  {
    name: 'tags',
    list: Tags.list,
    key: 'tags',
    expectAuth: true,
    url: 'https://blog.example/ghost/api/admin/tags/?limit=100&page=1'
  }
];

function emptyBody(resourceKey) {
  return {
    [resourceKey]: [],
    meta: {
      pagination: {
        page: 1,
        limit: 100,
        pages: 0,
        total: 0
      }
    }
  };
}

describe('Ghost collection pages', () => {
  describe('readCollection()', () => {
    it('accepts 0 pages when the collection is empty', () => {
      const page = readCollection(emptyBody('posts'), 'posts', 'Posts');
      expect(page).to.deep.equal({ items: [], pages: 0 });
    });

    it('rejects 0 pages when the collection still contains items', () => {
      const body = emptyBody('posts');
      body.posts = [{ id: 'hidden' }];
      expect(() => readCollection(body, 'posts', 'Posts')).to.throw('Posts API - Not valid response');
    });

    it('rejects a body without pagination', () => {
      expect(() => readCollection({ posts: [] }, 'posts', 'Posts')).to.throw('Posts API - Not valid response');
    });
  });

  resources.forEach((resource) => {
    it(`returns no ${resource.name} when the API reports 0 pages`, async () => {
      const calls = [];
      const restore = mockGetJson(async (url, config) => {
        calls.push({ url, config });
        return emptyBody(resource.key);
      });
      try {
        const output = await resource.list(params);
        expect(output).to.deep.equal([]);
        expect(calls).to.have.length(1);
        expect(calls[0].url).to.equal(resource.url);
        expect(calls[0].config.headers.Authorization).to.equal('Ghost token');
        expect(calls[0].config.headers['Accept-Version']).to.equal('v6.0');
      } finally {
        restore();
      }
    });
  });

  it('requests every post page reported by the API', async () => {
    const urls = [];
    const restore = mockGetJson(async (url) => {
      urls.push(url);
      const page = Number(new URL(url).searchParams.get('page'));
      return {
        posts: [{ id: page }],
        meta: { pagination: { page, pages: 2, limit: 100, total: 2 } }
      };
    });
    try {
      const posts = await Posts.list(params);
      expect(posts.map((post) => post.id)).to.deep.equal([1, 2]);
      expect(urls).to.have.length(2);
      expect(urls[1]).to.include('page=2');
    } finally {
      restore();
    }
  });

  it('signs a fresh admin token for every page', async () => {
    const auth = require('../../lib/ghost/auth');
    const original = auth.getToken;
    const tokens = [];
    auth.getToken = () => {
      const token = `fresh-${tokens.length}`;
      tokens.push(token);
      return token;
    };
    const headers = [];
    const restore = mockGetJson(async (url, config) => {
      headers.push(config.headers.Authorization);
      const page = Number(new URL(url).searchParams.get('page'));
      return {
        posts: [{ id: page }],
        meta: { pagination: { page, pages: 2, limit: 100, total: 2 } }
      };
    });
    try {
      const posts = await Posts.list({
        url: 'https://blog.example/',
        adminAPIKey: 'integration:abcd',
        contentAPIKey: 'content-key'
      });
      expect(posts.map((post) => post.id)).to.deep.equal([1, 2]);
      expect(tokens).to.deep.equal(['fresh-0', 'fresh-1']);
      expect(headers).to.deep.equal(['Ghost fresh-0', 'Ghost fresh-1']);
    } finally {
      auth.getToken = original;
      restore();
    }
  });
});
