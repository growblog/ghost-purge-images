# 📋 Changelog

## 4.1.0

- Use the Ghost 6 Admin and Content APIs (`Accept-Version: v6.0`) and require Node.js 22
- Read `GHOST_CONTENT_KEY` and `GHOST_ADMIN_KEY` from the environment, and do not print them
- Renew the admin token on every API page
- Match uploads by the exact public `/content/images` or `/content/media` path, including names with spaces, parentheses, commas or apostrophes
- Include drafts, lexical, mobiledoc, galleries, code injection, newsletters, snippets, custom theme settings, authors without posts, internal tags and theme files on disk
- Skip a missing `content/media` folder. If `content/themes` is missing or unreadable, delete nothing
- Treat an empty API collection as empty. A 404 on an optional endpoint is empty. A 403 or 422 blocks deletion
- Ask before `purge` on a terminal. `--yes` skips the question. An incomplete scan exits 1 and deletes nothing, before the question
- Check that the parent directory can be written and traversed. `--fix-permissions` runs `sudo rm` only on that unused file inside the upload folders, and skips symlinks
- Read `config.development.json` when production config is missing. Add `--themes-path` and `--help`
- Exit 1 when a command, the scan or a delete fails
- Add tests and CI for Node.js 22 and 24

## 4.0.0

- Added support for Ghost 6 and Node.js 22
- Updated dependencies

## 3.4.0

Thanks to [Scott Lee](https://github.com/ghostboard/ghost-purge-images/pull/43):

- Added `--fix-permissions` flag
- Improved README
- Updated dependencies

## 3.3.0

- Add exclude-ext optional param for excluding file extensions

## 3.2.4

- Exclude `images/size` folder
- Update dependencies

## 3.2.3

- Add versions compatibility table to README
- Update dependencies

## 3.2.2

- Update dependencies

## 3.2.1

- Add support for file & image card #31
- Add support for video thumbnails
- Refactor to improve speed

## v3.2.0

- Add support for audio & video card files #31
- Add media-path param
- Refactor to improve performance up to 15%
- Update all dependencies

## v3.1.4

- Add optional param url
- Improve documentation

## v3.1.3

- Replace request (deprecated) to axios
- Added more tests
  
## v3.1.2

- Bumps internal dependencies (lodash & hosted-git-info)

## v3.1.1

- Bumps y18n to 4.0.1

## v3.1.0

- Add optional images-path param by mesquka #18

## v3.0.5

- Add support for publication icon, Twitter & Facebook images #17 #20

## v3.0.4

- Fix upload path to check isBeingUsed & update tests

## v3.0.3
- Add minimist to dependencies

## v3.0.2
- Fix & recovery Ghost Admin API

## v3.0.1
- Update node & npm versions
- Move chai & mocha to devDependencies
- Remove auth.js 🐛

## v3.0.0
- Add support to Ghost Content API v3
- Refactor callbacks to async/await
- Added some tests
- Reduce dependencies

## v2.1.1
- Fix hyphen param issue

## v2.1.0
- Add Admin API support to handle images in drafts (post/pages) ([issue #2](https://github.com/ghostboard/ghost-purge-images/issues/2))
- Add CHANGELOG
- Improve README

## 2.0.3
- Update dependencies and minor improvements

## 2.0.2
- Fix slash bug ([issue #1](https://github.com/ghostboard/ghost-purge-images/issues/1))

## 2.0.1
- Improve README

## 2.0.0
- Support Ghost Content API
- Deprecated Ghost Public API

## 1.0.0
- Support Ghost Public API: images in posts, pages, logo & cover