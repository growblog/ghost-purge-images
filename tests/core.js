const fs = require('fs');
const os = require('os');
const path = require('path');
const expect = require('chai').expect;
const core = require('../lib/core');
const uploads = require('../lib/ghost/uploads');
const { blogContent } = require('./support/blogContent');

function imageCard(src) {
  return JSON.stringify({
    version: '0.3.1',
    atoms: [],
    cards: [['image', { src }]],
    markups: [],
    sections: []
  });
}

function upload(filePath, size) {
  return { path: filePath, size };
}

function silenceConsole() {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    clear: console.clear
  };
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.clear = () => {};
  return function restore() {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
    console.clear = original.clear;
  };
}

async function purgeQuietly(result) {
  const previous = new Set(process.listeners('SIGINT'));
  const restore = silenceConsole();
  try {
    return await core.purge(result);
  } finally {
    restore();
    process.listeners('SIGINT').forEach((listener) => {
      if (!previous.has(listener)) {
        process.removeListener('SIGINT', listener);
      }
    });
  }
}

describe('lib/core', () => {
  describe('filterUnused()', () => {
    it('returns an empty result when there are no uploads', () => {
      expect(core.filterUnused({ uploads: [], content: blogContent() })).to.deep.equal({
        totalSpace: 0,
        totalUploads: 0,
        list: [],
        roots: [],
        incomplete: []
      });
    });

    it('keeps files referenced by posts, pages, authors, tags, settings or image cards', () => {
      const files = {
        post: upload('/var/www/ghost/content/images/2024/01/post.jpg', 10),
        page: upload('/var/www/ghost/content/images/2024/01/page.jpg', 11),
        author: upload('/var/www/ghost/content/images/2024/01/author.jpg', 12),
        tag: upload('/var/www/ghost/content/images/2024/01/tag.jpg', 13),
        logo: upload('/var/www/ghost/content/images/2024/01/logo.jpg', 14),
        card: upload('/var/www/ghost/content/images/2024/01/card.jpg', 15),
        orphan: upload('/var/www/ghost/content/images/2024/01/orphan.jpg', 16)
      };
      const result = core.filterUnused({
        uploads: Object.values(files),
        content: blogContent({
          posts: [{
            html: '<p>text</p>',
            mobiledoc: imageCard('https://blog.example/content/images/2024/01/card.jpg')
          }, {
            html: '<img src="https://blog.example/content/images/2024/01/post.jpg" />'
          }],
          pages: [{
            feature_image: 'https://blog.example/content/images/2024/01/page.jpg'
          }],
          authors: [{
            profile_image: 'https://blog.example/content/images/2024/01/author.jpg'
          }],
          tags: [{
            feature_image: 'https://blog.example/content/images/2024/01/tag.jpg'
          }],
          settings: {
            logo: 'https://blog.example/content/images/2024/01/logo.jpg'
          }
        })
      });

      expect(result.list).to.deep.equal([files.orphan]);
      expect(result.totalSpace).to.equal(16);
      expect(result.totalUploads).to.equal(7);
    });

    it('keeps an empty-collection reference and lists only the orphan', () => {
      const logo = upload('/var/www/ghost/content/images/2024/01/logo.png', 20);
      const orphan = upload('/var/www/ghost/content/images/2024/01/orphan.png', 8);
      const result = core.filterUnused({
        uploads: [logo, orphan],
        content: blogContent({
          settings: { logo: 'https://blog.example/content/images/2024/01/logo.png' }
        })
      });

      expect(result.list).to.deep.equal([orphan]);
      expect(result.totalSpace).to.equal(8);
    });

    it('keeps only the author image whose directory matches', () => {
      const older = upload('/var/www/ghost/content/images/2020/01/avatar.jpg', 1);
      const newer = upload('/var/www/ghost/content/images/2024/08/avatar.jpg', 2);
      const result = core.filterUnused({
        uploads: [older, newer],
        content: blogContent({
          authors: [{
            profile_image: 'https://blog.example/content/images/2024/08/avatar.jpg'
          }]
        })
      });

      expect(result.list).to.deep.equal([older]);
    });

    it('keeps an upload that cannot be mapped to a public path', () => {
      const outside = upload('/data/uploads/same_image.jpg', 4);
      const result = core.filterUnused({
        uploads: [outside],
        content: blogContent({
          posts: [{
            html: '<img src="https://blog.example/content/images/same_image.jpg" />'
          }]
        })
      });

      expect(result.list).to.deep.equal([]);
    });

    it('matches a custom images directory through urlPath', () => {
      const used = {
        path: '/data/uploads/2024/01/same_image.jpg',
        urlPath: '/content/images/2024/01/same_image.jpg',
        size: 4
      };
      const orphan = {
        path: '/data/uploads/2024/01/orphan.jpg',
        urlPath: '/content/images/2024/01/orphan.jpg',
        size: 5
      };
      const result = core.filterUnused({
        uploads: [used, orphan],
        content: blogContent({
          posts: [{
            html: '<img src="https://cdn.example/content/images/2024/01/same_image.jpg" />'
          }]
        })
      });

      expect(result.list).to.deep.equal([orphan]);
      expect(result.totalSpace).to.equal(5);
    });
  });

  describe('display()', () => {
    it('prints unused files and does not delete them', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const file = path.join(dir, 'orphan.jpg');
      fs.writeFileSync(file, 'keep');
      const logs = [];
      const original = { log: console.log, clear: console.clear };
      console.log = (line) => logs.push(String(line));
      console.clear = () => {};
      try {
        core.display({
          list: [{ path: file, size: 1048576 }],
          totalUploads: 4,
          totalSpace: 1048576
        });
        expect(fs.existsSync(file)).to.equal(true);
        expect(logs.join('\n')).to.include(file);
        expect(logs.join('\n')).to.include('1 files of 4');
        expect(logs.join('\n')).to.include('1.00 MB');
        expect(logs.join('\n')).to.include('ghost-purge-images purge');
        expect(logs.join('\n')).to.not.include('--content-key');
        expect(logs.join('\n')).to.not.include('--admin-key');
      } finally {
        console.log = original.log;
        console.clear = original.clear;
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('warns when the directory is not writable even if the file is', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const file = path.join(dir, 'orphan.jpg');
      fs.writeFileSync(file, 'keep');
      fs.chmodSync(file, 0o644);
      fs.chmodSync(dir, 0o555);
      const logs = [];
      const original = console.log;
      console.log = (line) => logs.push(String(line));
      try {
        core.display({
          list: [{ path: file, size: 4 }],
          totalUploads: 1,
          totalSpace: 4
        });
        expect(logs.join('\n')).to.include('🔒');
        expect(logs.join('\n')).to.include('--fix-permissions');
      } finally {
        console.log = original;
        fs.chmodSync(dir, 0o755);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('does not warn when only the file mode blocks writing', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const file = path.join(dir, 'orphan.jpg');
      fs.writeFileSync(file, 'keep');
      fs.chmodSync(file, 0o444);
      const logs = [];
      const original = console.log;
      console.log = (line) => logs.push(String(line));
      try {
        core.display({
          list: [{ path: file, size: 4 }],
          totalUploads: 1,
          totalSpace: 4
        });
        expect(logs.join('\n')).to.not.include('🔒');
        expect(logs.join('\n')).to.include('📄');
      } finally {
        console.log = original;
        fs.chmodSync(file, 0o644);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('returns failed when the scan is incomplete', () => {
      const logs = [];
      const original = console.log;
      console.log = (line) => logs.push(String(line));
      try {
        const outcome = core.display({
          list: [],
          totalUploads: 0,
          totalSpace: 0,
          incomplete: [{ resource: 'theme files', status: 'missing' }]
        });
        expect(outcome.failed).to.equal(true);
        expect(logs.join('\n')).to.include('theme files (missing)');
        expect(logs.join('\n')).to.not.include('all the uploads are being used');
      } finally {
        console.log = original;
      }
    });
  });

  describe('purge()', () => {
    it('deletes only the files in the unused list', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const orphan = path.join(dir, 'orphan.jpg');
      const keep = path.join(dir, 'keep.jpg');
      fs.writeFileSync(orphan, 'delete-me');
      fs.writeFileSync(keep, 'keep-me');
      try {
        await purgeQuietly({
          list: [{ path: orphan, size: 9 }],
          totalUploads: 2,
          totalSpace: 9
        });
        expect(fs.existsSync(orphan)).to.equal(false);
        expect(fs.existsSync(keep)).to.equal(true);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('does not delete anything when the unused list is empty', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const keep = path.join(dir, 'keep.jpg');
      fs.writeFileSync(keep, 'keep-me');
      try {
        await purgeQuietly({ list: [], totalUploads: 1, totalSpace: 0 });
        expect(fs.existsSync(keep)).to.equal(true);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('deletes an image orphan when content/media is missing and keeps a referenced file', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const images = path.join(dir, 'images');
      const media = path.join(dir, 'media');
      const orphan = path.join(images, 'orphan.jpg');
      const logo = path.join(images, 'logo.png');
      fs.mkdirSync(images);
      fs.writeFileSync(orphan, 'orphan');
      fs.writeFileSync(logo, 'logo');
      const restore = silenceConsole();
      try {
        const listed = await uploads.list([images, media]);
        const unused = core.filterUnused({
          uploads: listed,
          content: blogContent({
            settings: { logo: 'https://blog.example/content/images/logo.png' }
          })
        });

        expect(listed.missingFolders).to.deep.equal([media]);
        expect(unused.list.map((file) => file.path)).to.deep.equal([orphan]);

        await purgeQuietly(unused);
        expect(fs.existsSync(orphan)).to.equal(false);
        expect(fs.existsSync(logo)).to.equal(true);
        expect(fs.existsSync(media)).to.equal(false);
      } finally {
        restore();
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('does not delete when an optional resource could not be read', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const orphan = path.join(dir, 'orphan.jpg');
      fs.writeFileSync(orphan, 'keep');
      try {
        const outcome = await purgeQuietly({
          list: [{ path: orphan, urlPath: '/content/images/orphan.jpg', size: 4 }],
          totalUploads: 1,
          totalSpace: 4,
          incomplete: [{ resource: 'newsletters', status: 403 }]
        });
        expect(outcome.failed).to.equal(true);
        expect(fs.existsSync(orphan)).to.equal(true);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('does not delete a file outside the upload roots', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const images = path.join(dir, 'images');
      const outside = path.join(dir, 'outside.jpg');
      fs.mkdirSync(images);
      fs.writeFileSync(outside, 'keep');
      const root = await fs.promises.realpath(images);
      try {
        const outcome = await purgeQuietly({
          list: [{ path: outside, size: 4 }],
          roots: [root],
          totalUploads: 1,
          totalSpace: 4,
          incomplete: []
        });
        expect(outcome.failed).to.equal(true);
        expect(fs.existsSync(outside)).to.equal(true);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
