function reportError(err) {
  if (err && err.code === 'MISSING_KEYS') {
    console.log(err.message);
    return;
  }
  console.log(`❌ Error: ${err}`);
}

module.exports = {
  reportError
};
