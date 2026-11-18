const argv = require('minimist')(process.argv.slice(2));
const core = require('./lib/core');
const { confirmPurge } = require('./lib/confirmPurge');
const { reportError } = require('./lib/reportError');
const { resolveArchiveDir } = require('./lib/archive');

async function run(options = {}) {
  const confirm = options.confirm || confirmPurge;
  let failed = false;
  try {
    const startTime = Date.now();
    const from = options.from || argv.from || null;
    const archiveDir = resolveArchiveDir({
      from,
      backupPath: options.backupPath,
      quarantinePath: options.quarantinePath
    });
    if (options.ask) {
      const accepted = await confirm(0, {
        prompt: `Restore files from ${archiveDir}? Type yes to continue: `
      });
      if (!accepted) {
        console.log('Restore cancelled. No files were written.');
        process.exit(0);
        return;
      }
    }
    const outcome = await core.restore({
      from: archiveDir,
      backupPath: options.backupPath,
      quarantinePath: options.quarantinePath
    });
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
  run
};
