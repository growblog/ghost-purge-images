const client = require('./client');
const { adminUrl } = require('./api');
const auth = require('./auth');
const {
  isIncompleteRead, isNotFound, markBlocked, statusOf
} = require('./optional');

function invalid(body) {
  return new Error(`Custom theme settings API - Not valid response: ${JSON.stringify(body)}`);
}

async function list(params) {
  const { url } = params;
  try {
    const body = await client.getJson(adminUrl(url, 'custom_theme_settings'), {
      headers: auth.headersFor(params)()
    });
    if (!body || !Object.prototype.hasOwnProperty.call(body, 'custom_theme_settings')) {
      throw invalid(body);
    }
    const items = body.custom_theme_settings;
    if (items == null) {
      return [];
    }
    if (!Array.isArray(items)) {
      throw invalid(body);
    }
    return items;
  } catch (err) {
    if (isNotFound(err)) {
      return [];
    }
    if (isIncompleteRead(err)) {
      return markBlocked([], { resource: 'custom theme settings', status: statusOf(err) });
    }
    throw err;
  }
}

module.exports = {
  list
};
