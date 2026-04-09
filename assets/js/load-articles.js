// load-articles.js — fetch article list from data/posts.json and render cards
// Used on both index.html (homepage) and pages/best-of.html

(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Resolve the article URL relative to the current page location
  function articleUrl(slug) {
    // If we're in the pages/ subdirectory, we need ../articles/
    // If we're at the root, we need articles/
    const inPages = window.location.pathname.includes('/pages/');
    const base = inPages ? '../articles/' : 'articles/';
    return base + encodeURIComponent(slug) + '.html';
  }

  // Resolve the data/posts.json path relative to current page
  function postsJsonUrl() {
    const inPages = window.location.pathname.includes('/pages/');
    return inPages ? '../data/posts.json' : 'data/posts.json';
  }

  function card(p) {
    const url = articleUrl(p.slug);
    return [
      '<a class="card" href="' + url + '">',
      '  <div class="cardMeta">',
      '    <span class="badge2"><span class="bDot" aria-hidden="true"></span>' + esc(p.category) + '</span>',
      '    <span>' + esc(p.readingTime || '') + '</span>',
      '    <span class="sep">•</span>',
      '    <span>' + esc(p.date || '') + '</span>',
      '  </div>',
      '  <div class="cardTitle2">' + esc(p.title) + '</div>',
      '  <p>' + esc(p.summary || '') + '</p>',
      '  <div class="cardMeta"><span class="link">Read post →</span></div>',
      '</a>'
    ].join('\n');
  }

  // ── Homepage widget (index.html) ───────────────────────────────────────────
  async function initHomeWidget() {
    const latestEl = document.getElementById('latestCards');
    if (!latestEl) return;
    try {
      const res = await fetch(postsJsonUrl(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const posts = await res.json();
      const published = posts.filter(function (p) { return p.published !== false; });
      latestEl.innerHTML = published.slice(0, 6).map(card).join('');
    } catch (err) {
      console.error('load-articles: failed to load posts', err);
      if (latestEl) {
        latestEl.innerHTML = '<div class="notice"><div class="noticeDot"></div><div><strong>Error:</strong> couldn\'t load articles.</div></div>';
      }
    }
  }

  // ── Posts list page (pages/best-of.html) ──────────────────────────────────
  var POSTS = [];
  var activeChip = '';

  function renderList() {
    var cardsEl = document.getElementById('cards');
    var qEl = document.getElementById('q');
    var catEl = document.getElementById('cat');
    var emptyEl = document.getElementById('empty');
    var chipsEl = document.getElementById('chips');

    if (!cardsEl) return;

    var q = (qEl ? qEl.value : '').trim().toLowerCase();
    var cat = activeChip || (catEl ? catEl.value : '');

    var out = POSTS.filter(function (p) {
      var matchesQ = !q || (p.title + ' ' + p.summary + ' ' + p.category).toLowerCase().includes(q);
      var matchesCat = !cat || p.category === cat;
      return matchesQ && matchesCat;
    });

    cardsEl.innerHTML = out.map(card).join('');
    if (emptyEl) emptyEl.hidden = out.length !== 0;
    if (catEl && activeChip) catEl.value = activeChip;
  }

  function setChips(cats) {
    var chipsEl = document.getElementById('chips');
    if (!chipsEl) return;
    chipsEl.innerHTML = cats.slice(0, 10).map(function (c) {
      return '<button class="chipBtn" type="button" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');

    chipsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.chipBtn');
      if (!btn) return;
      var c = btn.getAttribute('data-cat') || '';
      [].forEach.call(chipsEl.querySelectorAll('.chipBtn'), function (b) { b.classList.remove('active'); });
      if (activeChip === c) { activeChip = ''; renderList(); return; }
      activeChip = c;
      btn.classList.add('active');
      renderList();
    });
  }

  function setCategoryGrid(cats) {
    var catGridEl = document.getElementById('catGrid');
    if (!catGridEl) return;
    var counts = {};
    cats.forEach(function (c) {
      counts[c] = POSTS.filter(function (p) { return p.category === c; }).length;
    });
    catGridEl.innerHTML = cats.map(function (c) {
      return '<div class="catTile" role="button" tabindex="0" data-cat="' + esc(c) + '">'
        + '<div class="catName">' + esc(c) + '</div>'
        + '<div class="catCount">' + counts[c] + ' posts</div>'
        + '</div>';
    }).join('');

    var activate = function (c) {
      var qEl = document.getElementById('q');
      var catEl = document.getElementById('cat');
      var chipsEl = document.getElementById('chips');
      activeChip = c;
      if (catEl) catEl.value = c;
      if (qEl) qEl.value = '';
      if (chipsEl) {
        [].forEach.call(chipsEl.querySelectorAll('.chipBtn'), function (b) {
          b.classList.toggle('active', b.getAttribute('data-cat') === c);
        });
      }
      renderList();
      window.location.hash = '#list';
    };

    catGridEl.addEventListener('click', function (e) {
      var tile = e.target.closest('.catTile');
      if (tile) activate(tile.getAttribute('data-cat') || '');
    });
    catGridEl.addEventListener('keydown', function (e) {
      var tile = e.target.closest('.catTile');
      if (tile && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); activate(tile.getAttribute('data-cat') || ''); }
    });
  }

  async function initListPage() {
    var cardsEl = document.getElementById('cards');
    if (!cardsEl) return;

    var qEl = document.getElementById('q');
    var catEl = document.getElementById('cat');
    var clearBtn = document.getElementById('clearBtn');
    var emptyEl = document.getElementById('empty');

    try {
      var res = await fetch(postsJsonUrl(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var all = await res.json();
      POSTS = all.filter(function (p) { return p.published !== false; });

      var cats = [...new Set(POSTS.map(function (p) { return p.category; }))].sort();

      if (catEl) {
        catEl.innerHTML = '<option value="">All categories</option>'
          + cats.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
      }
      setChips(cats);
      setCategoryGrid(cats);
      renderList();

      if (qEl) qEl.addEventListener('input', function () { activeChip = ''; renderList(); });
      if (catEl) catEl.addEventListener('change', function () { activeChip = ''; renderList(); });

      var doClear = function () {
        if (qEl) qEl.value = '';
        if (catEl) catEl.value = '';
        activeChip = '';
        var chipsEl = document.getElementById('chips');
        if (chipsEl) [].forEach.call(chipsEl.querySelectorAll('.chipBtn'), function (b) { b.classList.remove('active'); });
        renderList();
        if (window.toast) window.toast('Cleared');
      };
      if (clearBtn) clearBtn.addEventListener('click', doClear);
      var clearBtn2 = document.getElementById('clearBtn2');
      if (clearBtn2) clearBtn2.addEventListener('click', doClear);

    } catch (err) {
      console.error('load-articles: failed to load list', err);
      if (cardsEl) cardsEl.innerHTML = '<div class="notice"><div class="noticeDot"></div><div><strong>Error:</strong> couldn\'t load posts.</div></div>';
    }
  }

  // Auto-detect which mode to run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('latestCards')) initHomeWidget();
      if (document.getElementById('cards')) initListPage();
    });
  } else {
    if (document.getElementById('latestCards')) initHomeWidget();
    if (document.getElementById('cards')) initListPage();
  }

})();
