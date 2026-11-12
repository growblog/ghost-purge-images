const expect = require('chai').expect;
const pkg = require('../package.json');

describe('package metadata', () => {
  it('installs on the Node version Ghost 6 runs', () => {
    expect(pkg.engines.node).to.equal('>=22');
  });

  it('points main at the CLI entry', () => {
    expect(pkg.main).to.equal('./bin/ghost-purge-images.js');
    expect(pkg.preferGlobal).to.equal(undefined);
  });
});
