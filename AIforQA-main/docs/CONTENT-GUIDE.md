# Content Guide

Documentation for managing content on AIforQA.

## Repository Structure

```
AIforQA/
├── content/                        # Article body fragments (one .html per post)
│   └── <slug>.html                 # Loaded dynamically by post.js
├── data/
│   └── posts.json                  # Single source of post metadata (title, slug, date, etc.)
├── posts/
│   └── <slug>/
│       └── document.pdf            # Downloadable PDF version of the post (optional)
├── docs/                           # Internal guides (not served as site content)
├── index.html                      # Homepage
├── best-of.html                    # Full posts listing (uses list.js + data/posts.json)
├── post.html                       # Post template (uses post.js)
├── post.js                         # Loads post metadata + content fragment dynamically
├── list.js                         # Drives best-of.html filtering/search
├── home.js                         # Drives index.html latest-posts cards
└── styles.css / script.js          # Shared styles and utilities
```

## Adding a New Post

1. **Add metadata** to `data/posts.json`:
   ```json
   {
     "slug": "my-post-slug",
     "title": "My Post Title",
     "summary": "One-sentence description shown in cards.",
     "category": "Category Name",
     "date": "YYYY-MM-DD",
     "readingTime": "X min read",
     "published": true
   }
   ```
   Omit `"published": true` if the post is not yet ready (it will still appear in the listing
   but will not surface in the "Related posts" sidebar on other post pages).

2. **Create the article body fragment** at `content/<slug>.html`.  
   The file should contain only the inner HTML (no `<html>`, `<head>`, or `<body>` tags) — it
   is injected verbatim into the `<div id="postContent">` container by `post.js`.

3. **Optionally add a PDF** at `posts/<slug>/document.pdf` and add the path to the metadata:
   ```json
   "pdf": "posts/<slug>/document.pdf"
   ```
   A "Download PDF" button will appear automatically on the post page.

## Rules

- **One content source per post.** The canonical article body lives in `content/<slug>.html`.
  Do not duplicate content as separate full HTML pages or other formats.
- **No stub/placeholder files.** Remove any file whose content is an empty object or a
  placeholder value before committing.
- **PDF files go in `posts/<slug>/document.pdf`.** Do not commit pdf2htmlEX-generated HTML
  files — they are large, redundant, and not used by the site.
