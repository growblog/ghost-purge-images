const ghost = require('./ghost');
const core = require('./core');
const { reportError } = require('./reportError');

async function runCommand(handleUnused) {
  let failed = false;
  try {
    const startTime = Date.now();
    ghost.content.assertReady();
    const [uploads, content] = await Promise.all([
      ghost.uploads.list(),
      ghost.content.fetch()
    ]);
    const unused = core.filterUnused({ uploads, content });
    const outcome = await handleUnused(unused);
    console.log(`⏱  Completed in ${(Date.now() - startTime) / 1000}s`);
    failed = Boolean(outcome && outcome.failed);
  } catch (err) {
    reportError(err);
    process.exit(1);
    return;
  }
  process.exit(failed ? 1 : 0);
}

module.exports = {
  runCommand
};
