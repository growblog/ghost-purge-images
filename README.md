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

## 🧭 Recommended flow

1. `display` — review unused files (changes nothing)
2. `backup` **or** `quarantine` — copy aside, or move out of Ghost uploads
3. Check the blog. If something is missing, `restore`
4. Only then `purge` if you still want a permanent delete

```sh
ghost-purge-images display
ghost-purge-images quarantine --yes
# …verify the site…
ghost-purge-images restore --from=content/ghost-purge-quarantine/<timestamp>
# or, when you are sure:
ghost-purge-images purge --yes
```

## 🤓 Observations

- Prefer `backup` or `quarantine` before a permanent `purge`.
- Drafts, authors without published posts, internal tags, snippets and custom theme settings are included through the [Admin API](https://docs.ghost.org/docs/admin-api/).
- Theme templates in `content/themes` are read from disk. If that folder is missing or unreadable, destructive commands change nothing.
- If newsletters, themes, theme files, custom theme settings, snippets, admin settings, users or tags cannot be read, destructive commands change nothing.
- A missing `content/media` folder is skipped. Images in `content/images` are still checked.
- Generated responsive files under `content/images/size/` are **not** listed or removed (same as since 3.2.4). Ghost can recreate them when needed.

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
- On your Ghost admin, open **Settings → Advanced → Integrations**
- Click on **Add custom integration** and set any name
- Copy the Content API and Admin API keys

💡 Need help? Check this [step-by-step guide](https://blog.growblog.io/how-to-integrate-growblog-with-the-ghost-api/) (same Integrations screen; copy both keys for this CLI).

## 🚀 Execute

Log into your server via ssh, in the Ghost folder (usually `/var/www/ghost`), then:

```sh
ghost-purge-images display
ghost-purge-images backup
ghost-purge-images quarantine
ghost-purge-images restore
ghost-purge-images purge
```

On a terminal, `backup`, `quarantine`, `restore` and `purge` ask you to type `yes`. For a script, add `--yes`.

`ghost-purge-images --help` lists every flag.

## 🐳 Docker

Most self-hosted Ghost installs run in Docker. From the host:

```sh
docker exec -it <ghost-container> sh
npm install -g ghost-purge-images
export GHOST_CONTENT_KEY="..."
export GHOST_ADMIN_KEY="..."
# Use the public blog URL, not localhost inside the container:
ghost-purge-images display --url=https://yourblog.com
```

💡 If the scan fails with HTTP 403, set `--url` (or `GHOST_URL`) to the URL you open in the browser. Config inside the container often points at `http://localhost:2368`, which the Admin API rejects for external-style requests.

## ⚡️ Commands
### `display`

Print the list of all uploaded images that currently are not being used in any post, page or metadata. Attempts to predict any errors before running a destructive command.

```sh
ghost-purge-images display
```

![ghost-purge-images display screenshot](https://user-images.githubusercontent.com/1589874/51084812-80e6f700-1730-11e9-96c4-4e106e4c7c63.png)

### `backup`

Copy unused uploads into a timestamped archive. Originals stay in place. Each archive includes a `manifest.json` so `restore` can put the files back.

Default parent folder: `content/ghost-purge-backup`

```sh
ghost-purge-images backup
ghost-purge-images backup --backup-path=/var/backups/ghost-uploads
ghost-purge-images backup --yes
```

### `quarantine`

Move unused uploads into a timestamped archive instead of deleting them ([#21](https://github.com/growblog/ghost-purge-images/issues/21)). Ghost stops serving those files, but you can bring them back with `restore`.

Default parent folder: `content/ghost-purge-quarantine`

```sh
ghost-purge-images quarantine
ghost-purge-images quarantine --quarantine-path=/var/backups/ghost-quarantine
ghost-purge-images quarantine --yes
```

### `restore`

Copy files from a previous `backup` or `quarantine` archive back to their original paths.

- Pass `--from` to restore a specific archive folder (the one that contains `manifest.json`).
- Without `--from`, the newest archive under the default backup or quarantine parent folders is used.

```sh
ghost-purge-images restore
ghost-purge-images restore --from=content/ghost-purge-quarantine/2026-11-12T12-00-00-000Z
ghost-purge-images restore --yes
```

### `purge`

Delete all the unused files permanently.

⚠️ WARNING: Prefer `backup` or `quarantine` first. `purge` cannot undo a delete.

```sh
ghost-purge-images purge
ghost-purge-images purge --yes
```

![ghost-purge-images purge screenshot](https://user-images.githubusercontent.com/1589874/51084808-73ca0800-1730-11e9-8c2a-a3b43551fbaa.png)

## 📦 Archive layout

`backup` and `quarantine` create a folder like this:

```text
content/ghost-purge-quarantine/2026-11-12T12-00-00-000Z/
  manifest.json
  images/2024/01/orphan.jpg
  media/2024/unused.mp4
```

Example `manifest.json`:

```json
{
  "version": 1,
  "mode": "quarantine",
  "createdAt": "2026-11-12T12:00:00.000Z",
  "files": [
    {
      "source": "/var/www/ghost/content/images/2024/01/orphan.jpg",
      "storedAs": "images/2024/01/orphan.jpg",
      "size": 245760
    }
  ]
}
```

`restore` reads `storedAs` from that archive and writes each file back to `source`.

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

- ### `backup-path`

💡 The **default backup parent** is `content/ghost-purge-backup`

Each run creates a new timestamped folder under that parent.

- ### `quarantine-path`

💡 The **default quarantine parent** is `content/ghost-purge-quarantine`

Each run creates a new timestamped folder under that parent.

- ### `from`

💡 Used by `restore`. Path to one archive folder that contains `manifest.json`.

- ### `exclude-ext`

💡 No **default value**, all extensions are included

You can exclude one or more file extensions. Examples:
  - Excluding `.webp` files, adding the optional param `... --exclude-ext=webp`
  - Excluding `.jpg` and `.gif` files (add a comma), adding the optional param `... --exclude-ext=jpg,gif`

## 📋 Changelog
See [CHANGELOG.md](https://github.com/growblog/ghost-purge-images/blob/master/CHANGELOG.md)

## 👋 Credits
David Burgos from [Growblog](https://growblog.io)

## 👏 Contributors
- [scottleechua](https://github.com/growblog/ghost-purge-images/pull/43)
- [mesquka](https://github.com/mesquka/ghost-purge-images-customdir/commits?author=mesquka)

## ✒️ License
See LICENSE file
