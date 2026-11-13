/* ============================================================
   games.js — seis minijuegos para fijar vocabulario, verbos
   y gramática. Todos usan tu texto y tu guía como fuente.
   ============================================================ */
(function () {
  'use strict';
  var PZ = (window.PZ = window.PZ || {});
  var U = PZ.ui;

  function shuffle(a) {
    var r = a.slice();
    for (var i = r.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var t = r[i]; r[i] = r[j]; r[j] = t;
    }
    return r;
  }

  function semAcento(s) {
    return String(s).toLowerCase()
      .replace(/[áàâãä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c');
  }
  function normalizar(s) {
    return semAcento(s).replace(/[.,;:!?¡¿"“”()…]/g, '').replace(/\s+/g, ' ').trim();
  }

  /* ---------- fuentes de datos ---------- */
  function docPalavras() {
    return (PZ.app.doc && PZ.app.doc.palavras) || [];
  }

  function banco() {
    var out = [], vistos = {};
    function push(pt, es, extra) {
      if (!pt || !es) return;
      var k = pt.toLowerCase();
      if (vistos[k]) return;
      vistos[k] = 1;
      out.push(Object.assign({ pt: pt, es: es }, extra || {}));
    }
    docPalavras().forEach(function (p) {
      if (!p.es || p.fonte === 'none' || p.fonte === 'prop') return;
      var pt = (p.pos === 'verbo' && p.lemma) ? p.lemma : p.w;
      push(pt, p.es, { pos: p.pos, g: p.genero, pl: p.plural });
    });
    var S = window.ORAL_SEED;
    if (S) {
      S.vocab.forEach(function (v) { push(v.pt, v.es, {}); });
      S.script.forEach(function (l) {
        var fr = PZ.ana.partirFrases(l.pt)[0];
        if (!fr) return;
        var toks = PZ.ana.tokenizar(fr);
        toks.forEach(function (t) {
          if (!t.isWord) return;
          var i = PZ.ana.analisarPalavra(t.raw, {});
          if (i.es && i.fonte !== 'none' && i.fonte !== 'prop') push(i.lemma || i.w, i.es, { pos: i.pos, g: i.genero, pl: i.plural });
        });
      });
    }
    var L = (window.LEX_DATA && window.LEX_DATA.words) || {};
    var chaves = shuffle(Object.keys(L)).slice(0, 260);
    chaves.forEach(function (k) {
      var w = L[k];
      if (w && w.es && w.pos !== 'verbo') push(k, w.es, { pos: w.pos, g: w.g, pl: w.pl });
    });
    return out;
  }

  function bancoVerbos() {
    var L = (window.LEX_DATA && window.LEX_DATA.words) || {};
    var S = window.ORAL_SEED;
    var out = [];
    (S ? S.verbs : []).forEach(function (v) {
      var w = L[v];
      out.push({ inf: v, es: w ? w.es : '' });
    });
    Object.keys(L).forEach(function (k) {
      if (L[k] && L[k].pos === 'verbo' && out.length < 90) out.push({ inf: k, es: L[k].es });
    });
    var vistos = {};
    return out.filter(function (o) {
      if (vistos[o.inf]) return false;
      vistos[o.inf] = 1;
      return PZ.conj.grupo(o.inf) && !/pôr$|por$/.test(o.inf);
    });
  }

  function frasesOral() {
    var S = window.ORAL_SEED;
    var out = [];
    if (S) S.script.forEach(function (l) { out.push(l.pt); });
    (PZ.app.doc ? PZ.app.doc.frases : []).forEach(function (f) {
      if (f.texto.split(' ').length >= 4 && out.indexOf(f.texto) < 0) out.push(f.texto);
    });
    return out;
  }

  /* ---------- cáscara común ---------- */
  function casca(cont, titulo, dica) {
    cont.innerHTML = '';
    var head = U.el('div', { class: 'row', style: 'margin-bottom:14px;flex-wrap:wrap;gap:10px' });
    head.innerHTML = '<div><h3 style="font-size:18px">' + titulo + '</h3>' +
      '<div class="small muted">' + dica + '</div></div>' +
      '<div class="spacer"></div><div class="row" style="gap:8px">' +
      '<span class="chip teal" id="g-score">0 puntos</span>' +
      '<span class="chip" id="g-prog">0/10</span>' +
      '<button class="btn sm ghost" id="g-quit">Salir</button></div>';
    cont.appendChild(head);
    var body = U.el('div', {});
    cont.appendChild(body);
    return { body: body, head: head };
  }

  function pontuar(jogo, ok, ganho) {
    PZ.store.gameStat(jogo, ok);
    if (ok) {
      PZ.store.addXP(ganho || 6);
      PZ.app.atualizarXP();
    }
  }

  /* ============================================================
     1. EMPAREJAR (memoria PT ↔ ES)
     ============================================================ */
  function jogoMatch(cont, fim) {
    var pares = shuffle(banco()).slice(0, 6);
    if (pares.length < 4) { cont.innerHTML = '<div class="empty">Necesitás más vocabulario. Analizá un texto primero.</div>'; return; }
    var cartas = [];
    pares.forEach(function (p, i) {
      cartas.push({ id: i, txt: p.pt, tipo: 'pt' });
      cartas.push({ id: i, txt: p.es, tipo: 'es' });
    });
    cartas = shuffle(cartas);
    var c = casca(cont, '🔗 Emparejar', 'Tocá una palabra en portugués y su traducción en español.');
    var abertas = [], travado = false, feitos = 0, tentativas = 0;
    var grid = U.el('div', { class: 'match-grid' });
    c.body.appendChild(grid);
    cartas.forEach(function (carta, idx) {
      var d = U.el('button', { class: 'match-card', html: '<span>' + U.esc(carta.txt) + '</span>' });
      d.dataset.idx = idx;
      d.onclick = function () { clique(idx, d); };
      grid.appendChild(d);
    });
    function clique(idx, d) {
      if (travado || d.classList.contains('done') || d.classList.contains('on')) return;
      d.classList.add('on');
      abertas.push({ idx: idx, d: d });
      if (abertas.length === 2) {
        tentativas++;
        var a = cartas[abertas[0].idx], b = cartas[abertas[1].idx];
        var ok = a.id === b.id && a.tipo !== b.tipo;
        if (ok) {
          feitos++;
          PZ.store.addXP(4); PZ.app.atualizarXP();
          abertas.forEach(function (o) { o.d.classList.remove('on'); o.d.classList.add('done'); });
          abertas = [];
          c.head.querySelector('#g-score').textContent = (feitos * 4) + ' puntos';
          c.head.querySelector('#g-prog').textContent = feitos + '/' + pares.length;
          if (feitos === pares.length) {
            U.confetti(70);
            setTimeout(function () { fim({ jogo: 'match', ok: true, tentativas: tentativas }); }, 600);
          }
        } else {
          travado = true;
          var aa = abertas[0].d, bb = abertas[1].d;
          aa.classList.add('err'); bb.classList.add('err');
          setTimeout(function () {
            aa.classList.remove('on', 'err'); bb.classList.remove('on', 'err');
            abertas = []; travado = false;
          }, 640);
        }
      }
    }
    c.head.querySelector('#g-quit').onclick = function () { fim(null); };
  }

  /* ============================================================
     2. DICTADO
     ============================================================ */
  function jogoDictado(cont, fim) {
    var frases = shuffle(frasesOral());
    if (!frases.length) { cont.innerHTML = '<div class="empty">No hay frases todavía.</div>'; return; }
    var i = 0, ok = 0;
    var c = casca(cont, '👂 Dictado', 'Escuchá la frase y escribila en portugués. Usá los acentos.');
    var zona = U.el('div', { style: 'padding:8px 0' });
    c.body.appendChild(zona);

    function rodada() {
      if (i >= Math.min(8, frases.length)) {
        U.confetti(60);
        zona.innerHTML = '<div class="empty"><div class="em">🎧</div><h3>Terminaste</h3><p class="muted">' + ok + ' de ' + i + ' frases exactas.</p></div>';
        return;
      }
      var frase = frases[i];
      zona.innerHTML =
        '<div class="card pad" style="margin-bottom:12px">' +
        '<div class="row" style="gap:10px"><button class="btn teal" id="d-play">🔊 Escuchar</button>' +
        '<span class="small muted">Frase ' + (i + 1) + ' de ' + Math.min(8, frases.length) + '</span></div>' +
        '<textarea id="d-in" placeholder="Escribí lo que escuchás…" style="min-height:80px;margin-top:12px"></textarea>' +
        '<div class="row" style="margin-top:10px"><button class="btn" id="d-check">Corregir</button>' +
        '<button class="btn ghost sm" id="d-hint">Ver una pista</button>' +
        '<div class="spacer"></div><span class="tiny muted" id="d-fb"></span></div>' +
        '</div>';
      var inp = zona.querySelector('#d-in');
      zona.querySelector('#d-play').onclick = function () { U.speak(frase); };
      zona.querySelector('#d-hint').onclick = function () {
        var palavras = frase.split(' ');
        inp.placeholder = palavras.slice(0, Math.ceil(palavras.length / 2)).join(' ') + ' …';
      };
      U.speak(frase);
      zona.querySelector('#d-check').onclick = function () {
        var val = inp.value.trim();
        if (!val) return;
        var fb = zona.querySelector('#d-fb');
        if (normalizar(val) === normalizar(frase)) {
          var exato = val.replace(/\s+/g, ' ') === frase;
          ok++;
          pontuar('dictation', true, exato ? 10 : 7);
          fb.innerHTML = '<span style="color:var(--green);font-weight:700">' + (exato ? '¡Exacto! +10' : '¡Bien! Solo faltaron acentos. +7') + '</span>';
          if (!exato) fb.innerHTML += '<div class="tiny muted">' + U.esc(frase) + '</div>';
          i++;
          setTimeout(rodada, 1300);
        } else {
          pontuar('dictation', false);
          fb.innerHTML = '<span style="color:var(--coral);font-weight:700">Casi.</span> <span class="tiny muted">Correcto: ' + U.esc(frase) + '</span>';
        }
        c.head.querySelector('#g-prog').textContent = ok + '/' + i;
      };
    }
    rodada();
    c.head.querySelector('#g-quit').onclick = function () { fim(null); };
  }

  /* ============================================================
     3. CONJUGACIÓN
     ============================================================ */
  function jogoConjuga(cont, fim) {
    var verbs = bancoVerbos();
    if (!verbs.length) { cont.innerHTML = '<div class="empty">No hay verbos cargados.</div>'; return; }
    var TEMPOS = [
      { k: 'presente', n: 'Presente' }, { k: 'perfeito', n: 'Passado (pretérito perfecto)' },
      { k: 'imperfeito', n: 'Imperfeito' }, { k: 'futuro', n: 'Futuro' }, { k: 'subjPresente', n: 'Subjuntivo presente' }
    ];
    var i = 0, ok = 0, TOTAL = 10;
    var c = casca(cont, '🧩 Conjugación', 'Escribí la forma correcta del verbo.');
    var zona = U.el('div', {}); c.body.appendChild(zona);

    function rodada() {
      if (i >= TOTAL) {
        U.confetti(70);
        zona.innerHTML = '<div class="empty"><div class="em">🧩</div><h3>' + ok + ' de ' + TOTAL + '</h3><p class="muted">Buen trabajo con los verbos.</p></div>';
        return;
      }
      var v = verbs[(Math.random() * verbs.length) | 0];
      var t = TEMPOS[(Math.random() * TEMPOS.length) | 0];
      var conj = PZ.conj.conjugar(v.inf);
      if (!conj) { i++; return rodada(); }
      var pessoa = (Math.random() * 6) | 0;
      var certa = conj[t.k][pessoa];
      var pessoaTxt = PZ.conj.pessoaNome(pessoa);
      zona.innerHTML =
        '<div class="card q-card">' +
        '<div class="tiny muted" style="text-transform:uppercase;letter-spacing:.1em;font-weight:750">' + t.n + ' · ' + pessoaTxt + '</div>' +
        '<div class="stem">' + U.esc(v.inf) + (v.es ? ' <span class="small muted" style="font-family:var(--sans)">(' + U.esc(v.es) + ')</span>' : '') + '</div>' +
        '<div class="row" style="margin-top:16px;gap:8px">' +
        '<input type="text" id="cj-in" placeholder="forma verbal…" autocomplete="off" autocapitalize="off" spellcheck="false" style="max-width:280px">' +
        '<button class="btn" id="cj-ok">Comprobar</button>' +
        '<button class="btn ghost sm" id="cj-ver">Ver</button></div>' +
        '<div class="small" id="cj-fb" style="margin-top:12px;min-height:22px"></div>' +
        '</div>';
      var inp = zona.querySelector('#cj-in');
      inp.focus();
      function responder(mostrar) {
        var val = inp.value.trim().toLowerCase();
        var fb = zona.querySelector('#cj-fb');
        var acertou = normalizar(val) === normalizar(certa);
        if (acertou || mostrar) {
          if (acertou) {
            ok++; pontuar('conj', true, 8);
            fb.innerHTML = '<span style="color:var(--green);font-weight:700">¡Correcto!</span>';
            if (!mostrar) U.speak(certa);
          } else {
            pontuar('conj', false);
            fb.innerHTML = '<span style="color:var(--coral);font-weight:700">La forma es</span> <b>' + U.esc(certa) + '</b> ' +
              '<span class="tiny muted">— viene de <b>' + U.esc(v.inf) + '</b> (' + t.n.toLowerCase() + ', ' + pessoaTxt + ').</span>';
            U.speak(certa);
          }
          i++;
          c.head.querySelector('#g-prog').textContent = ok + '/' + i;
          inp.disabled = true;
          setTimeout(rodada, acertou ? 900 : 1900);
        } else {
          pontuar('conj', false);
          fb.innerHTML = '<span style="color:var(--coral)">Todavía no. Fijate la terminación.</span>';
        }
      }
      zona.querySelector('#cj-ok').onclick = function () { responder(false); };
      zona.querySelector('#cj-ver').onclick = function () { responder(true); };
      inp.onkeydown = function (e) { if (e.key === 'Enter') responder(false); };
    }
    rodada();
    c.head.querySelector('#g-quit').onclick = function () { fim(null); };
  }

  /* ============================================================
     4. GÉNERO Y PLURAL
     ============================================================ */
  function jogoGenero(cont, fim) {
    var subst = banco().filter(function (p) { return p.pos === 'sust' && (p.g === 'm' || p.g === 'f'); });
    if (subst.length < 4) { cont.innerHTML = '<div class="empty">Necesitás sustantivos con género conocido.</div>'; return; }
    var i = 0, ok = 0, TOTAL = 10;
    var c = casca(cont, '⚖️ Género y plural', 'Elegí el artículo correcto y escribí el plural.');
    var zona = U.el('div', {}); c.body.appendChild(zona);
    var fila = shuffle(subst);

    function rodada() {
      if (i >= TOTAL) {
        U.confetti(60);
        zona.innerHTML = '<div class="empty"><div class="em">⚖️</div><h3>' + ok + ' de ' + TOTAL + '</h3></div>';
        return;
      }
      var p = fila[i % fila.length];
      var certo = p.g === 'f' ? 'a' : 'o';
      zona.innerHTML =
        '<div class="card q-card">' +
        '<div class="tiny muted" style="text-transform:uppercase;letter-spacing:.1em;font-weight:750">¿Masculino o femenino?</div>' +
        '<div class="stem" style="margin-top:8px"><span style="color:var(--teal)">___</span> ' + U.esc(p.pt) + '</div>' +
        '<div class="small muted">' + U.esc(p.es) + '</div>' +
        '<div class="opts" style="grid-template-columns:1fr 1fr;display:grid">' +
        '<button class="opt" data-r="o"><span class="key">1</span> o (masculino)</button>' +
        '<button class="opt" data-r="a"><span class="key">2</span> a (femenino)</button>' +
        '</div></div>';
      var respondido = false;
      zona.querySelectorAll('.opt').forEach(function (b) {
        b.onclick = function () {
          if (respondido) return;
          respondido = true;
          var r = b.dataset.r;
          if (r === certo) {
            ok++; b.classList.add('ok'); pontuar('gender', true, 5);
          } else {
            b.classList.add('bad');
            zona.querySelector('[data-r="' + certo + '"]').classList.add('ok');
            pontuar('gender', false);
          }
          U.speak((certo === 'f' ? 'a ' : 'o ') + p.pt);
          i++;
          c.head.querySelector('#g-prog').textContent = ok + '/' + i;
          setTimeout(rodada, 950);
        };
      });
    }
    rodada();
    c.head.querySelector('#g-quit').onclick = function () { fim(null); };
  }

  /* ============================================================
     5. ORDENAR LA FRASE
     ============================================================ */
  function jogoOrdena(cont, fim) {
    var frases = shuffle(frasesOral()).filter(function (f) { return f.split(' ').length >= 5; });
    if (!frases.length) { cont.innerHTML = '<div class="empty">Necesitás frases más largas.</div>'; return; }
    var i = 0, ok = 0, TOTAL = Math.min(6, frases.length);
    var c = casca(cont, '🧱 Ordenar la frase', 'Tocá las palabras en el orden correcto.');
    var zona = U.el('div', {}); c.body.appendChild(zona);

    function rodada() {
      if (i >= TOTAL) {
        U.confetti(60);
        zona.innerHTML = '<div class="empty"><div class="em">🧱</div><h3>' + ok + ' de ' + TOTAL + '</h3></div>';
        return;
      }
      var frase = frases[i];
      var toks = PZ.ana.tokenizar(frase).filter(function (t) { return t.isWord; }).map(function (t) { return t.raw; });
      var misturadas = shuffle(toks);
      var montada = [];
      zona.innerHTML =
        '<div class="card pad">' +
        '<div class="small muted" style="margin-bottom:8px">Armá la frase:</div>' +
        '<div class="tokens" id="o-monte"></div>' +
        '<div class="tokens" id="o-pile" style="background:#fff;border-style:solid"></div>' +
        '<div class="row"><button class="btn ghost sm" id="o-reset">Reiniciar</button>' +
        '<button class="btn ghost sm" id="o-hint">Pista en español</button>' +
        '<div class="spacer"></div><span class="small" id="o-fb"></span></div></div>';
      var monte = zona.querySelector('#o-monte'), pile = zona.querySelector('#o-pile');
      function desenhar() {
        monte.innerHTML = ''; pile.innerHTML = '';
        misturadas.forEach(function (w, k) {
          var b = U.el('button', { class: 'tok', text: w });
          if (montada.indexOf(k) >= 0) b.classList.add('used');
          b.onclick = function () { montada.push(k); desenhar(); checar(); };
          pile.appendChild(b);
        });
        montada.forEach(function (k, pos) {
          var b = U.el('button', { class: 'tok', text: misturadas[k], style: 'background:var(--teal-3);border-color:#a9ded4' });
          b.onclick = function () { montada.splice(pos, 1); desenhar(); };
          monte.appendChild(b);
        });
      }
      function checar() {
        if (montada.length !== misturadas.length) return;
        var tentativa = montada.map(function (k) { return misturadas[k]; }).join(' ');
        if (normalizar(tentativa) === normalizar(frase)) {
          ok++; pontuar('order', true, 9);
          zona.querySelector('#o-fb').innerHTML = '<span style="color:var(--green);font-weight:700">¡Perfecto!</span>';
          U.speak(frase);
          i++;
          c.head.querySelector('#g-prog').textContent = ok + '/' + i;
          setTimeout(rodada, 1300);
        } else {
          pontuar('order', false);
          zona.querySelector('#o-fb').innerHTML = '<span style="color:var(--coral)">No es ese orden. Probá de nuevo.</span>';
          setTimeout(function () { montada = []; desenhar(); }, 800);
        }
      }
      zona.querySelector('#o-reset').onclick = function () { montada = []; desenhar(); };
      zona.querySelector('#o-hint').onclick = function () {
        var tr = (window.ORAL_SEED.script.filter(function (l) { return l.pt === frase; })[0] || {}).es;
        U.toast(tr ? U.esc(tr) : 'Escuchala de nuevo: ' + U.esc(misturadas[0]) + '…');
        U.speak(frase);
      };
      desenhar();
    }
    rodada();
    c.head.querySelector('#g-quit').onclick = function () { fim(null); };
  }

  /* ============================================================
     6. TRADUCCIÓN RÁPIDA
     ============================================================ */
  function jogoTraduz(cont, fim) {
    var b = banco();
    if (b.length < 8) { cont.innerHTML = '<div class="empty">Necesitás más vocabulario.</div>'; return; }
    var i = 0, ok = 0, TOTAL = 12;
    var c = casca(cont, '⚡ Traducción rápida', 'Elegí la traducción correcta. Sin pensar demasiado.');
    var zona = U.el('div', {}); c.body.appendChild(zona);

    function rodada() {
      if (i >= TOTAL) {
        U.confetti(60);
        zona.innerHTML = '<div class="empty"><div class="em">⚡</div><h3>' + ok + ' de ' + TOTAL + '</h3></div>';
        return;
      }
      var alvo = b[(Math.random() * b.length) | 0];
      var outros = shuffle(b).filter(function (x) { return x.es !== alvo.es; }).slice(0, 3);
      var ops = shuffle([alvo].concat(outros));
      zona.innerHTML =
        '<div class="card q-card"><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.1em;font-weight:750">¿Qué significa?</div>' +
        '<div class="stem">' + U.esc(alvo.pt) + '</div>' +
        '<button class="btn ghost sm" id="t-say" style="margin-top:4px">🔊 Escuchar</button>' +
        '<div class="opts">' + ops.map(function (o, k) {
          return '<button class="opt" data-es="' + U.esc(o.es) + '"><span class="key">' + (k + 1) + '</span>' + U.esc(o.es) + '</button>';
        }).join('') + '</div></div>';
      zona.querySelector('#t-say').onclick = function () { U.speak(alvo.pt); };
      var feito = false;
      zona.querySelectorAll('.opt').forEach(function (btn) {
        btn.onclick = function () {
          if (feito) return;
          feito = true;
          var certo = btn.dataset.es === alvo.es;
          if (certo) { ok++; btn.classList.add('ok'); pontuar('translate', true, 4); }
          else {
            btn.classList.add('bad');
            zona.querySelectorAll('.opt').forEach(function (x) { if (x.dataset.es === alvo.es) x.classList.add('ok'); });
            pontuar('translate', false);
          }
          PZ.store.addCard(alvo.pt, alvo.es, { fonte: 'juego' });
          i++;
          c.head.querySelector('#g-prog').textContent = ok + '/' + i;
          setTimeout(rodada, certo ? 600 : 1300);
        };
      });
    }
    rodada();
    c.head.querySelector('#g-quit').onclick = function () { fim(null); };
  }

  PZ.games = {
    match: jogoMatch,
    dictation: jogoDictado,
    conj: jogoConjuga,
    gender: jogoGenero,
    order: jogoOrdena,
    translate: jogoTraduz,
    banco: banco,
    bancoVerbos: bancoVerbos
  };
})();
