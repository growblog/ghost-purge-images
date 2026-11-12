const expect = require('chai').expect;
const Posts = require('../../lib/ghost/posts');
const Authors = require('../../lib/ghost/authors');
const Tags = require('../../lib/ghost/tags');
const Settings = require('../../lib/ghost/settings');
const core = require('../../lib/core');
const { collectReferences } = require('../../lib/ghost/references');
const { blogContent } = require('../support/blogContent');

function upload(filePath) {
  return { path: filePath, size: 1 };
}

describe('public path matching', () => {
  it('reads a Windows path as a Ghost content path', () => {
    expect(Posts.isBeingUsed(
      { path: 'C:\\ghost\\content\\images\\2024\\01\\a.jpg' },
      [{ html: 'https://blog.example/content/images/2024/01/a.jpg' }]
    )).to.equal(true);
  });

  it('does not match a shorter filename inside a longer one', () => {
    expect(Authors.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/1.jpg'),
      [{ profile_image: 'https://blog.example/content/images/2024/01/image1.jpg' }]
    )).to.equal(false);
  });

  it('does not match the same filename in another directory', () => {
    expect(Tags.isBeingUsed(
      upload('/var/www/ghost/content/images/2020/01/avatar.jpg'),
      [{ feature_image: 'https://blog.example/content/images/2024/08/avatar.jpg' }]
    )).to.equal(false);
  });

  it('keeps a file referenced only from code injection', () => {
    expect(Settings.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/pixel.png'),
      { codeinjection_head: '<img src="https://blog.example/content/images/2024/01/pixel.png">' }
    )).to.equal(true);
  });

  it('keeps a tag open-graph image', () => {
    expect(Tags.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/og.jpg'),
      [{ og_image: 'https://blog.example/content/images/2024/01/og.jpg' }]
    )).to.equal(true);
  });

  it('keeps a gallery image that is only present in mobiledoc', () => {
    const mobiledoc = JSON.stringify({
      cards: [['gallery', {
        images: [{ src: 'https://blog.example/content/images/2024/01/gallery.jpg' }]
      }]]
    });
    expect(Posts.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/gallery.jpg'),
      [{ html: '<p>empty</p>', mobiledoc }]
    )).to.equal(true);
  });

  it('keeps a lexical image', () => {
    expect(Posts.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/lexical.jpg'),
      [{ lexical: '{"src":"https://blog.example/content/images/2024/01/lexical.jpg"}' }]
    )).to.equal(true);
  });

  it('keeps newsletter, theme and footer references', () => {
    const header = upload('/var/www/ghost/content/images/2024/01/header.png');
    const footer = upload('/var/www/ghost/content/media/2024/01/footer.png');
    const theme = upload('/var/www/ghost/content/images/2024/01/theme.png');
    const result = core.filterUnused({
      uploads: [header, footer, theme],
      content: blogContent({
        newsletters: [{
          header_image: 'https://blog.example/content/images/2024/01/header.png',
          footer_content: '<img src="https://blog.example/content/media/2024/01/footer.png">'
        }],
        adminSettings: [{
          key: 'custom_theme_setting_logo',
          value: 'https://blog.example/content/images/2024/01/theme.png'
        }]
      })
    });

    expect(result.list).to.deep.equal([]);
  });

  it('strips query strings and decodes paths before comparing', () => {
    const references = collectReferences(
      'https://blog.example/content/images/2024/01/my%20photo.jpg?v=2 600w'
    );
    expect(Array.from(references)).to.deep.equal([
      '/content/images/2024/01/my photo.jpg'
    ]);
    expect(Posts.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/my photo.jpg'),
      [{ html: 'https://blog.example/content/images/2024/01/my%20photo.jpg?v=2' }]
    )).to.equal(true);
  });

  it('finds a Ghost URL placeholder', () => {
    const references = collectReferences('__GHOST_URL__/content/images/2024/01/a.jpg');
    expect(references.has('/content/images/2024/01/a.jpg')).to.equal(true);
  });

  it('keeps filenames that contain parentheses, spaces, commas or apostrophes', () => {
    const html = [
      '<img src="https://blog.example/content/images/2024/01/Screenshot%20(1).png">',
      '<img src="https://blog.example/content/images/2024/01/my photo.jpg">',
      '<img src="https://blog.example/content/images/2024/01/a,b.jpg">',
      '<img src="https://blog.example/content/images/2024/01/it\'s.jpg">'
    ].join('');
    expect(Posts.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/Screenshot (1).png'),
      [{ html }]
    )).to.equal(true);
    expect(Posts.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/my photo.jpg'),
      [{ html }]
    )).to.equal(true);
    expect(Posts.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/a,b.jpg'),
      [{ html }]
    )).to.equal(true);
    expect(Posts.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/it\'s.jpg'),
      [{ html }]
    )).to.equal(true);
  });

  it('does not treat the closing parenthesis of a markdown link as part of the filename', () => {
    expect(Posts.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/photo.jpg'),
      [{ html: '![alt](https://blog.example/content/images/2024/01/photo.jpg)' }]
    )).to.equal(true);
    expect(Posts.isBeingUsed(
      upload('/var/www/ghost/content/images/2024/01/Screenshot (1).png'),
      [{ html: '![alt](https://blog.example/content/images/2024/01/Screenshot%20(1).png)' }]
    )).to.equal(true);
  });

  it('reads both candidates in a srcset', () => {
    const references = collectReferences(
      '/content/images/2024/01/a.jpg 600w, /content/images/2024/01/b.jpg 1200w'
    );
    expect(references.has('/content/images/2024/01/a.jpg')).to.equal(true);
    expect(references.has('/content/images/2024/01/b.jpg')).to.equal(true);
    const packed = collectReferences(
      '/content/images/2024/01/a.jpg,/content/images/2024/01/b.jpg'
    );
    expect(packed.has('/content/images/2024/01/a.jpg')).to.equal(true);
    expect(packed.has('/content/images/2024/01/b.jpg')).to.equal(true);
    const quoted = collectReferences(
      '<img srcset="/content/images/2024/01/a.jpg 600w, /content/images/2024/01/b.jpg 1200w">'
    );
    expect(quoted.has('/content/images/2024/01/a.jpg')).to.equal(true);
    expect(quoted.has('/content/images/2024/01/b.jpg')).to.equal(true);
  });

  it('keeps a comma inside an unquoted css url', () => {
    const references = collectReferences('url(/content/images/a,b.jpg)');
    expect(references.has('/content/images/a,b.jpg')).to.equal(true);
  });
});
