const expect = require('chai').expect;
const axios = require('axios');
const client = require('../../lib/ghost/client');
const { GHOST_VERSION } = require('../../lib/ghost/api');

describe('lib/ghost/client', () => {
  const originalGet = axios.get;

  afterEach(() => {
    axios.get = originalGet;
  });

  it('sends the Ghost 6 version and does not follow redirects', async () => {
    let captured;
    axios.get = async (url, config) => {
      captured = { url, config };
      return { data: { ok: true } };
    };

    const body = await client.getJson('https://blog.example/ghost/api/admin/posts/', {
      headers: { Authorization: 'Ghost token' }
    });

    expect(body).to.deep.equal({ ok: true });
    expect(captured.url).to.equal('https://blog.example/ghost/api/admin/posts/');
    expect(captured.config.maxRedirects).to.equal(0);
    expect(captured.config.headers['Accept-Version']).to.equal(GHOST_VERSION);
    expect(captured.config.headers.Authorization).to.equal('Ghost token');
    expect(GHOST_VERSION).to.equal('v6.0');
  });
});
