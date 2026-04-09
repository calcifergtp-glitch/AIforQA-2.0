// post page: read slug from query param ?p=..., load metadata + content fragment, build TOC + related
const contentEl = document.getElementById('postContent');
const catEl = document.getElementById('postCat');
const dateEl = document.getElementById('postDate');
const readEl = document.getElementById('postRead');
const tocListEl = document.getElementById('tocList');
const relatedEl = document.getElementById('relatedCards');
const postTitleEl = document.getElementById('postTitle');
const pdfBtnEl = document.getElementById('pdfBtn');

function getSlug(){
  const u = new URL(window.location.href);
  return u.searchParams.get('p');
}
function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function setTitle(t){
  document.title = t ? `${t} • AI for QA` : 'Post • AI for QA';
}

function buildTOC(root){
  if(!tocListEl || !root) return;
  const hs = [...root.querySelectorAll('h2')];
  if(hs.length === 0){
    tocListEl.innerHTML = '<div style="color:rgba(11,16,32,.55)">No sections yet.</div>';
    return;
  }
  tocListEl.innerHTML = hs.map(h=>{
    if(!h.id){
      h.id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    }
    return `<a href="#${esc(h.id)}">${esc(h.textContent)}</a>`;
  }).join('');
}

function card(p){
  const url = `post.html?p=${encodeURIComponent(p.slug)}`;
  return `
    <a class="card" href="${url}">
      <div class="cardMeta">
        <span class="badge2"><span class="bDot" aria-hidden="true"></span>${esc(p.category)}</span>
        <span>${esc(p.readingTime || '')}</span>
      </div>
      <div class="cardTitle2">${esc(p.title)}</div>
      <p>${esc(p.summary || '')}</p>
      <div class="cardMeta"><span class="link">Open</span></div>
    </a>
  `;
}

async function init(){
  const slug = getSlug();
  if(!slug){
    contentEl && (contentEl.innerHTML = `<div class="notice"><div class="noticeDot"></div><div><strong>Missing post.</strong> Open from the Posts list.</div></div>`);
    return;
  }

  // load metadata
  let posts;
  try{
    const res = await fetch('data/posts.json', {cache:'no-store'});
    if(!res.ok) throw new Error(`Failed to fetch posts metadata: HTTP ${res.status}`);
    posts = await res.json();
  }catch(err){
    contentEl && (contentEl.innerHTML = `<div class="notice"><div class="noticeDot"></div><div><strong>Error:</strong> couldn't load post metadata.</div></div>`);
    return;
  }
  const post = posts.find(p => p.slug === slug);

  if(!post){
    contentEl && (contentEl.innerHTML = `<div class="notice"><div class="noticeDot"></div><div><strong>Not found.</strong> That slug doesn't exist in posts.json.</div></div>`);
    return;
  }

  setTitle(post.title);
  if(postTitleEl) postTitleEl.textContent = post.title;
  if(catEl) catEl.textContent = post.category;
  if(dateEl) dateEl.textContent = post.date || '';
  if(readEl) readEl.textContent = post.readingTime || '';

  // PDF download button: only allow safe relative paths (no protocol, absolute paths, or path traversal)
  if(post.pdf && pdfBtnEl && /^[^/:][^:]*$/.test(post.pdf) && !post.pdf.includes('..')){
    pdfBtnEl.href = encodeURI(post.pdf);
    pdfBtnEl.style.display = '';
  }

  // load content fragment
  try{
    const c = await fetch(`content/${encodeURIComponent(slug)}.html`, {cache:'no-store'});
    if(!c.ok) throw new Error(`Failed to fetch content fragment: HTTP ${c.status}`);
    const html = await c.text();
    if(contentEl) contentEl.innerHTML = html;
  }catch(err){
    console.error(err);
    if(contentEl) contentEl.innerHTML = `<div class="notice"><div class="noticeDot"></div><div><strong>Error:</strong> couldn't load content/${esc(slug)}.html</div></div>`;
  }

  // TOC
  buildTOC(contentEl);

  // Related: published posts only, same category preferred
  const published = posts.filter(p => p.published && p.slug !== slug);
  const same = published.filter(p => p.category === post.category);
  const pool = same.length ? same : published;
  const related = pool.slice(0, 6);
  if(relatedEl){
    relatedEl.innerHTML = related.length
      ? related.map(card).join('')
      : `<div class="notice"><div class="noticeDot" aria-hidden="true"></div><div>No related posts available yet.</div></div>`;
  }
}
init();
