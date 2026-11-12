const core = require('./lib/core');
const { confirmPurge } = require('./lib/confirmPurge');
const { runCommand } = require('./lib/runCommand');

function run(options = {}) {
  const confirm = options.confirm || confirmPurge;
  return runCommand(async(unused) => {
    if (unused.incomplete && unused.incomplete.length > 0) {
      return core.purge(unused);
    }
    if (options.ask && unused.list.length > 0) {
      const accepted = await confirm(unused.list.length);
      if (!accepted) {
        console.log('Purge cancelled. No files were deleted.');
        return { failed: false };
      }
    }
    return core.purge(unused);
  });
}

module.exports = {
  run
};
