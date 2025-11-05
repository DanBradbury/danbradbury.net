#!/bin/bash

# Convert all markdown files in /posts to HTML in /site
for md_file in posts/*.md; do
    # Get filename without path and extension
    filename=$(basename "$md_file" .md)

    # Convert to HTML
    pandoc "$md_file" \
        --standalone \
        --metadata title="$filename" \
        --css style.css \
        -o "site/${filename}.html"

    echo "Converted: $md_file -> site/${filename}.html"
done

echo "Conversion complete!"
