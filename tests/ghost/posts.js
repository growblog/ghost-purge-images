require('dotenv').config();
const expect = require('chai').expect;
const auth = require('../../lib/ghost/auth');
const Posts = require('../../lib/ghost/posts');

describe('lib/ghost/posts', () => {

  it('should be available', () => {
    expect(Posts).to.be.an('object');
  });

  describe('isBeingUsed()', () => {
    it('is available', () => {
      expect(Posts.isBeingUsed).to.be.an('function');
    });

    it('should return TRUE when is used on html', () => {
      const posts = [
        { html: '<img src="https://blog.example/content/images/2024/01/same_image.jpg" />' }
      ];
      const upload = {
        path: '/var/www/ghost/content/images/2024/01/same_image.jpg'
      };
      expect(Posts.isBeingUsed(upload, posts)).to.equal(true);
    });

    it('should return FALSE when only the filename matches in another directory', () => {
      const posts = [
        { html: '<img src="https://blog.example/content/images/2020/05/same_image.jpg" />' }
      ];
      const upload = {
        path: '/var/www/ghost/content/images/2024/01/same_image.jpg'
      };
      expect(Posts.isBeingUsed(upload, posts)).to.equal(false);
    });

    it('should return TRUE when is used as feature_image', () => {
      let error;
      let output;
      try {
        const posts = [
          { feature_image: '/content/images/same_image.jpg' }
        ];
        const upload = {
          path: 'uploads/content/images/same_image.jpg'
        };
        output = Posts.isBeingUsed(upload, posts);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return TRUE when is used as openGraph image', () => {
      let error;
      let output;
      try {
        const posts = [
          { og_image: '/content/images/same_image.jpg' }
        ];
        const upload = {
          path: 'uploads/content/images/same_image.jpg'
        };
        output = Posts.isBeingUsed(upload, posts);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return TRUE when is used as twitter image', () => {
      let error;
      let output;
      try {
        const posts = [
          { twitter_image: '/content/images/same_image.jpg' }
        ];
        const upload = {
          path: '/uploads/content/images/same_image.jpg'
        };
        output = Posts.isBeingUsed(upload, posts);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE when is not used on html', () => {
      let error;
      let output;
      try {
        const posts = [
          { html: '<img src="/uploads/old_image.jpg" />' }
        ];
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Posts.isBeingUsed(upload, posts);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return FALSE when is not used as feature_image', () => {
      let error;
      let output;
      try {
        const posts = [
          { feature_image: '/uploads/old_image.jpg' }
        ];
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Posts.isBeingUsed(upload, posts);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return FALSE when is not used as openGraph image', () => {
      let error;
      let output;
      try {
        const posts = [
          { og_image: '/uploads/old_image.jpg' }
        ];
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Posts.isBeingUsed(upload, posts);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return FALSE when is not used as twitter image', () => {
      let error;
      let output;
      try {
        const posts = [
          { twitter_image: '/uploads/old_image.jpg' }
        ];
        const upload = {
          path: 'content/images/same_image.jpg'
        };
        output = Posts.isBeingUsed(upload, posts);
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
      expect(Posts.list).to.be.an('function');
    });

    if (process.env.TEST_BASE_URL) {
      it('should get the post list', async () => {
        let error;
        let output;
        try {
          const input = {
            url: process.env.TEST_BASE_URL,
            authToken: auth.getToken(process.env.TEST_ADMIN_API_KEY)
          };
          output = await Posts.list(input);
        } catch (err) {
          error = err;
        } finally {
          expect(error).to.be.undefined;
          expect(output).to.be.an('array');
          expect(output.length).to.be.greaterThan(0);
          expect(output[0]).to.be.have.property('feature_image');
          expect(output[0]).to.be.have.property('og_image');
          expect(output[0]).to.be.have.property('twitter_image');
        }
      });

      it('should get the mobiledoc property that contains video & audio cards', async () => {
        let error;
        let output;
        try {
          const input = {
            url: process.env.TEST_BASE_URL,
            authToken: auth.getToken(process.env.TEST_ADMIN_API_KEY)
          };
          output = await Posts.list(input);
        } catch (err) {
          error = err;
        } finally {
          expect(error).to.be.undefined;
          expect(output).to.be.an('array');
          expect(output.length).to.be.greaterThan(0);
          expect(output[0]).to.be.have.property('mobiledoc');
        }
      });
    }
  });
});
