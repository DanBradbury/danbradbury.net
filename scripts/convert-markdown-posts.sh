#!/bin/bash

# Convert all markdown files in /posts to HTML in /site
recent_posts_html=""

# Sort markdown files in reverse order (newest to oldest)
for md_file in $(ls -1 posts/*.md | sort -r); do
    # Get filename without path and extension
    filename=$(basename "$md_file" .md)

    # Extract the first line of the Markdown file as the title
    title=$(sed -n '2s/^title: //p' "$md_file")

    # Extract the date from the filename (e.g., 2025-01-15-my-post.md -> 2025-01-15)
    date=$(echo "$filename" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}')

    tags=$(sed -n '/^tags:/,/^.../p' "$md_file" | sed '1d;$d' | sed 's/^- //g' | tr '\n' ',' | sed 's/,$//')

    # Append to the recent posts HTML
    recent_posts_html+="<div style=\"margin: 10px 0;\">\n"
    recent_posts_html+="    <a href=\"$filename.html\">$date</a> $title\n"
    recent_posts_html+="    <div class=\"tags\">\n"
    IFS=','
    for tag in $tags; do
      recent_posts_html+="      <span class=\"tag\">$tag</span>\n"
    done
    recent_posts_html+="    </div>\n"
    recent_posts_html+="</div>\n"

    # Convert to HTML
    pandoc "$md_file" \
        --template=templates/post_template.html \
        --lua-filter=scripts/wrap_codeblocks.lua \
        -o "site/${filename}.html"

    echo "Converted: $md_file -> site/${filename}.html"
done

# Replace the "RECENT POSTS" section in index.html
sed -i '/<h2 id="blog">RECENT POSTS<\/h2>/,/<\/div>/c\
<h2 id="blog">RECENT POSTS</h2>\
'"$recent_posts_html"'\
' site/index.html

echo "Updated RECENT POSTS section in site/index.html"
