const readline = require('readline');
const minimist = require('minimist');

function confirmedByFlag(argv = process.argv.slice(2)) {
  const args = minimist(argv);
  return Boolean(args.yes || args.y);
}

function confirmPurge(count, options = {}) {
  const argv = options.argv || process.argv.slice(2);
  const stdin = options.stdin || process.stdin;
  const stdout = options.stdout || process.stdout;
  if (confirmedByFlag(argv) || !stdin.isTTY) {
    return Promise.resolve(true);
  }
  const rl = readline.createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => {
    rl.question(`Delete ${count} files? Type yes to continue: `, (answer) => {
      rl.close();
      resolve(String(answer).trim().toLowerCase() === 'yes');
    });
  });
}

module.exports = {
  confirmPurge,
  confirmedByFlag
};
