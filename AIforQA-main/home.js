async function initHome(){
  const latestEl = document.getElementById('latestCards');
  try{
    const res = await fetch('data/posts.json', {cache:'no-store'});
    const posts = await res.json();

    const esc = (s)=>String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const card = (p)=> {
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
          <div class="cardMeta"><span class="link">Read post</span></div>
        </a>
      `;
    };

    // Show first 6 as "latest" (you can reorder posts.json later)
    const latest = posts.slice(0, 6);
    if(latestEl) latestEl.innerHTML = latest.map(card).join('');
  }catch(err){
    console.error(err);
    if(latestEl){
      latestEl.innerHTML = `<div class="notice"><div class="noticeDot"></div><div><strong>Error:</strong> couldn't load posts.</div></div>`;
    }
  }

  // Simple metric bar animation (purely cosmetic)
  const setBar = (id, pct)=>{
    const el = document.getElementById(id);
    if(el) el.style.width = pct + '%';
  };
  setBar('b1', 42);
  setBar('b2', 68);
  setBar('b3', 78);
}
initHome();
