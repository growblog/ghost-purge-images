const posts = require('./posts');
const { fetchAllPages } = require('./collection');
const { adminUrl } = require('./api');
const auth = require('./auth');

function isBeingUsed(upload, pages) {
  // Pages have same properties as posts
  // Then use the same function
  // Doc: https://docs.ghost.org/api/content/#pages
  return posts.isBeingUsed(upload, pages);
}

async function list(params) {
  const { url } = params;
  return fetchAllPages({
    label: 'Pages',
    resourceKey: 'pages',
    getHeaders: auth.headersFor(params),
    buildUrl(page) {
      return adminUrl(url, 'pages', `limit=100&page=${page}&formats=html,mobiledoc,lexical`);
    }
  });
}

module.exports = {
  isBeingUsed,
  list
};
