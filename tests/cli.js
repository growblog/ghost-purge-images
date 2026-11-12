const fs = require('fs');
const os = require('os');
const path = require('path');
const expect = require('chai').expect;
const display = require('../display');
const purge = require('../purge');
const content = require('../lib/ghost/content');
const uploads = require('../lib/ghost/uploads');
const bin = require('../bin/ghost-purge-images');
const { blogContent } = require('./support/blogContent');

function exitError(code) {
  const error = new Error(`process.exit:${code}`);
  error.exitCode = code;
  return error;
}

describe('cli', () => {
  const originals = {
    display: display.run,
    purge: purge.run,
    assertReady: content.assertReady,
    fetch: content.fetch,
    list: uploads.list,
    exit: process.exit,
    log: console.log,
    clear: console.clear
  };

  afterEach(() => {
    display.run = originals.display;
    purge.run = originals.purge;
    content.assertReady = originals.assertReady;
    content.fetch = originals.fetch;
    uploads.list = originals.list;
    process.exit = originals.exit;
    console.log = originals.log;
    console.clear = originals.clear;
  });

  function stubExit() {
    const codes = [];
    process.exit = (code) => {
      codes.push(code);
      throw exitError(code);
    };
    return codes;
  }

  describe('bin', () => {
    it('exits 1 when the command is missing', () => {
      const logs = [];
      console.log = (line) => logs.push(String(line));
      const codes = stubExit();
      expect(() => bin.main([])).to.throw('process.exit:1');
      expect(codes).to.deep.equal([1]);
      expect(logs[0]).to.include('Please provide a command');
    });

    it('exits 1 when the command is unknown', () => {
      const logs = [];
      console.log = (line) => logs.push(String(line));
      const codes = stubExit();
      expect(() => bin.main(['nope'])).to.throw('process.exit:1');
      expect(codes).to.deep.equal([1]);
      expect(logs[0]).to.include("Command 'nope' not found");
    });

    it('runs display and does not purge', () => {
      let displayed = false;
      let purged = false;
      display.run = () => {
        displayed = true;
      };
      purge.run = () => {
        purged = true;
      };
      bin.main(['display']);
      expect(displayed).to.equal(true);
      expect(purged).to.equal(false);
    });

    it('runs purge and asks before deleting', () => {
      let displayed = false;
      let received;
      display.run = () => {
        displayed = true;
      };
      purge.run = (options) => {
        received = options;
      };
      bin.main(['purge']);
      expect(displayed).to.equal(false);
      expect(received).to.deep.equal({ ask: true });
    });

    it('prints help without running a command', () => {
      const logs = [];
      console.log = (line) => logs.push(String(line));
      const codes = stubExit();
      expect(() => bin.main(['--help'])).to.throw('process.exit:0');
      expect(codes).to.deep.equal([0]);
      const text = logs.join('\n');
      expect(text).to.include('GHOST_CONTENT_KEY');
      expect(text).to.include('GHOST_ADMIN_KEY');
      expect(text).to.include('--yes');
      expect(text).to.include('--themes-path');
    });
  });

  describe('purge.run()', () => {
    it('does not scan or delete when the API keys are missing', async () => {
      let listed = false;
      uploads.list = async () => {
        listed = true;
        return [];
      };
      const logs = [];
      console.log = (line) => logs.push(String(line));
      const codes = stubExit();
      try {
        await purge.run();
        expect.fail('expected the command to exit');
      } catch (err) {
        expect(err.exitCode).to.equal(1);
      }
      expect(codes).to.deep.equal([1]);
      expect(listed).to.equal(false);
      expect(logs.join('\n')).to.include('CONTENT_KEY');
      expect(logs.join('\n')).to.include('ADMIN_KEY');
    });

    it('does not delete listed files when the API request fails', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const file = path.join(dir, 'orphan.jpg');
      fs.writeFileSync(file, 'orphan');
      content.assertReady = () => ({});
      content.fetch = async () => {
        throw new Error('Posts API - Not valid response');
      };
      uploads.list = async () => [{ path: file, size: 4 }];
      console.log = () => {};
      console.clear = () => {};
      stubExit();
      try {
        await purge.run();
        expect.fail('expected the command to exit');
      } catch (err) {
        expect(err.exitCode).to.equal(1);
        expect(fs.existsSync(file)).to.equal(true);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('deletes an orphan and keeps a referenced file when collections are empty', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const logo = path.join(dir, 'logo.png');
      const orphan = path.join(dir, 'orphan.jpg');
      fs.writeFileSync(logo, 'logo');
      fs.writeFileSync(orphan, 'orphan');
      content.assertReady = () => ({});
      content.fetch = async () => blogContent({
        settings: { logo: 'https://blog.example/content/images/logo.png' }
      });
      uploads.list = async () => [
        { path: logo, urlPath: '/content/images/logo.png', size: 4 },
        { path: orphan, urlPath: '/content/images/orphan.jpg', size: 6 }
      ];
      console.log = () => {};
      console.clear = () => {};
      const codes = stubExit();
      try {
        await purge.run();
        expect.fail('expected the command to exit');
      } catch (err) {
        expect(err.exitCode).to.equal(0);
        expect(codes).to.deep.equal([0]);
        expect(fs.existsSync(logo)).to.equal(true);
        expect(fs.existsSync(orphan)).to.equal(false);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('exits 1 when a listed file cannot be deleted', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const blocked = path.join(dir, 'blocked');
      fs.mkdirSync(blocked);
      content.assertReady = () => ({});
      content.fetch = async () => blogContent();
      uploads.list = async () => [{
        path: blocked,
        urlPath: '/content/images/blocked',
        size: 1
      }];
      console.log = () => {};
      console.clear = () => {};
      const codes = stubExit();
      try {
        await purge.run();
        expect.fail('expected the command to exit');
      } catch (err) {
        expect(err.exitCode).to.equal(1);
        expect(codes).to.deep.equal([1]);
        expect(fs.existsSync(blocked)).to.equal(true);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('asks before deleting and deletes nothing when the answer is no', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const orphan = path.join(dir, 'orphan.jpg');
      fs.writeFileSync(orphan, 'orphan');
      let asked = false;
      content.assertReady = () => ({});
      content.fetch = async () => blogContent();
      uploads.list = async () => [{
        path: orphan,
        urlPath: '/content/images/orphan.jpg',
        size: 4
      }];
      console.log = () => {};
      console.clear = () => {};
      const codes = stubExit();
      try {
        await purge.run({
          ask: true,
          confirm: async () => {
            asked = true;
            return false;
          }
        });
        expect.fail('expected the command to exit');
      } catch (err) {
        expect(err.exitCode).to.equal(0);
        expect(codes).to.deep.equal([0]);
        expect(asked).to.equal(true);
        expect(fs.existsSync(orphan)).to.equal(true);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('does not ask or delete when the scan is incomplete', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghost-purge-'));
      const orphan = path.join(dir, 'orphan.jpg');
      fs.writeFileSync(orphan, 'orphan');
      let asked = false;
      content.assertReady = () => ({});
      content.fetch = async () => blogContent({
        incomplete: [{ resource: 'snippets', status: 403 }]
      });
      uploads.list = async () => [{
        path: orphan,
        urlPath: '/content/images/orphan.jpg',
        size: 4
      }];
      console.log = () => {};
      console.clear = () => {};
      const codes = stubExit();
      try {
        await purge.run({
          ask: true,
          confirm: async () => {
            asked = true;
            return true;
          }
        });
        expect.fail('expected the command to exit');
      } catch (err) {
        expect(err.exitCode).to.equal(1);
        expect(codes).to.deep.equal([1]);
        expect(asked).to.equal(false);
        expect(fs.existsSync(orphan)).to.equal(true);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('display.run()', () => {
    it('exits 1 when a resource could not be read', async () => {
      content.assertReady = () => ({});
      content.fetch = async () => blogContent({
        incomplete: [{ resource: 'snippets', status: 403 }]
      });
      uploads.list = async () => [];
      console.log = () => {};
      console.clear = () => {};
      const codes = stubExit();
      try {
        await display.run();
        expect.fail('expected the command to exit');
      } catch (err) {
        expect(err.exitCode).to.equal(1);
        expect(codes).to.deep.equal([1]);
      }
    });
  });
});
