function blogContent(overrides = {}) {
  return {
    authors: [],
    pages: [],
    posts: [],
    settings: {},
    tags: [],
    ...overrides
  };
}

module.exports = {
  blogContent
};
