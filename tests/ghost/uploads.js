const expect = require('chai').expect;
const fs = require('fs');
const os = require('os');
const path = require('path');
const Uploads = require('../../lib/ghost/uploads');

describe('lib/ghost/uploads', () => {

  it('should be available', () => {
    expect(Uploads).to.be.an('object');
  });

  describe('list()', () => {
    it('is available', () => {
      expect(Uploads.list).to.be.an('function');
    });

    it('should return an array with path and size', async () => {
      let error;
      let output;
      try {
        output = await Uploads.list(['tests']);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(typeof output === 'object').to.equal(true);
        expect(output.length).to.be.an('number');
        expect(output[0]).to.have.property('path');
        expect(output[0]).to.have.property('size');
      }
    });

		it('should exclude the images/size folder', async () => {
		  let error;
		  let output;
		  try {
			  output = await Uploads.list(['tests/ghost/images']);
		  } catch (err) {
			  error = err;
		  } finally {
			  expect(error).to.be.undefined;
			  expect(typeof output === 'object').to.equal(true);
			  expect(output.length).to.be.an('number');
			  expect(output[0]).to.have.property('path');
			  expect(output[0]).to.have.property('size');
				output.map((item) => {
					expect(item.path.includes('images/size')).eq(false);
				});
		  }
	  });

	  it('should exclude the .webp files', async () => {
		  let error;
		  let output;
			const EXCLUDED_EXTENSIONS = ['webp'];
		  try {
			  output = await Uploads.list(['tests/ghost/images'], EXCLUDED_EXTENSIONS);
		  } catch (err) {
			  error = err;
		  } finally {
			  expect(error).to.be.undefined;
			  output.map((item) => {
				  expect(item.path.includes(EXCLUDED_EXTENSIONS[0])).eq(false);
			  });
		  }
	  });

    it('splits a comma-separated extension list and keeps the rest', async () => {
      const all = await Uploads.list(['tests/ghost/images'], []);
      const withoutWebp = await Uploads.list(['tests/ghost/images'], 'webp');
      const withoutEither = await Uploads.list(['tests/ghost/images'], 'jpg, webp');
      expect(all.some((item) => item.path.endsWith('.webp'))).to.equal(true);
      expect(all.some((item) => item.path.endsWith('.jpg'))).to.equal(true);
      expect(withoutWebp.some((item) => item.path.endsWith('.webp'))).to.equal(false);
      expect(withoutWebp.some((item) => item.path.endsWith('.jpg'))).to.equal(true);
      expect(withoutEither).to.have.length(0);
    });

    it('excludes every extension in an array', async () => {
      const all = await Uploads.list(['tests/ghost/images'], []);
      const output = await Uploads.list(['tests/ghost/images'], ['jpg', 'webp']);
      expect(all.length).to.be.greaterThan(0);
      expect(output).to.have.length(0);
    });

    it('skips a missing media folder and still lists images', async () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (message) => warnings.push(String(message));
      try {
        const output = await Uploads.list([
          'tests/ghost/images',
          'tests/ghost/no-such-media'
        ]);
        expect(output.some((item) => item.path.endsWith('image1.jpg'))).to.equal(true);
        expect(output.some((item) => item.path.includes('no-such-media'))).to.equal(false);
        expect(output.missingFolders).to.deep.equal(['tests/ghost/no-such-media']);
        expect(warnings).to.deep.equal(['⚠️  Skipping missing folder: tests/ghost/no-such-media']);
      } finally {
        console.warn = originalWarn;
      }
    });

    it('returns an empty list when every folder is missing', async () => {
      const originalWarn = console.warn;
      console.warn = () => {};
      try {
        const output = await Uploads.list(['tests/ghost/no-such-images', 'tests/ghost/no-such-media']);
        expect(output).to.have.length(0);
        expect(output.missingFolders).to.deep.equal([
          'tests/ghost/no-such-images',
          'tests/ghost/no-such-media'
        ]);
      } finally {
        console.warn = originalWarn;
      }
    });

    it('assigns a public path from the images root and the media root', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const images = path.join(dir, 'images');
      const media = path.join(dir, 'media');
      fs.mkdirSync(path.join(images, '2024'), { recursive: true });
      fs.mkdirSync(media, { recursive: true });
      fs.writeFileSync(path.join(images, '2024', 'photo.jpg'), 'a');
      fs.writeFileSync(path.join(media, 'clip.mp4'), 'b');
      try {
        const output = await Uploads.list([images, media]);
        const photo = output.find((item) => item.path.endsWith(`${path.sep}photo.jpg`));
        const clip = output.find((item) => item.path.endsWith(`${path.sep}clip.mp4`));
        expect(photo.urlPath).to.equal('/content/images/2024/photo.jpg');
        expect(clip.urlPath).to.equal('/content/media/clip.mp4');
        expect(output.roots).to.have.length(2);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('does not follow symlinks', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const images = path.join(dir, 'images');
      const outsideDir = path.join(dir, 'outside');
      fs.mkdirSync(images);
      fs.mkdirSync(outsideDir);
      fs.writeFileSync(path.join(images, 'photo.jpg'), 'photo');
      fs.writeFileSync(path.join(dir, 'secret.txt'), 'secret');
      fs.writeFileSync(path.join(outsideDir, 'hidden.jpg'), 'hidden');
      fs.symlinkSync(path.join(dir, 'secret.txt'), path.join(images, 'linked.txt'));
      fs.symlinkSync(outsideDir, path.join(images, 'linked-dir'));
      try {
        const output = await Uploads.list([images]);
        const paths = output.map((item) => item.path);
        expect(paths.some((item) => item.endsWith(`${path.sep}photo.jpg`))).to.equal(true);
        expect(paths.some((item) => item.includes('secret.txt'))).to.equal(false);
        expect(paths.some((item) => item.includes('hidden.jpg'))).to.equal(false);
        expect(paths.some((item) => item.includes('linked'))).to.equal(false);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('remove()', () => {
    it('is available', () => {
      expect(Uploads.remove).to.be.an('function');
    });

    it('refuses to delete a file outside the upload roots', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const images = path.join(dir, 'images');
      const outside = path.join(dir, 'outside.jpg');
      fs.mkdirSync(images);
      fs.writeFileSync(outside, 'keep');
      const root = await fs.promises.realpath(images);
      try {
        let escalated = false;
        try {
          await Uploads.remove(outside, {
            roots: [root],
            fixPermissions: true,
            runPrivileged: async () => {
              escalated = true;
            }
          });
          expect.fail('expected the delete to be refused');
        } catch (err) {
          expect(err.code).to.equal('EPERM');
        }
        expect(escalated).to.equal(false);
        expect(fs.existsSync(outside)).to.equal(true);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('deletes one unreadable file with sudo and does not change the directory', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const images = path.join(dir, 'images');
      const file = path.join(images, 'locked.jpg');
      fs.mkdirSync(images);
      fs.writeFileSync(file, 'locked');
      const root = await fs.promises.realpath(images);
      const modeBefore = fs.statSync(images).mode;
      await fs.promises.chmod(images, 0o555);
      try {
        let escalated = null;
        await Uploads.remove(file, {
          roots: [root],
          fixPermissions: true,
          runPrivileged: async (target) => {
            escalated = target;
            await fs.promises.chmod(images, 0o755);
            await fs.promises.unlink(target);
          }
        });
        expect(escalated).to.equal(file);
        expect(fs.existsSync(file)).to.equal(false);
        expect(fs.statSync(images).mode).to.equal(modeBefore);
      } finally {
        await fs.promises.chmod(images, 0o755);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
