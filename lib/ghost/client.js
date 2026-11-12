const axios = require('axios');
const { GHOST_VERSION } = require('./api');

async function getJson(url, config = {}) {
  const response = await axios.get(url, {
    ...config,
    maxRedirects: 0,
    headers: {
      'Accept-Version': GHOST_VERSION,
      ...(config.headers || {})
    }
  });
  return response.data;
}

module.exports = {
  getJson
};
