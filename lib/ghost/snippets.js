const { fetchAllPages } = require('./collection');
const { adminUrl } = require('./api');
const auth = require('./auth');
const {
  isIncompleteRead, isNotFound, markBlocked, statusOf
} = require('./optional');

async function list(params) {
  const { url } = params;
  try {
    return await fetchAllPages({
      label: 'Snippets',
      resourceKey: 'snippets',
      getHeaders: auth.headersFor(params),
      buildUrl(page) {
        return adminUrl(url, 'snippets', `limit=100&page=${page}&formats=mobiledoc,lexical`);
      }
    });
  } catch (err) {
    if (isNotFound(err)) {
      return [];
    }
    if (isIncompleteRead(err)) {
      return markBlocked([], { resource: 'snippets', status: statusOf(err) });
    }
    throw err;
  }
}

module.exports = {
  list
};
