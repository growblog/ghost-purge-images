const { fetchAllPages } = require('./collection');
const {
  adminUrl, contentHeaders, contentUrl
} = require('./api');
const auth = require('./auth');
const {
  isIncompleteRead, isNotFound, markBlocked, statusOf
} = require('./optional');
const { isReferencedBy } = require('./references');

function isBeingUsed(upload, authors) {
  return isReferencedBy(upload, authors);
}

async function listFromContent(params) {
  const { url, contentAPIKey } = params;
  return fetchAllPages({
    label: 'Authors',
    resourceKey: 'authors',
    getHeaders: contentHeaders,
    buildUrl(page) {
      return contentUrl(url, 'authors', `limit=100&page=${page}&key=${contentAPIKey}`);
    }
  });
}

async function list(params) {
  const { url } = params;
  try {
    return await fetchAllPages({
      label: 'Users',
      resourceKey: 'users',
      getHeaders: auth.headersFor(params),
      buildUrl(page) {
        return adminUrl(url, 'users', `limit=100&page=${page}`);
      }
    });
  } catch (err) {
    if (isNotFound(err)) {
      return listFromContent(params);
    }
    if (isIncompleteRead(err)) {
      return markBlocked([], { resource: 'users', status: statusOf(err) });
    }
    throw err;
  }
}

module.exports = {
  isBeingUsed,
  list
};
