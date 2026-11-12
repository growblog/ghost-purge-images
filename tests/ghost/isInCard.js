require('dotenv').config();
const expect = require('chai').expect;
const isInCard = require('../../lib/ghost/isInCard');

describe('lib/ghost/isInCard', () => {

  it('should be available', () => {
    expect(isInCard).to.be.a('function');
  });

  describe('audio card', () => {
    it('should return TRUE when the upload file is used in the card', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["audio",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_900KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["audio",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2021/12/file_example_MP3_700KB.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE due a full patch check, not only filename', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["audio",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2019/12/file_example_MP3_700KB.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return FALSE when a uploaded file is not used in the card', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["audio",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2019/12/not_used.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });
  });

  describe('video card', () => {
    it('should return TRUE when the upload file is used in the card', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_900KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2021/12/file_example_MP3_700KB.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE due a full patch check, not only filename', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2019/12/file_example_MP3_700KB.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return FALSE when a uploaded file is not used in the card', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2019/12/not_used.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return TRUE when the uploaded file is a video thumbnail', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["video",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/images/2021/12/media-thumbnail-ember182.jpg';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });
  });

  describe('image card', () => {
    it('should return TRUE when the upload file is used in the card', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["image",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_900KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["image",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["image",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2021/12/file_example_MP3_700KB.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE due a full patch check, not only filename', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["image",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["image",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2019/12/file_example_MP3_700KB.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return FALSE when a uploaded file is not used in the card', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["image",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["image",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2019/12/not_used.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });
  });

  describe('file card', () => {
    it('should return TRUE when the upload file is used in the card', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["file",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_900KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["file",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["file",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2021/12/file_example_MP3_700KB.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(true);
      }
    });

    it('should return FALSE due a full patch check, not only filename', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["file",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["file",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2019/12/file_example_MP3_700KB.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });

    it('should return FALSE when a uploaded file is not used in the card', () => {
      let error;
      let output;
      try {
        const mobiledoc = '{"version":"0.3.1","atoms":[],"cards":[["file",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP3_700KB.mp3","title":"File example MP3 700KB","duration":27.252,"mimeType":"audio/mpeg"}],["file",{"loop":false,"src":"http://localhost:2368/content/media/2021/12/file_example_MP4_640_3MG.mp4","fileName":"file_example_MP4_640_3MG.mp4","width":640,"height":360,"duration":30.526667,"mimeType":"video/mp4","thumbnailSrc":"http://localhost:2368/content/images/2021/12/media-thumbnail-ember182.jpg","thumbnailWidth":640,"thumbnailHeight":360}]],"markups":[],"sections":[[1,"p",[[0,[],0,"whatever"]]],[10,0],[10,1],[1,"p",[]]],"ghostVersion":"4.0"}';
        const upload = 'content/media/2019/12/not_used.mp3';
        output = isInCard(upload, mobiledoc);
      } catch (err) {
        error = err;
      } finally {
        expect(error).to.be.undefined;
        expect(output).to.equal(false);
      }
    });
  });

  describe('gallery card', () => {
    it('returns TRUE when a gallery image uses the upload', () => {
      const mobiledoc = JSON.stringify({
        cards: [['gallery', {
          images: [{ src: 'http://localhost:2368/content/images/2024/01/photo.jpg' }]
        }]]
      });
      expect(isInCard('content/images/2024/01/photo.jpg', mobiledoc)).to.equal(true);
    });

    it('honours a custom card type list', () => {
      const mobiledoc = JSON.stringify({
        cards: [['image', { src: 'http://localhost:2368/content/images/2024/01/photo.jpg' }]]
      });
      expect(isInCard('content/images/2024/01/photo.jpg', mobiledoc, ['gallery'])).to.equal(false);
    });
  });

  it('returns FALSE when mobiledoc is not valid JSON', () => {
    expect(isInCard('content/images/2024/01/photo.jpg', '{not json')).to.equal(false);
  });
});
