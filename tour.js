/* 逐步導覽＋小問號說明（大屏、各遊戲共用；一般 <script src="tour.js"> 載入，不用 import）
   只說明「比較特別、猜不到」的設定，一看就懂的不要放進來（規則見 handoff.md「說明與導覽」）。

   Tour.run(id, steps, opts)   播放導覽
   Tour.auto(id, steps, opts)  這台電腦第一次打開才自動播放（記在 localStorage 'tour.seen'）
   Tour.help(item, opts)       彈出一則說明（標題旁的小問號用）

   step / item：{el:'#seatRow', tap:'.opt', title:'成員座號', text:'一兩句話', demo:'示意動畫的 HTML'}
     el   要亮起來的地方（找不到或被藏起來就跳過這一步）；help 不用
     tap  手指要點哪裡（el 裡面的元素），沒有就點 el 的中間
   opts：{root:'#stage'（畫面有等比例縮放時，導覽放在同一個縮放的容器裡）, size:30（字的大小，px）} */
(function () {
  'use strict';
  var KEY = 'tour.seen';
  var CSS = [
    '.tour-layer{position:absolute;inset:0;z-index:9000;font-family:inherit;color:#1B2836;line-height:1.5}',
    '.tour-layer.fixed{position:fixed}',
    '.tour-hole{position:absolute;border-radius:.6em;box-shadow:0 0 0 4000px rgba(27,40,54,.62),0 0 0 .2em #FFE066 inset;transition:all .45s cubic-bezier(.3,1.2,.5,1);pointer-events:none}',
    '.tour-dim{position:absolute;inset:0;background:rgba(27,40,54,.62)}',
    '.tour-card{position:absolute;width:24em;max-width:calc(100% - 1em);background:#fff;border:.16em solid #1B2836;border-radius:.8em;box-shadow:.25em .25em 0 #1B2836;padding:.8em 1em .9em;transition:left .45s cubic-bezier(.3,1.2,.5,1),top .45s cubic-bezier(.3,1.2,.5,1)}',
    '.tour-modal{left:50%;top:50%;transform:translate(-50%,-50%);width:26em;transition:none;animation:tourPop .3s}',
    '.tour-card h3{margin:0 1.6em .3em 0;font-size:1.25em;font-weight:900}',
    '.tour-card p{margin:.5em 0 0;font-size:.9em;font-weight:700;color:#4C5D6E}',
    '.tour-step{font-size:.65em;font-weight:900;color:#4C5D6E;letter-spacing:.05em}',
    '.tour-x{position:absolute;right:.35em;top:.3em;width:1.6em;height:1.6em;border:0;border-radius:50%;background:#E3EDF2;font:900 1em/1 sans-serif;color:#1B2836;cursor:pointer;padding:0}',
    '.tour-demo{margin-top:.5em;background:#F3F7FA;border:.1em solid #D0DEE6;border-radius:.6em;padding:.6em;display:grid;place-items:center;min-height:5em;overflow:hidden}',
    '.tour-btns{display:flex;gap:.5em;justify-content:flex-end;align-items:center;margin-top:.8em}',
    '.tour-btns .sp{flex:1}',
    '.tour-btn{font:inherit;font-size:.85em;font-weight:900;min-height:2.4em;padding:.2em 1em;border:.15em solid #1B2836;border-radius:.6em;background:#fff;color:#1B2836;box-shadow:.12em .12em 0 #1B2836;cursor:pointer}',
    '.tour-btn.main{background:#FFE066}',
    '.tour-btn.skip{border-color:transparent;box-shadow:none;background:none;color:#4C5D6E;text-decoration:underline}',
    '.tour-dots{display:flex;gap:.3em}',
    '.tour-dots i{width:.45em;height:.45em;border-radius:50%;background:#D0DEE6}',
    '.tour-dots i.on{background:#1B2836}',
    '.tour-hand{position:absolute;width:2.2em;height:2.2em;pointer-events:none;transition:left .45s,top .45s;animation:tourTap 1.4s infinite;filter:drop-shadow(0 .1em .1em rgba(0,0,0,.4))}',
    '@keyframes tourTap{0%,100%{transform:translate(0,.5em)}45%{transform:translate(0,0)}55%{transform:translate(0,0) scale(.88)}}',
    '@keyframes tourPop{from{transform:translate(-50%,-50%) scale(.85);opacity:0}}',
    '.qm{display:inline-grid;place-items:center;width:1.45em;height:1.45em;border-radius:50%;border:.12em solid #1B2836;background:#fff;color:#1B2836;font:900 .8em/1 sans-serif;padding:0;margin-left:.3em;vertical-align:middle;cursor:pointer;box-shadow:.08em .08em 0 #1B2836}',
    '.qm:active{background:#FFE066}',
    '@media (prefers-reduced-motion:reduce){.tour-layer *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function inject() {
    if (document.getElementById('tourCss')) return;
    var s = document.createElement('style'); s.id = 'tourCss'; s.textContent = CSS;
    document.head.appendChild(s);
  }
  function rootOf(o) {
    var r = o && o.root;
    if (typeof r === 'string') r = document.querySelector(r);
    return r || document.body;
  }
  /* 畫面有 transform: scale() 時，把螢幕上的位置換算回容器裡的位置 */
  function scaleOf(root) {
    if (root === document.body) return 1;
    var w = root.getBoundingClientRect().width;
    return root.offsetWidth ? w / root.offsetWidth : 1;
  }
  function seenMap() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function markSeen(id) { try { var m = seenMap(); m[id] = 1; localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} }
  function visible(el) { return !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }

  var HAND = '<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true"><path d="M17 26V8a3.5 3.5 0 0 1 7 0v13l2-.4a3.4 3.4 0 0 1 3.5 1.2l.4.6 1.6-.3a3.4 3.4 0 0 1 3.6 1.5l1.5-.2a3.5 3.5 0 0 1 3.9 3.5V36c0 5.5-4.5 10-10 10h-4.8a10 10 0 0 1-8.1-4.1L9.5 30.7a3.3 3.3 0 0 1 5-4.3z" fill="#fff" stroke="#1B2836" stroke-width="2.6" stroke-linejoin="round"/></svg>';

  var cur = null;
  function close(done) {
    if (!cur) return;
    var c = cur; cur = null;
    c.layer.remove();
    removeEventListener('keydown', c.onKey, true);
    removeEventListener('resize', c.onResize);
    if (done && c.id) markSeen(c.id);
    if (c.onClose) c.onClose();
  }

  function layer(o) {
    inject();
    if (cur) close(false);
    var root = rootOf(o), L = document.createElement('div');
    L.className = 'tour-layer' + (root === document.body ? ' fixed' : '');
    L.style.fontSize = ((o && o.size) || 20) + 'px';
    root.appendChild(L);
    return {root: root, layer: L};
  }

  /* ---------- 小問號：彈出一則說明 ---------- */
  function help(item, o) {
    var c = layer(o), L = c.layer;
    L.innerHTML = '<div class="tour-dim"></div><div class="tour-card tour-modal" role="dialog" aria-modal="true">' +
      '<button class="tour-x" type="button" aria-label="關閉">×</button>' +
      '<h3>' + esc(item.title) + '</h3>' + (item.demo ? '<div class="tour-demo">' + item.demo + '</div>' : '') +
      (item.text ? '<p>' + item.text + '</p>' : '') +
      '<div class="tour-btns"><button class="tour-btn main" type="button" data-t="ok">知道了</button></div></div>';
    c.onKey = function (e) { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(false); } };
    c.onResize = function () {};
    L.addEventListener('click', function (e) {
      if (e.target.closest('.tour-x') || e.target.closest('[data-t="ok"]') || !e.target.closest('.tour-card')) close(false);
    });
    addEventListener('keydown', c.onKey, true);
    cur = c;
    var b = L.querySelector('[data-t="ok"]'); if (b) b.focus();
  }

  /* ---------- 逐步導覽 ---------- */
  function run(id, steps, o) {
    o = o || {};
    var list = steps.filter(function (s) { return visible(document.querySelector(s.el)); });
    if (!list.length) return;
    var c = layer(o), L = c.layer, k = 0;
    c.id = id; c.onClose = o.onClose;
    L.innerHTML = '<div class="tour-hole"></div><div class="tour-hand">' + HAND + '</div>' +
      '<div class="tour-card" role="dialog" aria-modal="true"></div>';
    var hole = L.querySelector('.tour-hole'), hand = L.querySelector('.tour-hand'), card = L.querySelector('.tour-card');

    function place() {
      var s = list[k], el = document.querySelector(s.el);
      if (!el) return;
      var sc = scaleOf(c.root), R = c.root.getBoundingClientRect();
      var rr = el.getBoundingClientRect(), pad = 10;
      var x = (rr.left - R.left) / sc - pad, y = (rr.top - R.top) / sc - pad, w = rr.width / sc + pad * 2, h = rr.height / sc + pad * 2;
      hole.style.left = x + 'px'; hole.style.top = y + 'px'; hole.style.width = w + 'px'; hole.style.height = h + 'px';
      var t = (s.tap && el.querySelector(s.tap)) || el, tr = t.getBoundingClientRect();
      hand.style.left = ((tr.left - R.left + tr.width * .5) / sc - 12) + 'px';
      hand.style.top = ((tr.top - R.top + tr.height * .55) / sc) + 'px';
      /* 說明框：先放下面，放不下放上面，再放左邊、右邊 */
      var W = c.root === document.body ? innerWidth : c.root.offsetWidth, H = c.root === document.body ? innerHeight : c.root.offsetHeight;
      var cw = card.offsetWidth, ch = card.offsetHeight, gap = 24, m = 12, cx, cy;
      if (y + h + gap + ch + m <= H) { cy = y + h + gap; cx = x; }
      else if (y - gap - ch >= m) { cy = y - gap - ch; cx = x; }
      else if (x - gap - cw >= m) { cx = x - gap - cw; cy = y; }
      else { cx = x + w + gap; cy = y; }
      card.style.left = Math.max(m, Math.min(W - cw - m, cx)) + 'px';
      card.style.top = Math.max(m, Math.min(H - ch - m, cy)) + 'px';
    }
    function draw() {
      var s = list[k], last = k === list.length - 1;
      card.innerHTML = '<button class="tour-x" type="button" aria-label="關閉">×</button>' +
        '<div class="tour-step">' + (k + 1) + ' / ' + list.length + '</div>' +
        '<h3>' + esc(s.title) + '</h3>' + (s.demo ? '<div class="tour-demo">' + s.demo + '</div>' : '') +
        (s.text ? '<p>' + s.text + '</p>' : '') +
        '<div class="tour-btns">' + (last ? '' : '<button class="tour-btn skip" type="button" data-t="skip">略過導覽</button>') +
        '<span class="sp"></span>' + (k ? '<button class="tour-btn" type="button" data-t="prev">上一步</button>' : '') +
        '<button class="tour-btn main" type="button" data-t="next">' + (last ? '開始使用' : '下一步') + '</button></div>';
      var el = document.querySelector(s.el);
      try { el.scrollIntoView({block: 'nearest'}); } catch (e) {}
      place();
      var b = card.querySelector('[data-t="next"]'); if (b) b.focus();
    }
    function go(d) { k += d; if (k >= list.length) close(true); else { if (k < 0) k = 0; draw(); } }
    L.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('tour-x') || b.dataset.t === 'skip') close(true);
      else if (b.dataset.t === 'next') go(1);
      else if (b.dataset.t === 'prev') go(-1);
    });
    c.onKey = function (e) {
      if (e.key === 'Escape') close(true);
      else if (e.key === 'ArrowRight' || e.key === 'Enter') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else return;
      e.preventDefault(); e.stopPropagation();
    };
    c.onResize = function () { place(); };
    addEventListener('keydown', c.onKey, true);
    addEventListener('resize', c.onResize);
    cur = c;
    draw();
  }

  function auto(id, steps, o) {
    if (seenMap()[id]) return false;
    setTimeout(function () { run(id, steps, o); }, (o && o.delay) || 600);
    return true;
  }

  inject();   // 一載入就放樣式：小問號（.qm）在還沒點開說明之前就要是圓的
  window.Tour = {run: run, auto: auto, help: help, close: function () { close(false); }, isOpen: function () { return !!cur; }};
})();
