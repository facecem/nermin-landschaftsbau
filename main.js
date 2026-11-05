(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);

  /* Header: transparent über dem Hero, danach dunkel */
  const top = $('#top');
  const onScroll = () => top.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Mobile-Menü */
  const nav = $('#nav'), mb = $('#menuBtn');
  if (mb) {
    mb.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      top.classList.toggle('menu-open', open);
      mb.setAttribute('aria-expanded', open);
      mb.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open'); top.classList.remove('menu-open'); mb.setAttribute('aria-expanded', false);
    }));
  }

  /* Hero-Slider */
  const slides = [...document.querySelectorAll('.slide')];
  if (slides.length) {
    let i = 0, t;
    const no = $('#slideNo'), cap = $('#slideCap'), bar = $('#bar');
    const show = n => {
      slides[i].classList.remove('on');
      i = (n + slides.length) % slides.length;
      const s = slides[i];
      const img = s.querySelector('img'); img.loading = 'eager';
      s.classList.add('on');
      no.textContent = String(i + 1).padStart(2, '0');
      cap.innerHTML = s.dataset.cap;
      if (!reduce) { bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run'); }
      clearTimeout(t); if (!reduce) t = setTimeout(() => show(i + 1), 6500);
    };
    $('#prev').addEventListener('click', () => show(i - 1));
    $('#next').addEventListener('click', () => show(i + 1));
    // nächste Bilder vorladen, sobald die Seite steht
    addEventListener('load', () => slides.forEach(s => (s.querySelector('img').loading = 'eager')));
    show(0);
  }

  /* "Über mich": Wörter + Laub, die sich beim Scrollen aufräumen */
  const sec = $('#ordnung'), messy = $('.messy');
  if (sec && messy && !reduce) {
    // Text in Wörter zerlegen (farbige <span> bleibt erhalten)
    const words = [];
    const split = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(t); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = t; s.setAttribute('aria-hidden', 'true');
          const key = messy.dataset.key;
          if (key && t.startsWith(key)) {
            // Schlüsselwort einzeln (wird am Ende grün), Satzzeichen bleibt daran hängen
            s.classList.add('key'); s.textContent = key;
            const wrap = document.createElement('span'); wrap.className = 'w'; wrap.setAttribute('aria-hidden', 'true');
            wrap.append(s, t.slice(key.length)); s.className = 'key';
            frag.append(wrap); words.push(wrap); return;
          }
          frag.append(s); words.push(s);
        });
        n.replaceWith(frag);
      } else split(n);
    });
    split(messy);
    // zufällig, aber bei jedem Laden gleich (kleiner Seed-Zufall)
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const narrow = innerWidth < 640;
    words.forEach(w => {
      w._dx = (rnd() - .5) * (narrow ? 160 : 420);
      w._dy = (rnd() - .3) * (narrow ? 140 : 220);
      w._r = (rnd() - .5) * 70;
      w._d = rnd() * .35;           // Verzögerung: nicht alle gleichzeitig
    });
    // Laub
    const cols = ['#4caf6e', '#93c01f', '#c9a227', '#b5651d', '#6e8b3d', '#d98c2b'];
    const box = $('.leaves'), leaves = [];
    const n = narrow ? 10 : 20;
    for (let k = 0; k < n; k++) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      el.setAttribute('viewBox', '0 0 40 24'); el.setAttribute('class', 'leaf');
      el.innerHTML = `<path d="M2 12C8 2 26 0 38 12 26 24 8 22 2 12z" fill="${cols[k % cols.length]}"/><path d="M4 12h30" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/>`;
      el.style.left = (rnd() * 96) + '%'; el.style.top = (rnd() * 90) + '%';
      el.style.setProperty('--s', (22 + rnd() * 26) + 'px');
      box.append(el);
      leaves.push({ el, r: rnd() * 360, sx: 40 + rnd() * 70, sy: -10 - rnd() * 30, d: rnd() * .4 });
    }
    const bar = $('#tidyBar');
    const ease = t => 1 - Math.pow(1 - t, 3);
    const clamp = v => Math.max(0, Math.min(1, v));
    let ticking = false;
    const draw = () => {
      ticking = false;
      const r = sec.getBoundingClientRect(), vh = innerHeight;
      const p = clamp((vh * .9 - r.top) / (vh * .75));   // 0 = Abschnitt kommt rein, 1 = aufgeräumt
      words.forEach(w => {
        const e = ease(clamp((p - w._d) / (1 - w._d)));
        const k = 1 - e;
        w.style.transform = `translate(${w._dx * k}px,${w._dy * k}px) rotate(${w._r * k}deg)`;
        w.style.opacity = .35 + .65 * e;
      });
      leaves.forEach(l => {
        const e = ease(clamp((p - l.d) / (1 - l.d)));
        // Laub wird nach rechts aus dem Bild gefegt
        l.el.style.transform = `translate(${e * l.sx}vw,${e * l.sy}vh) rotate(${l.r + e * 220}deg)`;
        l.el.style.opacity = (1 - e) * .9;
      });
      bar.style.setProperty('--p', p.toFixed(3));
      sec.classList.toggle('done', p >= .98);
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    addEventListener('resize', draw);
    draw();
  } else if ($('#tidyBar')) { $('#tidyBar').style.setProperty('--p', 1); sec && sec.classList.add('done'); }

  /* Einblenden beim Scrollen */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* Lightbox */
  const items = [...document.querySelectorAll('#grid button')];
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  let cur = 0, lastFocus;
  const openLb = n => {
    cur = (n + items.length) % items.length;
    const b = items[cur];
    lbImg.src = b.dataset.full; lbImg.alt = b.querySelector('img').alt;
    lbCap.textContent = b.querySelector('.cap').textContent;
    if (!lb.classList.contains('open')) { lastFocus = document.activeElement; lb.classList.add('open'); $('#lbX').focus(); document.body.style.overflow = 'hidden'; }
  };
  const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
  items.forEach((b, n) => b.addEventListener('click', () => openLb(n)));
  $('#lbX').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => openLb(cur - 1));
  $('#lbNext').addEventListener('click', () => openLb(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') openLb(cur - 1);
    if (e.key === 'ArrowRight') openLb(cur + 1);
  });

  /* Formular -> fertige E-Mail */
  const form = $('#form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const name = (f.get('name') || '').trim();
    const inp = form.elements.name;
    if (!name) { inp.focus(); inp.setAttribute('aria-invalid', 'true'); inp.placeholder = 'Bitte Namen angeben'; return; }
    inp.removeAttribute('aria-invalid');
    const themen = f.getAll('thema').join(', ') || '–';
    const body = `Guten Tag,\n\nich interessiere mich für: ${themen}\n\nObjekt / Ort: ${f.get('ort') || '–'}\n\n${f.get('msg') || ''}\n\nViele Grüße\n${name}\nTelefon: ${f.get('tel') || '–'}`;
    location.href = 'mailto:alimilhs.kontakt@gmail.com?subject=' + encodeURIComponent('Anfrage über die Website – ' + themen) + '&body=' + encodeURIComponent(body);
  });

  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
