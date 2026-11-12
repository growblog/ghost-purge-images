#!/usr/bin/env node

const display = require('../display');
const purge = require('../purge');

function printHelp() {
  console.log(`Usage:
  ghost-purge-images display
  ghost-purge-images purge [--yes]
  ghost-purge-images --help

Environment:
  GHOST_CONTENT_KEY   Content API key
  GHOST_ADMIN_KEY     Admin API key
  GHOST_URL           Blog URL when config.production.json is not used

Do not pass API keys as arguments. They are saved in shell history and shown by ps.

Flags:
  --yes               Delete without asking
  --url               Blog URL
  --images-path       Defaults to content/images
  --media-path        Defaults to content/media
  --themes-path       Defaults to content/themes
  --exclude-ext       Comma-separated extensions to keep
  --fix-permissions   sudo rm only the unused files inside the upload folders

On a terminal, purge asks you to type yes. Add --yes for a script.
Without --url, the command reads config.production.json, then config.development.json.`);
}

function main(argv = process.argv.slice(2)) {
  if (!argv || argv.length === 0) {
    console.log('Please provide a command. Run ghost-purge-images --help');
    process.exit(1);
  }

  const [command] = argv;
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }
  if (command === 'purge') {
    return purge.run({ ask: true });
  }
  if (command === 'display') {
    return display.run();
  }

  console.log(`Command '${command}' not found. Run ghost-purge-images --help`);
  process.exit(1);
}

if (require.main === module) {
  process.title = 'ghost-purge-images';
  main();
}

module.exports = {
  main,
  printHelp
};
