const { fetchAllPages } = require('./collection');
const {
  adminUrl, contentHeaders, contentUrl
} = require('./api');
const auth = require('./auth');
const {
  isIncompleteRead, isNotFound, markBlocked, statusOf
} = require('./optional');
const { isReferencedBy } = require('./references');

function isBeingUsed(upload, tags) {
  return isReferencedBy(upload, tags);
}

async function list(params) {
  const { url, contentAPIKey } = params;
  try {
    return await fetchAllPages({
      label: 'Tags',
      resourceKey: 'tags',
      getHeaders: auth.headersFor(params),
      buildUrl(page) {
        return adminUrl(url, 'tags', `limit=100&page=${page}`);
      }
    });
  } catch (err) {
    if (isNotFound(err)) {
      return fetchAllPages({
        label: 'Tags',
        resourceKey: 'tags',
        getHeaders: contentHeaders,
        buildUrl(page) {
          return contentUrl(url, 'tags', `limit=100&page=${page}&key=${contentAPIKey}`);
        }
      });
    }
    if (isIncompleteRead(err)) {
      return markBlocked([], { resource: 'tags', status: statusOf(err) });
    }
    throw err;
  }
}

module.exports = {
  isBeingUsed,
  list
};
