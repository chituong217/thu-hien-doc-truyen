(() => {
  'use strict';
  const key = 'thu-hien:v1:';
  const notice = () => { const node = document.getElementById('storage-warning'); if (node) node.hidden = false; };
  const read = (name, fallback) => { try { return JSON.parse(localStorage.getItem(key + name)) ?? fallback; } catch { notice(); return fallback; } };
  const write = (name, value) => { try { localStorage.setItem(key + name, JSON.stringify(value)); } catch { notice(); } };
  const allowed = { fontSize: ['18','20','22','24','28','32'], lineHeight: ['1.6','1.85','2.1','2.4'], theme: ['paper','light','dark'] };
  const defaults = { fontSize: '22', lineHeight: '1.85', theme: 'light' };
  const stored = read('settings', {});
  const settings = Object.fromEntries(Object.keys(defaults).map(k => [k, allowed[k].includes(stored?.[k]) ? stored[k] : defaults[k]]));
  function apply() { document.documentElement.dataset.theme = settings.theme; document.documentElement.style.setProperty('--font-size', settings.fontSize + 'px'); document.documentElement.style.setProperty('--line-height', settings.lineHeight); }
  apply();
  for (const [id, name] of [['font-size', 'fontSize'], ['line-height', 'lineHeight'], ['theme', 'theme']]) {
    const control = document.getElementById(id);
    if (control) { control.value = settings[name]; control.addEventListener('change', () => { settings[name] = control.value; apply(); write('settings', settings); }); }
  }
  const validPosition = p => p && Number.isInteger(p.chapter) && p.chapter > 0 && Number.isInteger(p.paragraph) && p.paragraph > 0;
  function resumeLinks() {
    document.querySelectorAll('.resume').forEach(link => {
      const p = read('progress:' + link.dataset.story, null);
      if (!validPosition(p) || p.chapter > Number(link.dataset.count)) { link.hidden = true; return; }
      link.href = `${link.dataset.prefix}chuong-${p.chapter}/index.html#doc-tiep`;
      link.textContent = `Đọc tiếp · Chương ${p.chapter}`;
      link.hidden = false;
    });
  }
  resumeLinks();
  window.addEventListener('pageshow', resumeLinks);
  const search = document.getElementById('story-search');
  if (search) search.addEventListener('input', () => {
    const normalize = s => s.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
    const query = normalize(search.value);
    let found = 0;
    document.querySelectorAll('[data-search-title]').forEach(row => { row.hidden = !normalize(row.dataset.searchTitle).includes(query); if (!row.hidden) found++; });
    document.getElementById('search-status').hidden = found !== 0;
  });
  const story = document.body.dataset.story;
  const chapter = Number(document.body.dataset.chapter);
  if (!story || !chapter) return;
  const paragraphs = [...document.querySelectorAll('.prose p')];
  const saved = read('progress:' + story, null);
  let ready = false, timer;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function save() {
    if (!ready || !paragraphs.length) return;
    let paragraph = paragraphs.findIndex(p => p.getBoundingClientRect().bottom > 24);
    if (paragraph < 0) paragraph = paragraphs.length - 1;
    const rect = paragraphs[paragraph].getBoundingClientRect();
    const offset = Math.min(1, Math.max(0, (24 - rect.top) / Math.max(1, rect.height)));
    write('progress:' + story, { chapter, paragraph: paragraph + 1, offset, updatedAt: Date.now() });
  }
  const restore = () => {
    if (validPosition(saved) && saved.chapter === chapter && (location.hash === '#doc-tiep' || !location.hash)) {
      const target = paragraphs[Math.min(saved.paragraph - 1, paragraphs.length - 1)];
      const offset = typeof saved.offset === 'number' && Number.isFinite(saved.offset) ? Math.min(1, Math.max(0, saved.offset)) : 0;
      if (target) window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY + target.getBoundingClientRect().height * offset - 24);
      document.getElementById('reading-status').textContent = 'Đã khôi phục vị trí đọc trên trình duyệt này.';
    }
    ready = true;
    save();
  };
  requestAnimationFrame(() => requestAnimationFrame(restore));
  window.addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(save, 180); }, { passive: true });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
})();
