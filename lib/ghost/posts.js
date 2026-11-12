const { fetchAllPages } = require('./collection');
const { adminUrl } = require('./api');
const auth = require('./auth');
const { isReferencedBy } = require('./references');

function isBeingUsed(upload, posts) {
  return isReferencedBy(upload, posts);
}

async function list(params) {
  const { url } = params;
  return fetchAllPages({
    label: 'Posts',
    resourceKey: 'posts',
    getHeaders: auth.headersFor(params),
    buildUrl(page) {
      return adminUrl(url, 'posts', `limit=100&page=${page}&formats=html,mobiledoc,lexical`);
    }
  });
}

module.exports = {
  isBeingUsed,
  list
};
