const client = require('../../lib/ghost/client');

function mockGetJson(handler) {
  const original = client.getJson;
  client.getJson = handler;
  return function restore() {
    client.getJson = original;
  };
}

module.exports = {
  mockGetJson
};
