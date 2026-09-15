# images.cheminfo.org

Crop, rotate, adjust, resize and compress images, in the browser. Nothing is
uploaded: files are decoded, edited and encoded on the visitor's machine, and
the output carries no EXIF metadata.

- **Edit** (`/`) — drop images, folders or ZIP archives; rotate, flip,
  straighten, crop, adjust exposure, brightness, contrast, gamma, saturation,
  hue and warmth; choose the size, JPEG quality or PNG; download one image or
  all of them as a ZIP.
- **Auto** (`/auto`) — set size and format once, drop images or folders, and
  get them back straight away: one image as itself, several as a ZIP with the
  folders kept.
- **About** (`/about`).

The site uses the family's chrome and libraries (`react-cheminfo`,
`react-science`, Blueprint) but is deliberately **not** part of
`ECOSYSTEM_SITES`: it does not appear in the other sites' Tools menu and links
to none of them.

## Development

```sh
npm install
npm run dev        # http://localhost:10915
npm run test       # unit tests, types, tokens, lint, format
npm run test-e2e   # Playwright
npm run build
```

## Deployment

```sh
cp .env.example .env
# uncomment exactly one COMPOSE_FILE line: port-published, traefik or cloudflared
docker compose up -d
```

| Mode        | File                       | Exposed as                         |
| ----------- | -------------------------- | ---------------------------------- |
| Port        | `compose.yaml` (default)   | `127.0.0.1:${PORT}`                |
| Traefik     | `compose.traefik.yaml`     | `images.cheminfo.org`              |
| Cloudflared | `compose.cloudflared.yaml` | the tunnel's published application |

The image is selected by `IMAGE_NAME` / `IMAGE_TAG`, which the server's deploy
script manages. Never run `git pull && docker compose up -d --build` by hand on
a server: it overwrites the running tag and leaves nothing to roll back to.

## Environment

| Variable          | Default                                | Purpose                                                                                                           |
| ----------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `COMPOSE_FILE`    | `compose.yaml`                         | Deployment mode                                                                                                   |
| `IMAGE_NAME`      | `ghcr.io/cheminfo/images.cheminfo.org` | Image to run                                                                                                      |
| `IMAGE_TAG`       | `latest`                               | Rewritten by the deploy script                                                                                    |
| `PORT`            | `10915`                                | Host port (`compose.yaml`) and dev server port                                                                    |
| `TRACKING_SCRIPT` | unset                                  | Analytics snippet, injected at the end of `<head>` of every served page by the entrypoint; a dev run never tracks |
| `TUNNEL_TOKEN`    | unset                                  | Cloudflare Tunnel token (`compose.cloudflared.yaml`)                                                              |

See [CHANGELOG.md](CHANGELOG.md).
