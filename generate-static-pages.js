#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const POSTS_DIR = path.join(__dirname, 'posts');
const SITE_DIR = path.join(__dirname, 'site');
const POSTS_OUTPUT_DIR = path.join(SITE_DIR, 'posts');

// Ensure output directories exist
if (!fs.existsSync(SITE_DIR)) {
  fs.mkdirSync(SITE_DIR, { recursive: true });
}
if (!fs.existsSync(POSTS_OUTPUT_DIR)) {
  fs.mkdirSync(POSTS_OUTPUT_DIR, { recursive: true });
}

// Parse a markdown post file
function parsePost(filename, content) {
  const lines = content.split('\n');
  
  // Extract title (first line after "title:")
  let title = '';
  let contentStart = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('title:')) {
      title = lines[i].substring(6).trim().replace(/^["']|["']$/g, '');
      // Find the separator line (----)
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim().match(/^-+$/)) {
          contentStart = j + 1;
          break;
        }
      }
      break;
    }
  }
  
  // Extract date from filename (YYYY-MM-DD format)
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : '';
  
  // Extract slug from filename
  const slug = filename.replace(/\.md$/, '');
  
  // Get the content (everything after the separator)
  const markdownContent = lines.slice(contentStart).join('\n').trim();
  
  return {
    title,
    date,
    slug,
    filename,
    content: markdownContent
  };
}

// Simple markdown to HTML converter (basic implementation)
function markdownToHtml(markdown) {
  let html = markdown;
  
  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || ''}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Paragraphs
  html = html.split('\n\n').map(para => {
    para = para.trim();
    if (!para) return '';
    if (para.startsWith('<')) return para;
    return `<p>${para.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  
  return html;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Generate HTML template for a post
function generatePostHtml(post) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(post.title)} - ~/dev/docs</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bg-primary: #1c1c1c;
            --bg-secondary: #262626;
            --text-primary: #87ff87;
            --text-secondary: #5fd75f;
            --text-dim: #5f875f;
            --link-color: #87afff;
            --link-hover: #afd7ff;
            --border-color: #444444;
            --highlight-bg: #3a3a3a;
        }

        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            line-height: 1.6;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            padding: 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 80ch;
            margin: 0 auto;
            width: 100%;
        }

        .header {
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .back-link {
            color: var(--link-color);
            text-decoration: none;
            font-size: 12px;
            display: inline-block;
            margin-bottom: 10px;
        }

        .back-link:hover {
            color: var(--link-hover);
            text-decoration: underline;
        }

        .back-link:before {
            content: '← ';
        }

        h1 {
            color: var(--text-primary);
            font-size: 24px;
            font-weight: normal;
            margin: 20px 0;
        }

        .post-meta {
            color: var(--text-dim);
            font-size: 12px;
            margin-bottom: 30px;
        }

        .post-content {
            line-height: 1.8;
        }

        .post-content h2 {
            color: var(--text-primary);
            font-size: 18px;
            font-weight: normal;
            margin: 30px 0 15px 0;
            padding: 5px;
            background: var(--bg-secondary);
            border-left: 3px solid var(--text-secondary);
        }

        .post-content h3 {
            color: var(--text-secondary);
            font-size: 16px;
            font-weight: normal;
            margin: 25px 0 10px 0;
        }

        .post-content p {
            margin: 15px 0;
            color: var(--text-primary);
        }

        .post-content a {
            color: var(--link-color);
            text-decoration: none;
        }

        .post-content a:hover {
            color: var(--link-hover);
            text-decoration: underline;
        }

        .post-content code {
            background: var(--bg-secondary);
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            color: var(--text-secondary);
        }

        .post-content pre {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            padding: 15px;
            margin: 20px 0;
            overflow-x: auto;
            border-radius: 3px;
        }

        .post-content pre code {
            background: none;
            padding: 0;
            color: var(--text-primary);
        }

        .post-content img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px 0;
            border: 1px solid var(--border-color);
        }

        .post-content strong {
            color: var(--text-secondary);
        }

        .post-content em {
            color: var(--text-dim);
            font-style: italic;
        }

        .post-content blockquote {
            border-left: 3px solid var(--text-secondary);
            padding-left: 15px;
            margin: 20px 0;
            color: var(--text-dim);
        }

        .separator {
            color: var(--text-dim);
            margin: 30px 0;
            overflow: hidden;
            white-space: nowrap;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            text-align: center;
            color: var(--text-dim);
            font-size: 12px;
        }

        @media (max-width: 768px) {
            body {
                font-size: 13px;
                padding: 10px;
            }

            h1 {
                font-size: 20px;
            }

            .post-content h2 {
                font-size: 16px;
            }

            .post-content h3 {
                font-size: 14px;
            }

            .post-content pre {
                padding: 10px;
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <a href="/" class="back-link">Back to home</a>
            <h1>${escapeHtml(post.title)}</h1>
            <div class="post-meta">${post.date}</div>
        </header>

        <div class="separator">
            ================================================================================
        </div>

        <article class="post-content">
            ${markdownToHtml(post.content)}
        </article>

        <div class="separator">
            --------------------------------------------------------------------------------
        </div>

        <footer class="footer">
            <div>
                vim:tw=78:ts=8:ft=help:norl: | Generated with &lt;3 and Vim
            </div>
        </footer>
    </div>
</body>
</html>`;
}

// Main function
function generateStaticPages() {
  console.log('🚀 Generating static pages from posts...\n');
  
  // Read all markdown files from posts directory
  const files = fs.readdirSync(POSTS_DIR)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse(); // Most recent first
  
  console.log(`📝 Found ${files.length} posts\n`);
  
  const posts = [];
  
  // Process each post
  files.forEach(filename => {
    const filePath = path.join(POSTS_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const post = parsePost(filename, content);
    
    // Generate HTML
    const html = generatePostHtml(post);
    
    // Write to output directory
    const outputPath = path.join(POSTS_OUTPUT_DIR, `${post.slug}.html`);
    fs.writeFileSync(outputPath, html);
    
    console.log(`✅ Generated: ${post.slug}.html`);
    console.log(`   Title: ${post.title}`);
    console.log(`   Date: ${post.date}\n`);
    
    posts.push(post);
  });
  
  // Update homepage with recent posts
  updateHomepage(posts.slice(0, 5));
  
  console.log(`\n✨ Successfully generated ${posts.length} static pages!`);
  console.log(`📂 Output directory: ${POSTS_OUTPUT_DIR}`);
}

// Update the homepage with recent posts
function updateHomepage(recentPosts) {
  const indexPath = path.join(SITE_DIR, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.warn('⚠️  Warning: index.html not found, skipping homepage update');
    return;
  }
  
  let html = fs.readFileSync(indexPath, 'utf-8');
  
  // Generate the recent posts HTML
  const postsHtml = recentPosts.map(post => {
    return `            <div style="margin: 10px 0;">
                <a href="/posts/${post.slug}.html">${post.date}</a> ${escapeHtml(post.title)}
            </div>`;
  }).join('\n');
  
  // Replace the RECENT POSTS section - find it between the h2 and the next h2
  const recentPostsRegex = /(<h2 id="blog">RECENT POSTS<\/h2>\s*<div class="section">)([\s\S]*?)(<\/div>\s*<h2)/;
  
  if (recentPostsRegex.test(html)) {
    html = html.replace(recentPostsRegex, `$1\n${postsHtml}\n        $3`);
    fs.writeFileSync(indexPath, html);
    console.log('\n✅ Updated homepage with recent posts');
  } else {
    console.warn('⚠️  Warning: Could not find RECENT POSTS section in homepage');
  }
}

// Run the script
try {
  generateStaticPages();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
