#!/bin/bash

set -euo pipefail

# Convert all markdown files in /posts to HTML in /site
recent_posts_html=""

# Sort markdown files in reverse order (newest to oldest)
for md_file in $(ls -1 posts/*.md | sort -r); do
    # Get filename without path and extension
    filename=$(basename "$md_file" .md)

    # Extract the first line of the Markdown file as the title
    title=$(sed -n '2s/^title: //p' "$md_file" | sed 's/^["'\'']\(.*\)["'\'']$/\1/')

    # Extract the date from the filename (e.g., 2025-01-15-my-post.md -> 2025-01-15)
    date=$(echo "$filename" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}')

    # Convert to HTML
    pandoc "$md_file" \
        --template=templates/post_template.html \
        --wrap=none \
        --lua-filter=scripts/wrap_codeblocks.lua \
        --lua-filter=scripts/social_metadata.lua \
        --syntax-definition=scripts/syntax/vim.xml \
        --syntax-definition=scripts/syntax/haml.xml \
        --metadata date="$date" \
        --variable file="$filename" \
        -o "site/${filename}.html"

    # Reuse Pandoc's rendered tags so YAML indentation, quoting, and HTML
    # escaping behave identically on the home page and individual posts.
    tags=$(sed -n 's/.*<div class="tag-list">\(.*\)<\/div>.*/\1/p' "site/${filename}.html")

    # Append to the recent posts HTML
    recent_posts_html+="<li class=\"post-row\">\n"
    recent_posts_html+="    <time class=\"post-date\" datetime=\"$date\">$date</time>\n"
    recent_posts_html+="    <a class=\"post-title\" href=\"$filename.html\">$title</a>\n"
    recent_posts_html+="    <span class=\"post-tags\">"
    recent_posts_html+="$tags"
    recent_posts_html+="</span>\n"
    recent_posts_html+="</li>\n"

    echo "Converted: $md_file -> site/${filename}.html"
done

# Escape special sed characters in the replacement string
recent_posts_html_escaped=$(echo "$recent_posts_html" | sed 's/&/\\&/g')

# Replace the "RECENT POSTS" section in index.html
index_tmp=$(mktemp)
sed 's|^        PLACEHOLDER_FOR_POSTS\r*$|'"$recent_posts_html_escaped"'|' index.html > "$index_tmp"
cat "$index_tmp" > site/index.html
rm "$index_tmp"

echo "Updated RECENT POSTS section in site/index.html"

# Standalone pages: each pages/<name>/index.html is served at /<name>
if [ -d pages ]; then
    cp -R pages/. site/
    echo "Copied standalone pages to site/"
fi

# Cache-bust static assets: Cloudflare caches them as immutable, so give each
# version a unique URL based on its content hash
for asset in style.css vim.js; do
    hash=$(sha256sum "site/$asset" | cut -c1-10)
    sed -i -E "s#(href|src)=\"(/?)$asset(\?v=[a-f0-9]+)?\"#\1=\"\2$asset?v=$hash\"#" site/*.html site/*/index.html
done

echo "Versioned static assets in site/*.html"
