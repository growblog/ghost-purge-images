require('dotenv').config();
const expect = require('chai').expect;
const Authors = require('../../lib/ghost/authors');

describe('lib/ghost/authors', () => {

  it('should be available', () => {
    expect(Authors).to.be.an('object');
  });

  describe('isBeingUsed()', () => {
    it('is available', () => {
      expect(Authors.isBeingUsed).to.be.an('function');
    });

    it('should return TRUE when is used as profile_image', () => {
      let error;
      let output;
      try {
        const authors = [
          { profile_image: '/content/images/same_image.jpg' }
        ];
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Authors.isBeingUsed(upload, authors);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE when is not used as profile_image', () => {
      let error;
      let output;
      try {
        const authors = [
          { profile_image: '/uploads/old_image.jpg' }
        ];
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Authors.isBeingUsed(upload, authors);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return TRUE when is used as cover_image', () => {
      let error;
      let output;
      try {
        const authors = [
          { cover_image: '/content/images/same_image.jpg' }
        ];
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Authors.isBeingUsed(upload, authors);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE when is not used as cover_image', () => {
      let error;
      let output;
      try {
        const authors = [
          { cover_image: '/uploads/old_image.jpg' }
        ];
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Authors.isBeingUsed(upload, authors);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });
  });

  describe('list()', () => {
    it('is available', () => {
      expect(Authors.list).to.be.an('function');
    });

    if (process.env.TEST_BASE_URL) {
      it('should get the authors list', async () => {
        let error;
        let output;
        try {
          const input = {
            url: process.env.TEST_BASE_URL,
            contentAPIKey: process.env.TEST_CONTENT_API_KEY
          };
          output = await Authors.list(input);
        } catch (err) {
          error = err;
        } finally {
          expect(error).to.be.undefined;
          expect(output).to.be.an('array');
          expect(output.length).to.be.greaterThan(0);
          expect(output[0]).to.be.have.property('cover_image');
          expect(output[0]).to.be.have.property('profile_image');
        }
      });
    }
  });
});
