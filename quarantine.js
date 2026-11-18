const core = require('./lib/core');
const { confirmPurge } = require('./lib/confirmPurge');
const { runCommand } = require('./lib/runCommand');

function run(options = {}) {
  const confirm = options.confirm || confirmPurge;
  return runCommand(async(unused) => {
    if (unused.incomplete && unused.incomplete.length > 0) {
      return core.quarantine(unused, options);
    }
    if (options.ask && unused.list.length > 0) {
      const accepted = await confirm(unused.list.length, {
        prompt: `Move ${unused.list.length} unused files to quarantine? Type yes to continue: `
      });
      if (!accepted) {
        console.log('Quarantine cancelled. No files were moved.');
        return { failed: false };
      }
    }
    return core.quarantine(unused, options);
  });
}

module.exports = {
  run
};
