const { PassThrough } = require('stream');
const expect = require('chai').expect;
const { confirmPurge } = require('../lib/confirmPurge');

function ttyStream() {
  const stream = new PassThrough();
  stream.isTTY = true;
  return stream;
}

describe('confirmPurge', () => {
  it('accepts --yes without asking', async () => {
    const stdin = ttyStream();
    const accepted = await confirmPurge(3, { argv: ['--yes'], stdin, stdout: new PassThrough() });
    expect(accepted).to.equal(true);
  });

  it('continues when there is no terminal', async () => {
    const stdin = new PassThrough();
    const accepted = await confirmPurge(3, { argv: [], stdin, stdout: new PassThrough() });
    expect(accepted).to.equal(true);
  });

  it('deletes only when the answer is yes', async () => {
    const stdin = ttyStream();
    const stdout = new PassThrough();
    const pending = confirmPurge(2, { argv: [], stdin, stdout });
    stdin.end('yes\n');
    expect(await pending).to.equal(true);
  });

  it('cancels any other answer', async () => {
    const stdin = ttyStream();
    const pending = confirmPurge(2, { argv: [], stdin, stdout: new PassThrough() });
    stdin.end('no\n');
    expect(await pending).to.equal(false);
  });
});
