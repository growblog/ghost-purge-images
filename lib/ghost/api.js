const GHOST_VERSION = 'v6.0';

function adminHeaders(authToken) {
  return {
    Authorization: `Ghost ${authToken}`,
    'Accept-Version': GHOST_VERSION
  };
}

function contentHeaders() {
  return {
    'Accept-Version': GHOST_VERSION
  };
}

function apiUrl(base, api, resource, query) {
  const path = `${base}ghost/api/${api}/${resource}/`;
  return query ? `${path}?${query}` : path;
}

function adminUrl(base, resource, query) {
  return apiUrl(base, 'admin', resource, query);
}

function contentUrl(base, resource, query) {
  return apiUrl(base, 'content', resource, query);
}

module.exports = {
  GHOST_VERSION,
  adminHeaders,
  adminUrl,
  contentHeaders,
  contentUrl
};
