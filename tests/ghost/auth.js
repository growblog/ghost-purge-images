const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const auth = require('../../lib/ghost/auth');

describe('lib/ghost/auth', () => {
  const secret = 'ab'.repeat(32);
  const adminKey = `integration:${secret}`;

  describe('getToken()', () => {
    it('signs an admin token for the id and hex secret', () => {
      const token = auth.getToken(adminKey);
      const decoded = jwt.decode(token, { complete: true });
      const verified = jwt.verify(token, Buffer.from(secret, 'hex'), {
        algorithms: ['HS256'],
        audience: '/admin/'
      });

      expect(decoded.header.alg).to.equal('HS256');
      expect(decoded.header.kid).to.equal('integration');
      expect(verified.aud).to.equal('/admin/');
    });

    it('throws when the admin key has no secret', () => {
      expect(() => auth.getToken('integration')).to.throw();
    });
  });
});
