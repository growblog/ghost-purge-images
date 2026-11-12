function statusOf(err) {
  return err && err.response && err.response.status;
}

function isNotFound(err) {
  return statusOf(err) === 404;
}

function isIncompleteRead(err) {
  const status = statusOf(err);
  return status === 403 || status === 422;
}

function markBlocked(value, blocked) {
  Object.defineProperty(value, 'blocked', {
    value: blocked,
    enumerable: false
  });
  return value;
}

function readBlock(value) {
  return value && value.blocked ? value.blocked : null;
}

module.exports = {
  isIncompleteRead,
  isNotFound,
  markBlocked,
  readBlock,
  statusOf
};
