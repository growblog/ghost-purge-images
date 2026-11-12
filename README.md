# ghost-purge-images

Display or clean unused uploaded files: images, documents, audio, video & thumbnail files of your Ghost blog

## 🎁 Versions compatibility

Which Ghost version are you running?

| Ghost version | ghost-purge-images version | How to install                            |
|---------------|----------------------------|-------------------------------------------|
| `6`           | latest                     | `npm install -g ghost-purge-images`       |
| `3, 4, 5`     | `3.4.0`                    | `npm install -g ghost-purge-images@3.4.0` |
| `>= 2.16`     | `2.1.1`                    | `npm install -g ghost-purge-images@2.1.1` |
| `<= 2.15.x`   | `2.0.3`                    | `npm install -g ghost-purge-images@2.0.3` |
| `0.7.2 - 1.x` | `1.0.0`                    | `npm install -g ghost-purge-images@1.0.0` |

## ✨ Update to the last version

In your blog server, login via ssh and run:

`npm install -g ghost-purge-images`

💡 This command will install or update `ghost-purge-images` globally in your server, it doesn't matter in which folder you run it 

## 🤓 Observations

- Backup your content folder first.
- Drafts, authors without published posts, internal tags, snippets and custom theme settings are included through the [Admin API](https://docs.ghost.org/docs/admin-api/).
- Theme templates in `content/themes` are read from disk. If that folder is missing or unreadable, `purge` deletes nothing.
- If newsletters, themes, theme files, custom theme settings, snippets, admin settings, users or tags cannot be read, `purge` deletes nothing.
- A missing `content/media` folder is skipped. Images in `content/images` are still checked.

## 🔑 Keys

Set the keys in the environment. Do not pass them as command arguments: the shell saves them in its history, and `ps` shows them to other users on the server.

```sh
export GHOST_CONTENT_KEY="your content api key"
export GHOST_ADMIN_KEY="your admin api key"
```

This tool uses:
- [Ghost Content API](https://docs.ghost.org/docs/content-api/) for settings
- [Ghost Admin API](https://docs.ghost.org/docs/admin-api/) for posts, pages, drafts, authors, tags, newsletters, snippets and custom theme settings

Get the keys following these steps:
- On your Ghost admin, click on **Integrations** in the left menu
- Click on **Add custom integration** and set any name
- Copy the Content API and Admin API keys

💡 Need help? Check this [step-by-step guide to create them](https://ghostboard.io/blog/how-to-integrate-ghostboard-with-ghost-content-api/)

## 🚀 Execute

Log into your server via ssh, in the Ghost folder (usually `/var/www/ghost`), then:

```sh
ghost-purge-images display
ghost-purge-images purge
```

On a terminal, `purge` asks you to type `yes`. For a script, add `--yes`.

`ghost-purge-images --help` lists every flag.

## ⚡️ Commands
### `display`

Print the list of all uploaded images that currently are not being used in any post, page or metadata. Attempts to predict any errors before running `purge`.

```sh
ghost-purge-images display
```

![ghost-purge-images display screenshot](https://user-images.githubusercontent.com/1589874/51084812-80e6f700-1730-11e9-96c4-4e106e4c7c63.png)

### `purge`

Delete all the unused files.

⚠️ WARNING: Take a backup before running this.

```sh
ghost-purge-images purge
ghost-purge-images purge --yes
```

![ghost-purge-images purge screenshot](https://user-images.githubusercontent.com/1589874/51084808-73ca0800-1730-11e9-8c2a-a3b43551fbaa.png)

## 🧩 Optional Params

- ### `--fix-permissions`

💡 If you don't have permission to delete files, `purge` reports `EACCES`.

`--fix-permissions` runs `sudo rm` on each unused file that could not be deleted. The file must sit inside the images or media folder. Symlinks are skipped. The command does not change permissions on the rest of the Ghost install.

- ### `url`

💡 By default the URL is read from `config.production.json`. If that file is missing, `config.development.json` is used. `NODE_ENV=development` checks the development file first.

You can set `GHOST_URL` or pass `--url=https://yourblog.com/` for Docker and other custom setups.

- ### `images-path`

💡 The **default images path** is `content/images`

You can change it with the optional param `... --images-path=your/custom/path/here`

- ### `media-path`

💡 The **default media path** is `content/media`

You can change it with the optional param `... --media-path=your/custom/path/here`

- ### `themes-path`

💡 The **default themes path** is `content/themes`

You can change it with the optional param `... --themes-path=your/custom/path/here`

- ### `exclude-ext`

💡 No **default value**, all extensions are included

You can exclude one or more file extensions. Examples:
  - Excluding `.webp` files, adding the optional param `... --exclude-ext=webp`
  - Excluding `.jpg` and `.gif` files (add a comma), adding the optional param `... --exclude-ext=jpg,gif`

## 📋 Changelog
See [CHANGELOG.md](https://github.com/ghostboard/ghost-purge-images/blob/master/CHANGELOG.md)

## 👋 Credits
David Burgos from [Ghostboard.io](https://ghostboard.io)

## 👏 Contributors
- [scottleechua](https://github.com/ghostboard/ghost-purge-images/pull/43)
- [mesquka](https://github.com/mesquka/ghost-purge-images-customdir/commits?author=mesquka)

## ✒️ License
See LICENSE file
