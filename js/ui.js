/* ============================================================
   ui.js — utilidades de interfaz: sonido, avisos, confeti,
   panel de palabra, render de frases.
   ============================================================ */
(function () {
  'use strict';
  var PZ = (window.PZ = window.PZ || {});

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    if (html != null) e.innerHTML = html;
    return e;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- markdown mínimo ---------- */
  function md(txt) {
    var s = esc(txt);
    s = s.replace(/```([\s\S]*?)```/g, function (_, c) { return '<pre style="white-space:pre-wrap;background:rgba(20,32,30,.06);padding:8px;border-radius:8px;font-size:12.5px">' + c + '</pre>'; });
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/_(.*?)_/g, '<em>$1</em>');
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  /* ---------- avisos ---------- */
  var wrap;
  function toast(msg, tipo) {
    if (!wrap) { wrap = el('div', { class: 'toast-wrap' }); document.body.appendChild(wrap); }
    var t = el('div', { class: 'toast ' + (tipo || ''), html: msg });
    wrap.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .3s, transform .3s';
      t.style.opacity = '0'; t.style.transform = 'translateY(8px)';
      setTimeout(function () { t.remove(); }, 320);
    }, 2400);
  }

  /* ---------- voz ---------- */
  var voz = null;
  function vocesPt() {
    return (window.speechSynthesis ? speechSynthesis.getVoices() : []).filter(function (v) {
      return /^pt/i.test(v.lang);
    });
  }
  function escolherVoz() {
    var vs = vocesPt();
    if (!vs.length) return null;
    var pref = PZ.store.s.voice;
    if (pref) { var f = vs.filter(function (v) { return v.name === pref; })[0]; if (f) return f; }
    var vari = PZ.store.s.variety === 'br' ? /pt-BR|pt_BR/i : /pt-PT|pt_PT/i;
    var outra = PZ.store.s.variety === 'br' ? /pt-PT|pt_PT/i : /pt-BR|pt_BR/i;
    return vs.filter(function (v) { return vari.test(v.lang); })[0] ||
      vs.filter(function (v) { return !outra.test(v.lang); })[0] || vs[0];
  }
  function speak(texto, opts) {
    opts = opts || {};
    if (!window.speechSynthesis) { toast('Este navegador no tiene voz integrada.'); return; }
    try { speechSynthesis.cancel(); } catch (e) { }
    var u = new SpeechSynthesisUtterance(texto);
    var v = escolherVoz();
    if (v) { u.voice = v; u.lang = v.lang; }
    else u.lang = PZ.store.s.variety === 'br' ? 'pt-BR' : 'pt-PT';
    u.rate = opts.rate || PZ.store.s.rate || 0.95;
    u.pitch = 1;
    if (opts.onBoundary) u.onboundary = opts.onBoundary;
    if (opts.onEnd) u.onend = opts.onEnd;
    u.onerror = function () { if (opts.onEnd) opts.onEnd(); };
    voz = u;
    speechSynthesis.speak(u);
    return u;
  }
  function pararFala() { try { speechSynthesis.cancel(); } catch (e) { } }

  if (window.speechSynthesis) {
    speechSynthesis.onvoiceschanged = function () { };
    speechSynthesis.getVoices();
  }

  /* ---------- confeti ---------- */
  var cvs;
  function confetti(n) {
    n = n || 90;
    if (!cvs) {
      cvs = document.createElement('canvas');
      cvs.id = 'confetti';
      document.body.appendChild(cvs);
    }
    var ctx = cvs.getContext('2d');
    cvs.width = innerWidth; cvs.height = innerHeight;
    var cores = ['#12a396', '#f7c948', '#2f6fbd', '#d9503a', '#6b46a8', '#2f8a4c'];
    var ps = [];
    for (var i = 0; i < n; i++) {
      ps.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 220,
        y: innerHeight * 0.36,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 15 - 4,
        s: 4 + Math.random() * 6,
        c: cores[(Math.random() * cores.length) | 0],
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 1
      });
    }
    var ini = performance.now();
    function frame(t) {
      var dt = Math.min(40, t - ini) / 16;
      ini = t;
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      var vivo = false;
      ps.forEach(function (p) {
        p.vy += 0.55 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        p.life -= 0.006 * dt;
        if (p.life > 0 && p.y < cvs.height + 40) {
          vivo = true;
          ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.r);
          ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
          ctx.restore();
        }
      });
      if (vivo) requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, cvs.width, cvs.height); }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- panel de palabra ---------- */
  var drawer, drawerBody, drawerWord;

  function montarDrawer() {
    if (document.getElementById('drawer')) { drawer = document.getElementById('drawer'); return; }
    drawer = el('aside', { class: 'drawer', id: 'drawer', 'aria-hidden': 'true' });
    drawer.innerHTML =
      '<div class="drawer-head">' +
      '<div style="min-width:0"><div class="word" id="dw-word"></div><div class="tiny muted" id="dw-sub"></div></div>' +
      '<button class="x-btn" id="dw-close" title="Cerrar">✕</button>' +
      '</div>' +
      '<div class="drawer-body" id="dw-body"></div>' +
      '<div class="drawer-foot">' +
      '<button class="btn sm" id="dw-say">🔊 Escuchar</button>' +
      '<button class="btn sm ghost" id="dw-card">＋ Repaso</button>' +
      '<button class="btn sm ghost" id="dw-ai">🤖 Preguntar</button>' +
      '</div>';
    document.body.appendChild(drawer);
    document.getElementById('dw-close').onclick = fecharDrawer;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharDrawer(); });
  }

  function fecharDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    var sel = document.querySelectorAll('.w.sel');
    for (var i = 0; i < sel.length; i++) sel[i].classList.remove('sel');
  }

  function abrirPalavra(info, no, fonte) {
    montarDrawer();
    var body = document.getElementById('dw-body');
    document.getElementById('dw-word').textContent = info.raw || info.w;
    document.getElementById('dw-sub').textContent =
      [info.pos, info.fonte === 'lex-plural' ? 'plural' : ''].filter(Boolean).join(' · ');

    var h = '';
    if (info.es) h += '<div class="def"><small>Traducción</small>' + esc(info.es) + '</div>';
    if (info.alt) h += '<div class="tiny muted" style="margin-bottom:6px">En Portugal: <b>' + esc(info.alt) + '</b></div>';

    var kv = [];
    if (info.lemma && info.lemma !== info.w) kv.push(['Lema', '<b>' + esc(info.lemma) + '</b>']);
    if (info.genero) kv.push(['Género', info.genero === 'f' ? 'femenino (a / uma)' : (info.genero === 'm' ? 'masculino (o / um)' : info.genero)]);
    if (info.plural) kv.push(['Plural', '<b>' + esc(info.plural) + '</b>']);
    if (info.fem) kv.push(['Femenino', esc(info.fem)]);
    if (kv.length) h += '<dl class="kv">' + kv.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>';

    if (info.cliticos) {
      h += '<div class="why"><span class="lbl">Cómo se arma</span>' +
        'Verbo <b>' + esc(info.base ? info.base.raw : '') + '</b> + ' +
        info.cliticos.map(function (c) { return '<b>-' + esc(c.p) + '</b> (' + esc(c.es) + ')'; }).join(' + ') + '</div>';
    }

    if (info.verbFicha) {
      var f = info.verbFicha;
      h += '<div class="why"><span class="lbl">Por qué está así</span>' + (f.why || '') + '</div>';

      var kv2 = [];
      kv2.push(['Verbo original', '<b style="font-size:15px">' + esc(f.infinitivo) + '</b>']);
      kv2.push(['Forma', '<b>' + esc(f.forma) + '</b>']);
      if (f.grupo) kv2.push(['Grupo', '-' + f.grupo + (PZ.conj.irregulares[f.infinitivo] ? ' · irregular' : ' · regular')]);
      if (f.tempoNome) kv2.push(['Tiempo', esc(f.tempoNome)]);
      if (f.pessoa) kv2.push(['Persona', esc(f.pessoa)]);
      h += '<dl class="kv">' + kv2.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>';

      if (f.tempo && f.tempo !== 'infinitivo' && f.tempo !== 'infinitivoPessoal' && f.pessoaIdx != null) {
        var c = PZ.conj.conjugar(f.infinitivo);
        if (c && Array.isArray(c[f.tempo])) {
          h += '<div class="tiny" style="font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:14px">' + esc(f.tempoNome) + ' completo</div>';
          h += '<table class="conj-table">';
          c[f.tempo].forEach(function (forma, i) {
            if (!forma) return;
            h += '<tr' + (i === f.pessoaIdx ? ' class="me"' : '') + '><td>' + esc(PZ.conj.pessoaNome(i, true)) + '</td><td>' + esc(forma) + '</td></tr>';
          });
          h += '</table>';
        }
      }
      if (f.tempo === 'infinitivo' || f.tempo === 'infinitivoPessoal') {
        var c2 = PZ.conj.conjugar(f.infinitivo);
        if (c2) {
          h += '<div class="tiny" style="font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:14px">Infinitivo personal</div>';
          h += '<table class="conj-table">';
          c2.infinitivoPessoal.forEach(function (forma, i) {
            if (!forma || i === 0) return;
            h += '<tr><td>' + esc(PZ.conj.pessoaNome(i, true)) + '</td><td>' + esc(forma) + '</td></tr>';
          });
          h += '</table>';
        }
      }
    }

    if (info.ex && info.ex[0]) {
      h += '<div style="margin-top:14px"><div class="tiny" style="font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Ejemplo</div>' +
        '<div class="pt" style="font-size:15.5px;line-height:1.5">' + esc(info.ex[0]) + '</div>' +
        '<div class="es" style="display:block">' + esc(info.ex[1] || '') + '</div></div>';
    }

    if (info.nota) h += '<div class="tiny muted" style="margin-top:14px;line-height:1.5">' + info.nota + '</div>';
    if (info.extra && info.extra.length) h += '<div class="tiny muted" style="margin-top:8px">' + info.extra.join('<br>') + '</div>';

    body.innerHTML = h;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');

    document.getElementById('dw-say').onclick = function () {
      speak(info.raw || info.w);
    };
    document.getElementById('dw-card').onclick = function () {
      var frente = info.lemma && info.pos === 'verbo' ? info.lemma : (info.lemma || info.w);
      var verso = info.es || info.gloss;
      if (info.verbFicha && info.verbFicha.tempo !== 'infinitivo') {
        verso = (info.es || '') + ' · forma del texto: ' + info.raw + ' (' + (info.verbFicha.pessoa || '') + ')';
      }
      var r = PZ.store.addCard(frente, verso, { pos: info.pos, fonte: 'lectura' });
      toast(r.nuevo ? 'Tarjeta agregada: ' + frente : 'Ya estaba en repaso: ' + frente, r.nuevo ? 'good' : '');
    };
    document.getElementById('dw-ai').onclick = function () {
      var q = 'Explicame el uso de "' + (info.raw || info.w) + '" en portugués brasileño' +
        (info.lemma ? ' (verbo ' + info.lemma + ')' : '') + '. ¿Cuándo se usa y qué trampas tiene para un hispanohablante?';
      if (window.PZ.app) PZ.app.irAChat(q);
    };
  }

  /* ---------- render de una frase con palabras clicables ---------- */
  var SEM_ESPACO = /^[,.;:!?…%)\]»”’]$/;

  function renderFrase(frase, opts) {
    opts = opts || {};
    var p = el('div', { class: 'pt' });
    var fecha = '';
    frase.tokens.forEach(function (t, idx) {
      if (!t.isWord) {
        var span = el('span', { class: 'punct', text: t.raw });
        p.appendChild(span);
        return;
      }
      var info = t.info || {};
      var cls = 'w';
      if (info.tipo === 'verb') cls += ' verb';
      else if (info.tipo === 'noun') cls += ' noun';
      else if (info.tipo === 'adj') cls += ' adj';
      else if (info.tipo === 'unk') cls += ' unk';
      var w = el('span', { class: cls, text: t.raw, title: (info.es || info.gloss || '') });
      if (opts.gloss) {
        w.appendChild(el('span', { class: 'gl', text: info.gloss && info.gloss !== t.raw ? info.gloss : '' }));
      }
      w.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var sel = document.querySelectorAll('.w.sel');
        for (var i = 0; i < sel.length; i++) sel[i].classList.remove('sel');
        w.classList.add('sel');
        abrirPalavra(info, t.raw);
      });
      p.appendChild(w);
      /* espacio manual entre palabras (los tokens de puntuación no llevan) */
      p.appendChild(document.createTextNode(' '));
    });
    return p;
  }

  /* ---------- frases de la guía ---------- */
  function fraseDoOral(idx) {
    var S = window.ORAL_SEED;
    if (!S) return '';
    return S.script[idx] ? S.script[idx].pt : '';
  }

  PZ.ui = {
    el: el, esc: esc, md: md, toast: toast, confetti: confetti,
    speak: speak, pararFala: pararFala, vocesPt: vocesPt,
    abrirPalavra: abrirPalavra, fecharDrawer: fecharDrawer,
    renderFrase: renderFrase, fraseDoOral: fraseDoOral
  };
})();
