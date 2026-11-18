const core = require('./lib/core');
const { confirmPurge } = require('./lib/confirmPurge');
const { runCommand } = require('./lib/runCommand');

function run(options = {}) {
  const confirm = options.confirm || confirmPurge;
  return runCommand(async(unused) => {
    if (unused.incomplete && unused.incomplete.length > 0) {
      return core.backup(unused, options);
    }
    if (options.ask && unused.list.length > 0) {
      const accepted = await confirm(unused.list.length, {
        prompt: `Backup ${unused.list.length} unused files? Type yes to continue: `
      });
      if (!accepted) {
        console.log('Backup cancelled. No files were copied.');
        return { failed: false };
      }
    }
    return core.backup(unused, options);
  });
}

module.exports = {
  run
};
