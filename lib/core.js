/* eslint-disable no-await-in-loop */
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const ghost = require('./ghost');
const archive = require('./archive');
const { collectReferences, isReferenced } = require('./ghost/references');
const SHOULD_FIX_PERMISSIONS = argv['fix-permissions'] || argv.fix_permissions || argv.FIX_PERMISSIONS || false;
const CREDIT = '🎁 Open source tool by David Burgos from https://growblog.io';

function permissionResult() {
  if (SHOULD_FIX_PERMISSIONS) {
    return { type: 'none', message: null };
  }
  return { type: 'permission', message: null };
}

// Deleting a file needs write permission on its directory, not on the file.
function checkFileAccess(filePath) {
  let info;
  try {
    info = fs.lstatSync(filePath);
  } catch (err) {
    return { type: 'other', message: err.message };
  }
  if (info.isSymbolicLink()) {
    return { type: 'other', message: 'Refusing to delete symlink' };
  }
  if (!info.isFile()) {
    return { type: 'other', message: 'Not a file' };
  }
  try {
    const directory = path.dirname(filePath);
    fs.accessSync(directory, fs.constants.W_OK);
    fs.accessSync(directory, fs.constants.X_OK);
  } catch (err) {
    if (err.code === 'EACCES' || err.code === 'EPERM') {
      return permissionResult();
    }
    return { type: 'other', message: err.message };
  }
  return { type: 'none', message: null };
}

function filterUnused(params) {
  const uploads = params.uploads || [];
  const references = collectReferences(params.content || {});
  const result = {
    totalSpace: 0,
    totalUploads: uploads.length,
    list: [],
    roots: uploads.roots || [],
    incomplete: (params.content && params.content.incomplete) || []
  };

  for (const upload of uploads) {
    if (!isReferenced(upload, references)) {
      result.totalSpace += upload.size;
      result.list.push(upload);
    }
  }
  return result;
}

const BYTES_PER_MEGABYTE = 1024 * 1024;

function formatMegabytes(bytes) {
  return `${(bytes / BYTES_PER_MEGABYTE).toFixed(2)} MB`;
}
function formatStatus(status) {
  return typeof status === 'number' ? `HTTP ${status}` : String(status);
}

function reportIncomplete(result) {
  const missing = result.incomplete || [];
  if (!missing.length) {
    return false;
  }
  console.log('⚠️  These resources could not be read, so no files will be changed:');
  missing.forEach((item) => {
    console.log(`- ${item.resource} (${formatStatus(item.status)})`);
  });
  console.log('');
  return true;
}

function display(result) {
  const blocked = reportIncomplete(result);
  const nothingToDelete = result.list.length === 0;
  if (nothingToDelete) {
    if (!blocked) {
      console.log('✅  Completed but nothing to do here...');
      console.log('Congrats, all the uploads are being used 👍');
    }
    return { failed: blocked };
  }
  console.log('👇 Unused files that can be removed:');

  result.list.forEach((item) => {
    const accessCheck = checkFileAccess(item.path);
    let permissionIcon = '📄';
    let errorMessage = '';

    if (accessCheck.type === 'permission') {
      permissionIcon = '🔒';
    } else if (accessCheck.type === 'other') {
      permissionIcon = '❌';
      errorMessage = ` - ${accessCheck.message}`;
    }

    console.log(`${permissionIcon} ${item.path} (${formatMegabytes(item.size)})${errorMessage}`);
  });
  console.log('');
  console.log('📊 Summary:');
  console.log(`- ${result.list.length} files of ${result.totalUploads} uploaded files (${(result.list.length * 100 / result.totalUploads).toFixed(2)}%)`);
  console.log(`- Total space: ${formatMegabytes(result.totalSpace)}`);

  const permissionIssuesCount = result.list.filter((item) => checkFileAccess(item.path).type === 'permission').length;
  const otherIssuesCount = result.list.filter((item) => checkFileAccess(item.path).type === 'other').length;

  if (permissionIssuesCount > 0) {
    console.log(`- ${permissionIssuesCount} files have permission issues (🔒)`);
    console.log('');
    console.log('💡 Rerun with --fix-permissions to delete those files with sudo');
  }

  if (otherIssuesCount > 0) {
    console.log(`- ${otherIssuesCount} files have other issues (❌)`);
    console.log('');
    console.log('💡 Check the error messages above');
  }

  console.log('');
  console.log('❔ Want to delete these files for good? Run:');
  console.log('ghost-purge-images purge');
  console.log('❔ Prefer a reversible move? Run:');
  console.log('ghost-purge-images quarantine');
  console.log('❔ Or copy them aside first:');
  console.log('ghost-purge-images backup');
  if (blocked) {
    console.log('backup, quarantine and purge will refuse to change files until the resources above can be read.');
  }
  console.log(CREDIT);
  return { failed: blocked };
}

function uploadOptions(result) {
  return {
    roots: result.roots,
    fixPermissions: SHOULD_FIX_PERMISSIONS
  };
}

async function purge(result) {
  if (reportIncomplete(result)) {
    console.log('Refusing to delete until every resource can be read.');
    return { failed: true };
  }
  const output = {
    space: 0,
    files: 0,
    errors: 0
  };
  const nothingToDelete = result.list.length === 0;
  if (nothingToDelete) {
    console.log('✅  Completed but nothing to do here...');
    console.log('Congrats, all uploads are being used 👍');
    return { failed: false };
  }

  console.log('👇 Starting to delete unused uploads:');
  for (const item of result.list) {
    try {
      await ghost.uploads.remove(item.path, uploadOptions(result));
      output.files += 1;
      output.space += item.size;
      console.log(`✅ ${item.path}`);
    } catch (err) {
      output.errors += 1;
      console.log(`❌ ${item.path}`);
      console.log(` Error: ${err}`);
    }
  }
  console.log('');
  console.log('📊 Summary:');
  console.log(`- ${output.files} files removed`);
  console.log(`- Saved space: ${formatMegabytes(output.space)}`);

  if (output.errors > 0) {
    console.log(`- ${output.errors} files failed to delete`);
    if (!SHOULD_FIX_PERMISSIONS) {
      console.log('💡 Rerun with --fix-permissions to delete those files with sudo');
    }
  }

  console.log('');
  console.log(CREDIT);
  return { failed: output.errors > 0 };
}

async function runArchiveTransfer(result, options = {}) {
  const mode = options.mode;
  const label = mode === 'quarantine' ? 'quarantine' : 'backup';
  if (reportIncomplete(result)) {
    console.log(`Refusing to ${label} until every resource can be read.`);
    return { failed: true };
  }
  if (result.list.length === 0) {
    console.log('✅  Completed but nothing to do here...');
    console.log('Congrats, all uploads are being used 👍');
    return { failed: false };
  }

  const parentDir = mode === 'quarantine'
    ? (options.quarantinePath || archive.DEFAULT_QUARANTINE_ROOT)
    : (options.backupPath || archive.DEFAULT_BACKUP_ROOT);
  const archiveDir = await archive.createArchiveDir(parentDir);
  const succeeded = [];
  let errors = 0;

  console.log(`👇 Starting to ${label} unused uploads:`);
  for (const item of result.list) {
    const entry = archive.withDestination(archive.archiveEntry(item, result.roots), archiveDir);
    try {
      if (mode === 'quarantine') {
        await ghost.uploads.move(item.path, entry.destination, uploadOptions(result));
      } else {
        await ghost.uploads.copy(item.path, entry.destination, uploadOptions(result));
      }
      succeeded.push(entry);
      console.log(`✅ ${item.path}`);
    } catch (err) {
      errors += 1;
      console.log(`❌ ${item.path}`);
      console.log(` Error: ${err}`);
    }
  }

  const manifest = archive.buildManifest(mode, succeeded);
  archive.writeManifest(archiveDir, manifest);
  const space = succeeded.reduce((total, file) => total + file.size, 0);

  console.log('');
  console.log('📊 Summary:');
  console.log(`- ${succeeded.length} files ${mode === 'quarantine' ? 'quarantined' : 'backed up'}`);
  console.log(`- ${mode === 'quarantine' ? 'Freed space in uploads' : 'Archive size'}: ${formatMegabytes(space)}`);
  console.log(`- Archive: ${archiveDir}`);
  console.log(`- Manifest: ${path.join(archiveDir, archive.MANIFEST_NAME)}`);
  if (errors > 0) {
    console.log(`- ${errors} files failed`);
  }
  console.log('');
  console.log('❔ Restore later with:');
  console.log(`ghost-purge-images restore --from=${archiveDir}`);
  console.log('');
  console.log(CREDIT);
  return { failed: errors > 0, archiveDir };
}

function backup(result, options = {}) {
  return runArchiveTransfer(result, { ...options, mode: 'backup' });
}

function quarantine(result, options = {}) {
  return runArchiveTransfer(result, { ...options, mode: 'quarantine' });
}

async function restore(options = {}) {
  console.log('👇 Starting to restore from archive:');
  try {
    const outcome = await archive.restoreFiles({
      from: options.from,
      backupPath: options.backupPath,
      quarantinePath: options.quarantinePath,
      copyFile: async(source, destination) => {
        await ghost.uploads.copy(source, destination);
      }
    });
    const space = outcome.restored.reduce((total, file) => total + file.size, 0);
    outcome.restored.forEach((file) => {
      console.log(`✅ ${file.destination}`);
    });
    outcome.errors.forEach((failure) => {
      console.log(`❌ ${failure.entry.source}`);
      console.log(` Error: ${failure.err}`);
    });
    console.log('');
    console.log('📊 Summary:');
    console.log(`- ${outcome.restored.length} files restored`);
    console.log(`- From: ${outcome.archiveDir}`);
    console.log(`- Restored size: ${formatMegabytes(space)}`);
    if (outcome.errors.length > 0) {
      console.log(`- ${outcome.errors.length} files failed`);
    }
    console.log('');
    console.log(CREDIT);
    return { failed: outcome.errors.length > 0, archiveDir: outcome.archiveDir };
  } catch (err) {
    console.log(`❌ Restore failed: ${err}`);
    console.log('');
    console.log(CREDIT);
    return { failed: true };
  }
}

module.exports = {
  filterUnused,
  display,
  purge,
  backup,
  quarantine,
  restore
};
