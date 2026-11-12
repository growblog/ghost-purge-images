const core = require('./lib/core');
const { runCommand } = require('./lib/runCommand');

function run() {
  return runCommand((unused) => core.display(unused));
}

module.exports = {
  run
};
