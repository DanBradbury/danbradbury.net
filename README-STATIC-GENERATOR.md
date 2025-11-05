# Static Site Generator

This script generates static HTML pages from markdown posts in the `/posts` directory.

## Usage

```bash
node generate-static-pages.js
```

## What it does

1. Reads all markdown files from the `/posts` directory
2. Parses each post to extract:
   - Title (from the `title:` line)
   - Date (from the filename in YYYY-MM-DD format)
   - Content (markdown after the `----` separator)
3. Converts markdown to HTML
4. Generates a static HTML page for each post in `/site/posts/`
5. Updates the homepage (`/site/index.html`) with the 5 most recent posts

## Post Format

Posts should be formatted as:

```
title: Your Post Title
----

Your markdown content goes here...
```

The filename should follow the pattern: `YYYY-MM-DD-slug.md`

## Output

- Individual post pages: `/site/posts/{slug}.html`
- Updated homepage: `/site/index.html` (RECENT POSTS section)

## Features

- Vim-themed styling matching the homepage
- Basic markdown to HTML conversion (headers, links, images, code blocks, etc.)
- Responsive design
- Mobile-friendly
