require('dotenv').config();
const expect = require('chai').expect;
const Settings = require('../../lib/ghost/settings');

describe('lib/ghost/settings', () => {

  it('should be available', () => {
    expect(Settings).to.be.an('object');
  });

  describe('isBeingUsed()', () => {
    it('is available', () => {
      expect(Settings.isBeingUsed).to.be.an('function');
    });

    it('should return TRUE when is used on logo', () => {
      let error;
      let output;
      try {
        const settings = {
          logo: '/content/images/same_image.jpg'
        };
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Settings.isBeingUsed(upload, settings);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE when is not used on logo', () => {
      let error;
      let output;
      try {
        const settings = {
          logo: '/uploads/old_image.jpg'
        };
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Settings.isBeingUsed(upload, settings);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return TRUE when is used on cover image', () => {
      let error;
      let output;
      try {
        const settings = {
          cover_image: '/content/images/same_image.jpg'
        };
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Settings.isBeingUsed(upload, settings);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE when is not used on cover image', () => {
      let error;
      let output;
      try {
        const settings = {
          cover_image: '/uploads/old_image.jpg'
        };
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Settings.isBeingUsed(upload, settings);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return TRUE when is used as publication icon', () => {
      let error;
      let output;
      try {
        const settings = {
          icon: '/content/images/same_image.jpg'
        };
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Settings.isBeingUsed(upload, settings);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE when is not used as publication icon', () => {
      let error;
      let output;
      try {
        const settings = {
          icon: '/uploads/old_image.jpg'
        };
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Settings.isBeingUsed(upload, settings);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return TRUE when is used as Twitter image', () => {
      let error;
      let output;
      try {
        const settings = {
          twitter_image: '/content/images/same_image.jpg'
        };
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Settings.isBeingUsed(upload, settings);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE when is not used as Twitter image', () => {
      let error;
      let output;
      try {
        const settings = {
          twitter_image: '/uploads/old_image.jpg'
        };
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Settings.isBeingUsed(upload, settings);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return TRUE when is used as Facebook image', () => {
      let error;
      let output;
      try {
        const settings = {
          og_image: '/content/images/same_image.jpg'
        };
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Settings.isBeingUsed(upload, settings);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE when is not used as Facebook image', () => {
      let error;
      let output;
      try {
        const settings = {
          og_image: '/uploads/old_image.jpg'
        };
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Settings.isBeingUsed(upload, settings);
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
      expect(Settings.list).to.be.an('function');
    });

    if (process.env.TEST_BASE_URL) {
      it('should get the settings list', async () => {
        let error;
        let output;
        try {
          const input = {
            url: process.env.TEST_BASE_URL,
            contentAPIKey: process.env.TEST_CONTENT_API_KEY
          };
          output = await Settings.list(input);
        } catch (err) {
          error = err;
        } finally {
          expect(error).to.be.undefined;
          expect(output).to.be.an('object');
          expect(output).to.be.have.property('logo');
          expect(output).to.be.have.property('icon');
          expect(output).to.be.have.property('cover_image');
          expect(output).to.be.have.property('og_image');
          expect(output).to.be.have.property('twitter_image');
        }
      });
    }
  });
});
