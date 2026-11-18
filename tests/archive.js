const fs = require('fs');
const os = require('os');
const path = require('path');
const expect = require('chai').expect;
const archive = require('../lib/archive');

describe('lib/archive', () => {
  it('builds a relative archive path under the upload root basename', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
    const images = path.join(dir, 'images');
    const file = path.join(images, '2024', '01', 'orphan.jpg');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'x');
    try {
      expect(archive.relativeUnderRoots(file, [fs.realpathSync(images)])).to.equal(
        path.join('images', '2024', '01', 'orphan.jpg')
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writes a manifest and restores from the latest archive', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
    const images = path.join(dir, 'images');
    const backups = path.join(dir, 'backups');
    const source = path.join(images, '2024', 'orphan.jpg');
    fs.mkdirSync(path.dirname(source), { recursive: true });
    fs.writeFileSync(source, 'orphan');

    const archiveDir = await archive.createArchiveDir(backups);
    const entry = archive.withDestination(
      archive.archiveEntry({ path: source, size: 6 }, [images]),
      archiveDir
    );
    fs.mkdirSync(path.dirname(entry.destination), { recursive: true });
    fs.copyFileSync(source, entry.destination);
    archive.writeManifest(archiveDir, archive.buildManifest('backup', [entry]));

    fs.unlinkSync(source);
    const copied = [];
    const outcome = await archive.restoreFiles({
      backupPath: backups,
      quarantinePath: path.join(dir, 'unused-quarantine'),
      copyFile: async(from, to) => {
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(from, to);
        copied.push({ from, to });
      }
    });

    expect(outcome.archiveDir).to.equal(archiveDir);
    expect(copied).to.have.length(1);
    expect(fs.readFileSync(source, 'utf8')).to.equal('orphan');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('prefers an explicit --from archive over the latest default', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
    const older = path.join(dir, 'older');
    const newer = path.join(dir, 'newer');
    fs.mkdirSync(older);
    fs.mkdirSync(newer);
    archive.writeManifest(older, archive.buildManifest('backup', [{
      source: '/tmp/a.jpg',
      storedAs: 'images/a.jpg',
      size: 1
    }]));
    await new Promise((resolve) => setTimeout(resolve, 20));
    archive.writeManifest(newer, archive.buildManifest('backup', [{
      source: '/tmp/b.jpg',
      storedAs: 'images/b.jpg',
      size: 2
    }]));

    expect(archive.resolveArchiveDir({ from: older })).to.equal(path.resolve(older));
    expect(archive.resolveArchiveDir({
      backupPath: dir,
      quarantinePath: path.join(dir, 'missing')
    })).to.equal(path.resolve(newer));
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
