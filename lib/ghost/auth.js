const jwt = require('jsonwebtoken');
const { adminHeaders } = require('./api');

function getToken(adminKey) {
  const [id, secret] = adminKey.split(':');
  return jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: '/admin/'
  });
}

function headersFor(params = {}) {
  return () => {
    const token = params.adminAPIKey
      ? module.exports.getToken(params.adminAPIKey)
      : params.authToken;
    return adminHeaders(token);
  };
}

module.exports = {
  getToken,
  headersFor
};
