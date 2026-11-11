/* 從遊戲頁按「回到上一頁」回來時，網址後面會帶 #卡片名稱：
   把那一張卡片捲到畫面中間，閃一下，讓人知道剛剛是從哪裡進去的 */
(function () {
  var id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.add('here');
  setTimeout(function () {
    try { el.scrollIntoView({block: 'center'}); } catch (e) { el.scrollIntoView(); }
  }, 30);
})();
