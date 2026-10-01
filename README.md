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
2. **Deploy via rsync**: The `site/` directory contents are deployed to the server using rsync over SSH
3. **Reload nginx**: After deployment, nginx is reloaded on the server to serve the updated content

### Requirements

- **pandoc**: Used for markdown to HTML conversion
- **SSH access**: Deployment uses SSH with a private key stored in GitHub secrets
- **Server**: nginx web server running on the target server at `/var/www/danbradbury.net/`
