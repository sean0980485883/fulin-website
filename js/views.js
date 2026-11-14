/* 瀏覽人數：每一頁分開算，同一台裝置同一天只算一次（數字存在富林試算表的 Apps Script） */
(function () {
  var API = 'https://script.google.com/macros/s/AKfycbw2Sh0nH89k6IWBpKfXp6RYoiWM_Mx8A0j982NBZBO0LvZy61xh5v9jtU6RL2kAGCKi/exec';
  var els = document.querySelectorAll('[data-views]');
  if (!els.length) return;
  var f = location.pathname.split('/').pop().replace('.html', '');
  var page = f === 'order' || f === 'plan' ? f : 'index';
  function show(n) {
    if (!(n > 0)) return;
    var t = n.toLocaleString('en-US');
    els.forEach(function (e) { e.textContent = (e.getAttribute('data-views') || '') + '已有 ' + t + ' 人瀏覽'; e.hidden = false; });
  }
  var key = 'fulin_views_' + page, today = new Date().toLocaleDateString('sv'), st = {};
  try { st = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) {}
  if (st.n) show(st.n);
  // 只在正式網址計數；本機測試只讀不加
  var live = /github\.io$/.test(location.hostname);
  var act = live && st.d !== today ? 'hit' : 'views';
  fetch(API, { method: 'POST', body: JSON.stringify({ action: act, page: page }) })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j || !j.ok) return;
      show(j.views);
      try { localStorage.setItem(key, JSON.stringify({ d: act === 'hit' ? today : st.d, n: j.views })); } catch (e) {}
    }).catch(function () {});
})();
