// github-api.js — GitHub API helpers for the admin dashboard
// Handles token verification, file creation, and article commits.
// The Personal Access Token is entered by the admin and never stored persistently.

(function (global) {
  'use strict';

  var REPO_OWNER = 'calcifergtp-glitch';
  var REPO_NAME  = 'AIforQA-2.0';
  var API_BASE   = 'https://api.github.com';

  // ── Helpers ────────────────────────────────────────────────────────────────

  function authHeaders(token) {
    return {
      'Authorization': 'token ' + token,
      'Accept':        'application/vnd.github.v3+json',
      'Content-Type':  'application/json'
    };
  }

  /**
   * Convert a plain string to Base64 (required by the GitHub Contents API).
   */
  function toBase64(str) {
    // UTF-8 safe Base64 encoding (avoids deprecated unescape())
    var bytes = new TextEncoder().encode(str);
    var binary = Array.from(bytes, function(b){ return String.fromCharCode(b); }).join('');
    return btoa(binary);
  }

  /**
   * Slugify a title to produce a safe filename.
   * E.g. "My Article Title" → "my-article-title"
   */
  function slugify(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // ── GitHub API calls ───────────────────────────────────────────────────────

  /**
   * Verify that the supplied token belongs to the expected repo owner.
   * Returns the authenticated user object on success, throws on failure.
   */
  async function verifyOwner(token) {
    var res = await fetch(API_BASE + '/user', { headers: authHeaders(token) });
    if (!res.ok) {
      var body = await res.json().catch(function () { return {}; });
      throw new Error(body.message || 'Authentication failed (HTTP ' + res.status + ')');
    }
    var user = await res.json();
    if (user.login !== REPO_OWNER) {
      throw new Error('Access denied: only the repository owner (' + REPO_OWNER + ') can use this dashboard.');
    }
    return user;
  }

  /**
   * Get the current SHA of a file (needed for updates). Returns null if the file
   * does not exist yet (i.e. this is a new article).
   */
  async function getFileSHA(token, path) {
    var url = API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + encodeURIComponent(path);
    var res = await fetch(url, { headers: authHeaders(token) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Could not check file existence (HTTP ' + res.status + ')');
    var data = await res.json();
    return data.sha || null;
  }

  /**
   * Create or update a file in the repository via the GitHub Contents API.
   * @param {string} token  - Personal Access Token
   * @param {string} path   - Repo-relative file path, e.g. "articles/my-article.html"
   * @param {string} content - Raw file content (will be Base64-encoded)
   * @param {string} message - Commit message
   * @returns GitHub API response object
   */
  async function createOrUpdateFile(token, path, content, message) {
    var sha  = await getFileSHA(token, path);
    var body = {
      message: message,
      content: toBase64(content)
    };
    if (sha) body.sha = sha;  // required for updates

    var url = API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + encodeURIComponent(path);
    var res = await fetch(url, {
      method:  'PUT',
      headers: authHeaders(token),
      body:    JSON.stringify(body)
    });
    if (!res.ok) {
      var err = await res.json().catch(function () { return {}; });
      throw new Error(err.message || 'Failed to commit file (HTTP ' + res.status + ')');
    }
    return res.json();
  }

  /**
   * Build a full standalone HTML article page from title + HTML body content.
   */
  function buildArticlePage(title, bodyHtml, slug) {
    return '<!doctype html>\n'
      + '<html lang="en">\n'
      + '<head>\n'
      + '<!-- Google tag (gtag.js) -->\n'
      + '<script async src="https://www.googletagmanager.com/gtag/js?id=G-H34JX0MFZ4"></script>\n'
      + '<script>\n'
      + '  window.dataLayer = window.dataLayer || [];\n'
      + '  function gtag(){dataLayer.push(arguments);}\n'
      + '  gtag(\'js\', new Date());\n'
      + '  gtag(\'config\', \'G-H34JX0MFZ4\');\n'
      + '</script>\n'
      + '  <meta charset="utf-8" />\n'
      + '  <meta name="google-adsense-account" content="ca-pub-8632401241613937">\n'
      + '  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8632401241613937"\n'
      + '       crossorigin="anonymous"></script>\n'
      + '  <meta name="viewport" content="width=device-width,initial-scale=1" />\n'
      + '  <title>' + escHtml(title) + ' • AI for QA</title>\n'
      + '  <link rel="stylesheet" href="../assets/css/styles.css" />\n'
      + '</head>\n'
      + '<body class="postPage">\n'
      + '  <div class="bg"><div class="grid"></div><div class="lines" aria-hidden="true"></div></div>\n'
      + '  <header class="topbar">\n'
      + '    <a class="brand" href="../index.html"><span class="brandMark" aria-hidden="true"></span><span class="brandText">AI for QA</span></a>\n'
      + '    <nav class="nav" aria-label="Primary">\n'
      + '      <a href="../pages/best-of.html">Posts</a>\n'
      + '      <a href="#toc">On this page</a>\n'
      + '    </nav>\n'
      + '    <div class="actions"><a class="btn ghost" href="../pages/best-of.html">Back</a></div>\n'
      + '  </header>\n'
      + '  <main class="wrap postWrap">\n'
      + '    <article class="post">\n'
      + '      <h1 class="postTitle">' + escHtml(title) + '</h1>\n'
      + '      <div id="toc" class="toc" aria-label="Table of contents">\n'
      + '        <div class="tocTitle">On this page</div>\n'
      + '        <div id="tocList" class="tocList"></div>\n'
      + '      </div>\n'
      + '      <div class="postContent">\n'
      + bodyHtml + '\n'
      + '      </div>\n'
      + '    </article>\n'
      + '  </main>\n'
      + '  <footer class="footer">\n'
      + '    <div class="footInner">\n'
      + '      <div>\n'
      + '        <div class="footBrand"><span class="brandMark small" aria-hidden="true"></span>AI for QA</div>\n'
      + '        <div class="footNote">Educational content only. Not regulatory or legal advice.</div>\n'
      + '      </div>\n'
      + '      <div class="footNote">\n'
      + '        <a class="link" href="../pages/about.html">About</a> <span class="sep">•</span>\n'
      + '        <a class="link" href="../pages/affiliate-disclosure.html">Affiliate Disclosure</a> <span class="sep">•</span>\n'
      + '        <a class="link" href="../pages/privacy-policy.html">Privacy Policy</a> <span class="sep">•</span>\n'
      + '        <a class="link" href="../pages/terms-and-conditions.html">Terms</a> <span class="sep">•</span>\n'
      + '        <a class="link" href="../pages/disclaimer.html">Disclaimer</a> <span class="sep">•</span>\n'
      + '        <a class="link" href="../pages/cookie-policy.html">Cookie Policy</a>\n'
      + '      </div>\n'
      + '    </div>\n'
      + '  </footer>\n'
      + '  <script src="../assets/js/script.js"></script>\n'
      + '  <script>\n'
      + '    // Build table of contents from h2 headings\n'
      + '    (function(){\n'
      + '      var tocList = document.getElementById("tocList");\n'
      + '      var content = document.querySelector(".postContent");\n'
      + '      if(!tocList || !content) return;\n'
      + '      var hs = content.querySelectorAll("h2");\n'
      + '      if(!hs.length){ tocList.innerHTML = "<div style=\'color:rgba(11,16,32,.55)\'>No sections yet.</div>"; return; }\n'
      + '      tocList.innerHTML = Array.from(hs).map(function(h){\n'
      + '        if(!h.id) h.id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");\n'
      + '        return "<a href=\'#"+h.id+"\'>" + h.textContent + "</a>";\n'
      + '      }).join("");\n'
      + '    })();\n'
      + '  </script>\n'
      + '</body>\n'
      + '</html>\n';
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /**
   * Publish a new article:
   * 1. Creates the article HTML file in articles/
   * 2. Updates data/posts.json to add the new entry
   *
   * @param {string} token
   * @param {Object} article  { title, summary, category, bodyHtml }
   */
  async function publishArticle(token, article) {
    var slug    = slugify(article.title);
    var path    = 'articles/' + slug + '.html';
    var today   = new Date().toISOString().slice(0, 10);
    var html    = buildArticlePage(article.title, article.bodyHtml, slug);

    // 1. Commit the article HTML
    await createOrUpdateFile(
      token,
      path,
      html,
      'Add article: ' + article.title
    );

    // 2. Update data/posts.json
    var postsUrl = API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/data/posts.json';
    var postsRes = await fetch(postsUrl, { headers: authHeaders(token) });
    var postsData = null;
    var existingSha = null;
    var posts = [];

    if (postsRes.ok) {
      postsData   = await postsRes.json();
      existingSha = postsData.sha;
      try {
        posts = JSON.parse(atob(postsData.content.replace(/\n/g, '')));
      } catch (e) {
        posts = [];
      }
    }

    // Add new entry at the top
    posts.unshift({
      slug:        slug,
      title:       article.title,
      summary:     article.summary || '',
      category:    article.category || 'General',
      date:        today,
      readingTime: '',
      published:   true
    });

    var newJson = JSON.stringify(posts, null, 2);
    await createOrUpdateFile(token, 'data/posts.json', newJson, 'Update posts.json: add ' + article.title);

    return { slug: slug, path: path };
  }

  // ── Exports ────────────────────────────────────────────────────────────────
  global.GitHubAPI = {
    verifyOwner:    verifyOwner,
    publishArticle: publishArticle,
    slugify:        slugify
  };

})(window);
