# README

Static website for my personal website [danbradbury.net](https://danbradbury.net)

## Architecture

This is a static site that converts markdown blog posts to HTML using pandoc and deploys them via GitHub Actions.

- `site/style.css` — shared theme (terminal/Vim look in Oregon Duck green `#154733` & yellow `#FEE123`) used by the home page and every post
- `site/vim.js` — shared Vim keybindings (`j`/`k`, `gg`/`G`, `Ctrl-d`/`Ctrl-u`, `/` search with `n`/`N`), statusline position, and image zoom
- `templates/post_template.html` — pandoc template for posts
- `scripts/social_metadata.lua` — Open Graph titles and descriptions for posts; descriptions use the opening paragraph unless `description` is set in Markdown front matter
- `site/og-image.png` — shared 1200 × 630 social preview image for the home page and posts

## Deployment

The site is automatically deployed via the `.github/workflows/deploy-site.yml` workflow on every push.

### Deployment Process

1. **Convert Markdown to HTML**: The `scripts/convert-markdown-posts.sh` script uses pandoc to convert all markdown files in the `posts/` directory to HTML, placing them in the `site/` directory
2. **Version static assets**: The same script appends a content hash to the `style.css` and `vim.js` links in every page (e.g. `style.css?v=32439892f5`) so changed assets get a new URL
3. **Deploy via rsync**: The `site/` directory contents are deployed to the server using rsync over SSH
4. **Reload nginx**: After deployment, nginx is reloaded on the server to serve the updated content

### Cloudflare

The domain is proxied through Cloudflare, which sits in front of the nginx server as a CDN. Static assets are served with `cache-control: public, max-age=31536000, immutable`, so Cloudflare and browsers keep them for up to a year. HTML pages are not cached (`cf-cache-status: DYNAMIC`).

That's why step 2 exists: without the `?v=` hash, CSS/JS changes would deploy to the server but visitors would keep getting the old cached file. If a stale asset ever does get stuck, purge it in the Cloudflare dashboard (Caching → Configuration → Purge Cache).

### Requirements

- **pandoc**: Used for markdown to HTML conversion
- **SSH access**: Deployment uses SSH with a private key stored in GitHub secrets
- **Server**: nginx web server running on the target server at `/var/www/danbradbury.net/`
- **Cloudflare**: DNS for danbradbury.net, proxied through Cloudflare's CDN
