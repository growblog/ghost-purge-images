#!/usr/bin/env node

const display = require('../display');
const purge = require('../purge');
const backup = require('../backup');
const quarantine = require('../quarantine');
const restore = require('../restore');

function printHelp() {
  console.log(`Usage:
  ghost-purge-images display
  ghost-purge-images backup [--yes]
  ghost-purge-images quarantine [--yes]
  ghost-purge-images restore [--from=DIR] [--yes]
  ghost-purge-images purge [--yes]
  ghost-purge-images --help

Environment:
  GHOST_CONTENT_KEY   Content API key
  GHOST_ADMIN_KEY     Admin API key
  GHOST_URL           Blog URL when config.production.json is not used

Do not pass API keys as arguments. They are saved in shell history and shown by ps.

Flags:
  --yes               Continue without asking
  --url               Blog URL
  --images-path       Defaults to content/images
  --media-path        Defaults to content/media
  --themes-path       Defaults to content/themes
  --exclude-ext       Comma-separated extensions to keep
  --fix-permissions   sudo rm only the unused files inside the upload folders
  --backup-path       Parent folder for backup archives (default content/ghost-purge-backup)
  --quarantine-path   Parent folder for quarantine archives (default content/ghost-purge-quarantine)
  --from              Archive folder to restore (defaults to the latest backup or quarantine)

Commands:
  display      List unused uploads without changing files
  backup       Copy unused uploads into a timestamped archive
  quarantine   Move unused uploads into a timestamped archive (#21)
  restore      Copy files from a backup or quarantine archive back to their original paths
  purge        Delete unused uploads permanently

On a terminal, destructive commands ask you to type yes. Add --yes for a script.
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
  if (command === 'backup') {
    return backup.run({ ask: true });
  }
  if (command === 'quarantine') {
    return quarantine.run({ ask: true });
  }
  if (command === 'restore') {
    return restore.run({ ask: true });
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
