// best-of page: load posts.json, render cards, search + category filters
const cardsEl = document.getElementById('cards');
const qEl = document.getElementById('q');
const catEl = document.getElementById('cat');
const clearBtn = document.getElementById('clearBtn');
const emptyEl = document.getElementById('empty');
const chipsEl = document.getElementById('chips');
const catGridEl = document.getElementById('catGrid');

let POSTS = [];
let activeChip = '';

function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function card(p){
  const url = `post.html?p=${encodeURIComponent(p.slug)}`;
  return `
    <a class="card" href="${url}">
      <div class="cardMeta">
        <span class="badge2"><span class="bDot" aria-hidden="true"></span>${esc(p.category)}</span>
        <span>${esc(p.readingTime || '')}</span>
        <span class="sep">•</span>
        <span>${esc(p.date || '')}</span>
      </div>
      <div class="cardTitle2">${esc(p.title)}</div>
      <p>${esc(p.summary || '')}</p>
      <div class="cardMeta">
        <span class="link">Open post</span>
      </div>
    </a>
  `;
}

function render(){
  const q = (qEl?.value || '').trim().toLowerCase();
  const cat = activeChip || (catEl?.value || '');

  const out = POSTS.filter(p => {
    const matchesQ = !q || (p.title + ' ' + p.summary + ' ' + p.category).toLowerCase().includes(q);
    const matchesCat = !cat || p.category === cat;
    return matchesQ && matchesCat;
  });

  if(cardsEl) cardsEl.innerHTML = out.map(card).join('');
  if(emptyEl) emptyEl.hidden = out.length !== 0;

  // keep dropdown in sync if chip used
  if(catEl && activeChip) catEl.value = activeChip;
}

function setChips(cats){
  if(!chipsEl) return;
  chipsEl.innerHTML = cats.slice(0, 10).map(c => `
    <button class="chipBtn" type="button" data-cat="${esc(c)}">${esc(c)}</button>
  `).join('');

  chipsEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('.chipBtn');
    if(!btn) return;
    const c = btn.getAttribute('data-cat') || '';
    const all = [...chipsEl.querySelectorAll('.chipBtn')];
    all.forEach(b => b.classList.remove('active'));
    if(activeChip === c){
      activeChip = '';
      render();
      return;
    }
    activeChip = c;
    btn.classList.add('active');
    render();
  });
}

function setCategoryGrid(cats){
  if(!catGridEl) return;
  const counts = Object.fromEntries(cats.map(c => [c, POSTS.filter(p=>p.category===c).length]));
  catGridEl.innerHTML = cats.map(c => `
    <div class="catTile" role="button" tabindex="0" data-cat="${esc(c)}">
      <div class="catName">${esc(c)}</div>
      <div class="catCount">${counts[c]} posts</div>
    </div>
  `).join('');

  const activate = (c)=>{
    activeChip = c;
    if(catEl) catEl.value = c;
    if(qEl) qEl.value = '';
    // highlight chip if exists
    if(chipsEl){
      [...chipsEl.querySelectorAll('.chipBtn')].forEach(b=>{
        b.classList.toggle('active', b.getAttribute('data-cat')===c);
      });
    }
    render();
    window.location.hash = '#list';
  };

  catGridEl.addEventListener('click', (e)=>{
    const tile = e.target.closest('.catTile');
    if(!tile) return;
    activate(tile.getAttribute('data-cat') || '');
  });

  catGridEl.addEventListener('keydown', (e)=>{
    const tile = e.target.closest('.catTile');
    if(!tile) return;
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      activate(tile.getAttribute('data-cat') || '');
    }
  });
}

async function init(){
  try{
    const res = await fetch('data/posts.json', {cache:'no-store'});
    const all = await res.json();
    POSTS = all.filter(p => p.published === true);

    const cats = [...new Set(POSTS.map(p=>p.category))].sort();
    if(catEl){
      catEl.innerHTML = '<option value="">All categories</option>' + cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
    }
    setChips(cats);
    setCategoryGrid(cats);

    render();

    qEl?.addEventListener('input', ()=>{ activeChip=''; render(); });
    catEl?.addEventListener('change', ()=>{ activeChip=''; render(); });
    const doClear = ()=>{
      if(qEl) qEl.value = '';
      if(catEl) catEl.value = '';
      activeChip = '';
      if(chipsEl) [...chipsEl.querySelectorAll('.chipBtn')].forEach(b=>b.classList.remove('active'));
      render();
      window.toast?.('Cleared');
    };
    clearBtn?.addEventListener('click', doClear);
    document.getElementById('clearBtn2')?.addEventListener('click', doClear);
  }catch(err){
    console.error(err);
    cardsEl && (cardsEl.innerHTML = `<div class="notice"><div class="noticeDot"></div><div><strong>Error:</strong> couldn't load posts.json</div></div>`);
  }
}
init();
