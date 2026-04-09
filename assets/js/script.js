// Minimal site-wide helpers
const toastEl = document.getElementById('toast');

function toast(msg){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(()=>toastEl.classList.remove('show'), 1800);
}
window.toast = toast;
