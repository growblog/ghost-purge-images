const client = require('./client');
const { adminUrl, contentHeaders, contentUrl } = require('./api');
const auth = require('./auth');
const {
  isIncompleteRead, isNotFound, markBlocked, statusOf
} = require('./optional');
const { isReferencedBy } = require('./references');

function isBeingUsed(upload, settings) {
  return isReferencedBy(upload, settings);
}

async function list(params) {
  const { url, contentAPIKey } = params;
  const apiUrl = contentUrl(url, 'settings', `key=${contentAPIKey}`);
  const body = await client.getJson(apiUrl, { headers: contentHeaders() });
  if (!body || !body.settings) {
    throw new Error(`Settings API - Not valid response: ${JSON.stringify(body)}`);
  }
  return body.settings;
}

async function listAdmin(params) {
  const { url } = params;
  try {
    const body = await client.getJson(adminUrl(url, 'settings'), {
      headers: auth.headersFor(params)()
    });
    if (!body || body.settings == null) {
      return [];
    }
    return Array.isArray(body.settings) ? body.settings : [body.settings];
  } catch (err) {
    if (isNotFound(err)) {
      return [];
    }
    if (isIncompleteRead(err)) {
      return markBlocked([], { resource: 'admin settings', status: statusOf(err) });
    }
    throw err;
  }
}

async function listThemes(params) {
  const { url } = params;
  try {
    const body = await client.getJson(adminUrl(url, 'themes'), {
      headers: auth.headersFor(params)()
    });
    return body || {};
  } catch (err) {
    if (isNotFound(err)) {
      return {};
    }
    if (isIncompleteRead(err)) {
      return markBlocked({}, { resource: 'themes', status: statusOf(err) });
    }
    throw err;
  }
}

module.exports = {
  isBeingUsed,
  list,
  listAdmin,
  listThemes
};
