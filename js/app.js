/* ============================================================
   app.js — estructura de la app, navegación y vistas
   ============================================================ */
(function () {
  'use strict';
  var PZ = (window.PZ = window.PZ || {});
  var U = PZ.ui;
  var S; // store

  var App = {
    tab: 'inicio',
    doc: null,
    textoAtual: '',
    tr: {},           // traducciones por frase
    chatMsgs: [],
    srs: null,
    jogoAtual: null
  };

  var VIEWS = {
    inicio: 'Inicio', ler: 'Leer', oral: 'Mi oral', vocab: 'Vocabulario',
    jogos: 'Juegos', chat: 'Chat IA', progresso: 'Progreso', ajustes: 'Ajustes'
  };

  /* ============================================================
     arranque
     ============================================================ */
  function init() {
    window.addEventListener('error', function (e) {
      document.body.setAttribute('data-js-error', (e.message || 'error') + ' @ ' + (e.filename || '').split('/').pop() + ':' + e.lineno);
    });
    S = PZ.store.load();
    document.body.classList.toggle('hide-es', !S.settings.showEs);
    document.body.classList.toggle('gloss-mode', !!S.settings.gloss);
    PZ.store.touchStreak();

    // traducciones humanas de la guía
    var seed = window.ORAL_SEED;
    if (seed) seed.script.forEach(function (l) { App.tr[l.pt] = l.es; });

    ligarNav();
    var h = (location.hash || '').replace('#', '');
    if (VIEWS[h]) App.tab = h;
    window.addEventListener('hashchange', function () {
      var t = (location.hash || '').replace('#', '');
      if (VIEWS[t] && t !== App.tab) { App.tab = t; render(); }
    });
    App.chatMsgs = (S.chat || []).slice(-40);

    carregarOralNoDoc();
    atualizarXP();
    render();

    PZ.ai.detectarProxy().then(function (ok) {
      var aviso = document.getElementById('ai-status');
      if (aviso) atuaizarAvisoIA();
      if (ok) console.log('[PZ] puente de IA disponible');
    });

    document.addEventListener('pz:levelup', function (e) {
      U.confetti(120);
      U.toast('¡Subiste al nivel ' + e.detail.level + '! 🎉', 'good');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') U.fecharDrawer();
      if (e.key === ' ' && App.tab === 'vocab' && App.srs && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault(); virarCard();
      }
    });
  }

  function ligarNav() {
    document.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { ir(b.dataset.tab); });
    });
  }

  function ir(tab) {
    if (tab !== 'jogos') App.jogoAtual = null;
    App.tab = tab;
    if (location.hash !== '#' + tab) { try { history.replaceState(null, '', '#' + tab); } catch (e) { } }
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function carregarOralNoDoc() {
    var seed = window.ORAL_SEED;
    if (!seed) return;
    var texto = seed.script.map(function (l) { return l.pt; }).join(' ');
    App.textoAtual = texto;
    App.doc = PZ.ana.analisar(texto);
  }

  /* ============================================================
     topbar / progreso
     ============================================================ */
  function atualizarXP() {
    var lv = PZ.store.levelInfo();
    var bar = document.getElementById('xp-fill');
    if (bar) bar.style.width = lv.pct + '%';
    var txt = document.getElementById('xp-txt');
    if (txt) txt.textContent = 'Nivel ' + lv.level + ' · ' + lv.xp + ' XP';
    var st = document.getElementById('streak');
    if (st) {
      st.textContent = (S.streak > 0 ? '🔥 ' + S.streak : '🔥 0') + (S.streak === 1 ? ' día' : ' días');
      st.classList.toggle('zero', !S.streak);
    }
    var due = document.getElementById('due-badge');
    if (due) {
      var n = PZ.store.dueCards().length;
      due.textContent = n;
      due.style.display = n ? 'inline-block' : 'none';
    }
  }

  /* ============================================================
     render general
     ============================================================ */
  function render() {
    document.querySelectorAll('[data-tab]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.tab === App.tab);
    });
    var titulo = document.getElementById('view-title');
    if (titulo) titulo.textContent = VIEWS[App.tab] || '';
    var cont = document.getElementById('view');
    if (!cont) return;
    cont.className = 'view on';
    cont.scrollTop = 0;
    var fn = {
      inicio: vistaInicio, ler: vistaLer, oral: vistaOral, vocab: vistaVocab,
      jogos: vistaJogos, chat: vistaChat, progresso: vistaProgresso, ajustes: vistaAjustes
    }[App.tab];
    if (fn) fn(cont);
    atualizarXP();
  }

  /* ============================================================
     INICIO
     ============================================================ */
  function vistaInicio(c) {
    var lv = PZ.store.levelInfo();
    var due = PZ.store.dueCards().length;
    var feitas = Object.keys(S.oral.done || {}).length;
    var totalQ = (window.ORAL_SEED.questions || []).length;
    c.innerHTML =
      '<section class="hero">' +
      '<div class="kicker">Português do zero ao cem</div>' +
      '<h1>Seu oral de 2027<br>começa aqui.</h1>' +
      '<p>Léelo, entendé palabra por palabra, escuchalo y practicá las respuestas. Todo en una sola página, sin instalar nada.</p>' +
      '<div class="hero-actions">' +
      '<button class="btn" data-go="oral">▶ Practicar mi oral</button>' +
      '<button class="btn ghost" data-go="ler">📖 Leer con traducción</button>' +
      '<button class="btn ghost" data-go="chat">🤖 Preguntarle a la IA</button>' +
      '</div></section>' +

      '<div class="sec-title"><h3>Tu plan de hoy</h3><span class="link muted">' + new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) + '</span></div>' +
      '<div class="grid g3">' +
      tile('ler', '📖', 'teal', 'Diglot palabra por palabra', 'Pegá cualquier texto y mirá qué significa cada palabra, con el verbo original y por qué está en esa forma.') +
      tile('oral', '🎤', 'coral', 'Tu guía del oral', totalQ + ' preguntas con respuesta modelo, audio y grabador.') +
      tile('vocab', '🃏', 'saffron', 'Repaso espaciado', due ? due + ' tarjetas para repasar hoy' : 'Todo al día. Creá tarjetas desde el texto.') +
      tile('jogos', '🎮', 'grape', 'Seis juegos', 'Emparejar, dictado, conjugación, género, ordenar frases y traducción rápida.') +
      tile('chat', '🤖', 'azul', 'Chat con IA', 'Preguntá lo que quieras como si fuera un profe particular.') +
      tile('progresso', '📈', 'green', 'Tu progreso', 'Nivel ' + lv.level + ' · ' + lv.xp + ' XP · racha de ' + S.streak + ' días.') +
      '</div>' +

      '<div class="sec-title"><h3>Tu oral, listo para escuchar</h3><span class="link" data-go="oral">Ver todo →</span></div>' +
      cardOralResumo() +

      '<div class="sec-title"><h3>Preguntas de la profesora</h3></div>' +
      '<div class="grid g2">' + (window.ORAL_SEED.questions.slice(0, 4).map(function (q, i) {
        return '<div class="card pad"><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.08em;font-weight:750">Pregunta ' + (i + 1) + '</div>' +
          '<div style="font-family:var(--serif);font-size:16.5px;margin:6px 0 4px">' + U.esc(q.q) + '</div>' +
          '<div class="small muted">' + U.esc(q.qes) + '</div>' +
          '<div class="divider"></div>' +
          '<div style="font-size:14.5px"><b>' + U.esc(q.a) + '</b></div>' +
          '<div class="small muted">' + U.esc(q.aes) + '</div>' +
          '<div class="row" style="margin-top:10px;gap:6px"><button class="btn sm ghost" data-say="' + U.esc(q.a) + '">🔊</button>' +
          '<button class="btn sm ghost" data-go="oral">Practicar</button></div></div>';
      }).join('')) + '</div>';

    c.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { ir(b.dataset.go); }; });
    c.querySelectorAll('[data-say]').forEach(function (b) { b.onclick = function () { U.speak(b.dataset.say); }; });
    var play = c.querySelector('#hero-play');
    if (play) play.onclick = function () { tocarRoteiro(); };
  }

  function tile(tab, ico, cor, titulo, sub) {
    return '<button class="tile" data-go="' + tab + '"><span class="ico ' + cor + '">' + ico + '</span>' +
      '<span><b>' + titulo + '</b><span>' + sub + '</span></span></button>';
  }

  function cardOralResumo() {
    var S2 = window.ORAL_SEED;
    return '<div class="card pad row" style="gap:16px;flex-wrap:wrap">' +
      '<button class="btn teal lg" id="hero-play" style="border-radius:50%;width:56px;height:56px;padding:0;font-size:20px">▶</button>' +
      '<div style="min-width:200px;flex:1"><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.1em;font-weight:750">' + U.esc(S2.subtitle) + '</div>' +
      '<div style="font-family:var(--serif);font-size:20px;margin-top:2px">' + U.esc(S2.title) + '</div>' +
      '<div class="small muted">' + S2.script.length + ' frases · ' + S2.script.map(function (l) { return l.pt.split(' ').length; }).reduce(function (a, b) { return a + b; }, 0) + ' palabras · audio en portugués de Brasil</div></div>' +
      '<div class="pill-row"><span class="chip teal">A2 · B1</span><span class="chip azul">Escuchar</span><span class="chip saffron">Diglot</span></div></div>';
  }

  function tocarRoteiro() {
    var frases = window.ORAL_SEED.script.map(function (l) { return l.pt; });
    var i = 0;
    (function seguinte() {
      if (i >= frases.length) return;
      U.speak(frases[i], { onEnd: function () { i++; setTimeout(seguinte, 260); } });
    })();
    U.toast('Reproduciendo tu oral…');
  }

  /* ============================================================
     LEER (diglot)
     ============================================================ */
  function vistaLer(c) {
    var temDoc = !!App.doc;
    c.innerHTML =
      '<div class="card paste-card" style="margin-bottom:16px">' +
      '<div class="row" style="margin-bottom:10px"><h3 style="font-size:16px">Pegá un texto en portugués</h3><div class="spacer"></div>' +
      '<span class="tiny muted">Se analiza palabra por palabra</span></div>' +
      '<textarea id="ta-texto" placeholder="Pegá acá tu texto, una noticia, una canción, tu oral…">' + U.esc(App.textoAtual) + '</textarea>' +
      '<div class="paste-tools">' +
      '<button class="btn teal" id="btn-analisar">Analizar texto</button>' +
      '<label class="btn ghost sm" style="cursor:pointer">📄 Subir .txt<input type="file" id="file-txt" accept=".txt,.md" style="display:none"></label>' +
      '<button class="btn ghost sm" id="btn-guia">Cargar mi guía</button>' +
      '<button class="btn ghost sm" id="btn-limpar">Limpiar</button>' +
      '<div class="spacer"></div>' +
      '<span class="tiny muted" id="ler-info"></span>' +
      '</div></div>' +

      (temDoc ? '<div class="card doc-head">' +
        '<span class="seg" id="seg-es"><button data-v="1" class="' + (S.settings.showEs ? 'on' : '') + '">Español</button><button data-v="0" class="' + (!S.settings.showEs ? 'on' : '') + '">Solo portugués</button></span>' +
        '<span class="seg" id="seg-gl"><button data-v="1" class="' + (S.settings.gloss ? 'on' : '') + '">Glosa por palabra</button><button data-v="0" class="' + (!S.settings.gloss ? 'on' : '') + '">Frase completa</button></span>' +
        '<div class="spacer"></div>' +
        '<button class="btn sm ghost" id="btn-traduzir">🌐 Traducir con IA</button>' +
        '<button class="btn sm ghost" id="btn-tocar">▶ Escuchar todo</button>' +
        '<button class="btn sm ghost" id="btn-tarjetas">＋ Tarjetas</button>' +
        '</div>' : '') +

      '<div id="doc"></div>' +
      (temDoc ? '<div class="card pad" id="ler-stats" style="margin-top:18px"></div>' : '');

    var ta = c.querySelector('#ta-texto');
    c.querySelector('#btn-analisar').onclick = function () { analisar(ta.value); };
    c.querySelector('#btn-guia').onclick = function () {
      ta.value = window.ORAL_SEED.script.map(function (l) { return l.pt; }).join('\n\n');
      App.tr = {};
      window.ORAL_SEED.script.forEach(function (l) { App.tr[l.pt] = l.es; });
      analisar(ta.value);
    };
    c.querySelector('#btn-limpar').onclick = function () { ta.value = ''; App.doc = null; App.textoAtual = ''; render(); };
    var cardPaste = c.querySelector('.paste-card');
    if (cardPaste) {
      ['dragenter', 'dragover'].forEach(function (ev) {
        cardPaste.addEventListener(ev, function (e) { e.preventDefault(); cardPaste.style.borderColor = 'var(--teal-2)'; cardPaste.style.background = 'var(--teal-3)'; });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        cardPaste.addEventListener(ev, function (e) { e.preventDefault(); cardPaste.style.borderColor = ''; cardPaste.style.background = ''; });
      });
      cardPaste.addEventListener('drop', function (e) {
        var f = e.dataTransfer.files && e.dataTransfer.files[0];
        if (!f) return;
        if (!/\.(txt|md|srt|vtt|csv)$/i.test(f.name)) { U.toast('Por ahora solo leo archivos de texto (.txt). Pegá el texto a mano.', 'bad'); return; }
        var rr = new FileReader();
        rr.onload = function () { ta.value = rr.result; analisar(rr.result); };
        rr.readAsText(f);
      });
    }

    c.querySelector('#file-txt').onchange = function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () { ta.value = r.result; analisar(r.result); };
      r.readAsText(f);
    };
    if (temDoc) {
      c.querySelectorAll('#seg-es button').forEach(function (b) {
        b.onclick = function () {
          S.settings.showEs = b.dataset.v === '1';
          document.body.classList.toggle('hide-es', !S.settings.showEs);
          PZ.store.save(); render();
        };
      });
      c.querySelectorAll('#seg-gl button').forEach(function (b) {
        b.onclick = function () {
          S.settings.gloss = b.dataset.v === '1';
          document.body.classList.toggle('gloss-mode', S.settings.gloss);
          PZ.store.save(); render();
        };
      });
      c.querySelector('#btn-traduzir').onclick = traduzirComIA;
      c.querySelector('#btn-tocar').onclick = function () {
        var i = 0, fr = App.doc.frases;
        (function seg() { if (i >= fr.length) return; U.speak(fr[i].texto, { onEnd: function () { i++; setTimeout(seg, 200); } }); })();
      };
      c.querySelector('#btn-tarjetas').onclick = function () {
        var n = PZ.store.cardsFromText(App.doc);
        U.toast(n ? n + ' tarjetas nuevas 🃏' : 'Ya estaban todas en repaso', n ? 'good' : '');
        atualizarXP();
      };
      desenharDoc(c.querySelector('#doc'));
      desenharStats(c.querySelector('#ler-stats'));
    }
  }

  function analisar(texto) {
    if (!texto || !texto.trim()) { U.toast('Pegá algo de texto primero.'); return; }
    App.textoAtual = texto;
    App.doc = PZ.ana.analisar(texto);
    localStorage.setItem('pzc.lastText', texto);
    render();
    U.toast('Texto analizado: ' + App.doc.frases.length + ' frases · ' + App.doc.palavras.length + ' palabras', 'good');
  }

  function desenharDoc(cont) {
    var frag = document.createDocumentFragment();
    App.doc.paragrafos.forEach(function (p) {
      var bloco = U.el('div', { class: 'para' });
      p.frases.forEach(function (fr) {
        var linha = U.el('div', { class: 'sent' });
        var play = U.el('button', { class: 'play', title: 'Escuchar', text: '▶' });
        play.onclick = function (e) {
          e.stopPropagation();
          play.classList.add('playing');
          U.speak(fr.texto, { onEnd: function () { play.classList.remove('playing'); } });
        };
        linha.appendChild(play);
        linha.appendChild(U.renderFrase(fr, { gloss: S.settings.gloss }));
        var es = App.tr[fr.texto] || App.tr[normalizarChave(fr.texto)];
        if (es) {
          linha.appendChild(U.el('div', { class: 'es', text: es }));
        } else {
          var gl = U.el('div', { class: 'es', text: '≈ ' + PZ.ana.glosaFrase(fr), title: 'Glosa automática sin IA' });
          gl.style.fontStyle = 'italic';
          linha.appendChild(gl);
        }
        bloco.appendChild(linha);
      });
      frag.appendChild(bloco);
    });
    cont.innerHTML = '';
    cont.appendChild(frag);
  }

  function normalizarChave(t) { return String(t).replace(/\s+/g, ' ').trim(); }

  function desenharStats(cont) {
    var st = PZ.ana.estatisticas(App.doc);
    var pos = st.porPos;
    cont.innerHTML =
      '<div class="row" style="gap:20px;flex-wrap:wrap">' +
      statBox(App.doc.palavras.length, 'palabras') +
      statBox(st.unicas.length, 'distintas') +
      statBox(pos.verbo || 0, 'verbos') +
      statBox(pos.sust || 0, 'sustantivos') +
      statBox(pos.adj || 0, 'adjetivos') +
      statBox(st.desconhecidas, 'fuera del diccionario') +
      '</div>' +
      '<div class="divider"></div>' +
      '<div class="small muted">Tocá cualquier palabra para ver su significado, su lema y —si es un verbo— el infinitivo, el tiempo y por qué está en esa forma.</div>';
  }

  function statBox(n, lbl) {
    return '<div><div class="stat-big">' + n + '</div><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.08em;font-weight:700">' + lbl + '</div></div>';
  }

  function traduzirComIA() {
    if (!PZ.ai.configurado()) {
      U.toast('Para traducir frases hace falta la IA. Configurala en Ajustes.', 'bad');
      ir('ajustes');
      return;
    }
    var frases = App.doc.frases.map(function (f) { return f.texto; });
    U.toast('Traduciendo ' + frases.length + ' frases…');
    PZ.ai.traducir(frases).then(function (arr) {
      frases.forEach(function (f, i) { if (arr[i]) App.tr[f] = arr[i]; });
      guardarTraducoes();
      render();
      U.toast('Traducción lista ✨', 'good');
    }).catch(function (e) { U.toast(U.esc(e.message), 'bad'); });
  }

  function guardarTraducoes() {
    try { localStorage.setItem('pzc.tr.' + hash(App.textoAtual), JSON.stringify(App.tr)); } catch (e) { }
  }
  function hash(s) {
    var h = 0; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h).toString(36);
  }

  /* ============================================================
     MI ORAL
     ============================================================ */
  function vistaOral(c) {
    var S2 = window.ORAL_SEED;
    var todas = S2.questions.concat(S2.extraQuestions.map(function (q) { return Object.assign({ extra: true }, q); }));
    c.innerHTML =
      '<div class="oral-grid">' +
      '<div>' +
      '<div class="card pad" style="margin-bottom:16px">' +
      '<div class="row" style="margin-bottom:8px"><div><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.1em;font-weight:750">' + U.esc(S2.subtitle) + '</div>' +
      '<h3 style="font-family:var(--serif);font-size:22px">' + U.esc(S2.title) + '</h3></div>' +
      '<div class="spacer"></div><button class="btn teal sm" id="o-todo">▶ Escuchar todo</button></div>' +
      '<div id="o-script"></div></div>' +

      '<div class="card pad">' +
      '<div class="row" style="margin-bottom:10px"><h3 style="font-size:16px">Preguntas de la profesora</h3><div class="spacer"></div>' +
      '<span class="chip teal">' + (Object.keys(S.oral.done || {}).length + '/' + todas.length) + '</span></div>' +
      '<div id="o-qs"></div></div>' +
      '</div>' +

      '<aside style="display:grid;gap:16px;align-content:start">' +
      '<div class="card pad"><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.1em;font-weight:750;margin-bottom:8px">Simulacro</div>' +
      '<p class="small muted" style="margin-bottom:10px">La app te hace una pregunta al azar. Contestá en voz alta y después mirá la respuesta modelo.</p>' +
      '<button class="btn coral" id="o-sim" style="width:100%">🎲 Pregunta al azar</button>' +
      '<div id="o-sim-box" style="margin-top:12px"></div></div>' +

      '<div class="card pad"><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.1em;font-weight:750;margin-bottom:8px">Grabate y escuchate</div>' +
      '<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm" id="o-rec">● Grabar</button>' +
      '<button class="btn sm ghost" id="o-stop" disabled>■ Parar</button></div>' +
      '<audio id="o-audio" controls style="width:100%;margin-top:10px;display:none"></audio>' +
      '<div class="tiny muted" style="margin-top:8px">Grabá tu oral completo y compará con el audio de la app.</div></div>' +

      '<div class="card pad"><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.1em;font-weight:750;margin-bottom:8px">Pronunciación</div>' +
      '<div id="o-pron"></div></div>' +
      '</aside></div>';

    /* guion */
    var sc = c.querySelector('#o-script');
    S2.script.forEach(function (l, i) {
      var d = U.el('div', { class: 'script-line' });
      d.innerHTML = U.esc(l.pt) + '<div class="tr">' + U.esc(l.es) + '</div>';
      d.onclick = function () {
        c.querySelectorAll('.script-line').forEach(function (x) { x.classList.remove('hi'); });
        d.classList.add('hi');
        U.speak(l.pt);
      };
      sc.appendChild(d);
    });
    c.querySelector('#o-todo').onclick = tocarRoteiro;

    /* preguntas */
    var qs = c.querySelector('#o-qs');
    todas.forEach(function (q, i) {
      var d = U.el('div', { class: 'qa' });
      d.innerHTML =
        '<div class="qa-q"><span class="num">' + (i + 1) + '</span><span style="flex:1">' + U.esc(q.q) +
        (q.extra ? ' <span class="chip" style="font-size:10px;padding:1px 6px">extra</span>' : '') +
        '<div class="tiny muted" style="font-weight:500">' + U.esc(q.qes) + '</div></span>' +
        '<button class="btn sm ghost" data-q-say="' + U.esc(q.q) + '">🔊</button></div>' +
        '<div class="qa-a"><div class="a-pt">' + U.esc(q.a) + '</div><div class="a-es">' + U.esc(q.aes) + '</div>' +
        (q.tip ? '<div class="why" style="margin-top:10px"><span class="lbl">Ojo con esto</span>' + U.esc(q.tip) + '</div>' : '') +
        '<div class="row" style="margin-top:10px;gap:6px"><button class="btn sm ghost" data-a-say="' + U.esc(q.a) + '">🔊 Respuesta</button>' +
        '<button class="btn sm ghost" data-done="' + i + '">✓ Ya la sé</button>' +
        '<button class="btn sm ghost" data-ai-q="' + U.esc(q.q) + '">🤖 Practicar con IA</button></div></div>';
      d.querySelector('.qa-q').onclick = function (e) {
        if (e.target.dataset.qSay) return;
        d.classList.toggle('open');
      };
      d.querySelector('[data-q-say]').onclick = function (e) { e.stopPropagation(); U.speak(q.q); };
      d.querySelector('[data-a-say]').onclick = function () { U.speak(q.a); };
      d.querySelector('[data-done]').onclick = function () {
        S.oral.done[i] = 1; PZ.store.save();
        PZ.store.addXP(5); atualizarXP();
        U.toast('Marcada como aprendida +5 XP', 'good');
        d.style.opacity = .55;
      };
      d.querySelector('[data-ai-q]').onclick = function () {
        irAChat('Quiero practicar esta pregunta del oral: "' + q.q + '". Hacémela y esperá mi respuesta. Corregime después.');
      };
      qs.appendChild(d);
    });

    /* simulacro */
    c.querySelector('#o-sim').onclick = function () {
      var q = todas[(Math.random() * todas.length) | 0];
      var box = c.querySelector('#o-sim-box');
      box.innerHTML = '<div class="why" style="margin-top:0"><span class="lbl">Pregunta</span><b style="font-size:15px">' + U.esc(q.q) + '</b>' +
        '<div class="tiny muted">' + U.esc(q.qes) + '</div></div>' +
        '<div class="row" style="margin-top:8px;gap:6px"><button class="btn sm ghost" id="sim-say">🔊</button>' +
        '<button class="btn sm" id="sim-ver">Ver respuesta</button></div><div id="sim-a"></div>';
      box.querySelector('#sim-say').onclick = function () { U.speak(q.q); };
      box.querySelector('#sim-ver').onclick = function () {
        box.querySelector('#sim-a').innerHTML = '<div style="margin-top:10px"><b>' + U.esc(q.a) + '</b><div class="tiny muted">' + U.esc(q.aes) + '</div></div>';
        U.speak(q.a);
      };
      U.speak(q.q);
    };

    /* grabadora */
    var rec = null, chunks = [];
    var btnRec = c.querySelector('#o-rec'), btnStop = c.querySelector('#o-stop'), audio = c.querySelector('#o-audio');
    btnRec.onclick = function () {
      if (!navigator.mediaDevices) { U.toast('Este navegador no permite grabar.', 'bad'); return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        chunks = [];
        rec = new MediaRecorder(stream);
        rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          var blob = new Blob(chunks, { type: 'audio/webm' });
          audio.src = URL.createObjectURL(blob);
          audio.style.display = 'block';
          stream.getTracks().forEach(function (t) { t.stop(); });
          U.toast('Grabación lista. Escuchate 👂');
        };
        rec.start();
        btnRec.disabled = true; btnStop.disabled = false;
        U.toast('Grabando…');
      }).catch(function () { U.toast('No diste permiso al micrófono.', 'bad'); });
    };
    btnStop.onclick = function () {
      if (rec && rec.state !== 'inactive') rec.stop();
      btnRec.disabled = false; btnStop.disabled = true;
    };

    /* pronunciación */
    var pr = c.querySelector('#o-pron');
    S2.pron.forEach(function (p) {
      var d = U.el('div', { style: 'padding:7px 0;border-bottom:1px dashed var(--line);cursor:pointer' });
      d.innerHTML = '<div class="row" style="gap:6px"><b style="font-family:var(--serif)">' + U.esc(p.w) + '</b>' +
        '<button class="btn sm ghost" style="padding:0 6px">🔊</button></div>' +
        '<div class="tiny muted" style="margin-top:2px">' + U.esc(p.tip) + '</div>';
      d.onclick = function () { U.speak(p.w); };
      pr.appendChild(d);
    });
  }

  /* ============================================================
     VOCABULARIO (SRS)
     ============================================================ */
  function vistaVocab(c) {
    var due = PZ.store.dueCards();
    var total = S.cards.length;
    c.innerHTML =
      '<div class="grid g3" style="margin-bottom:16px">' +
      '<div class="card pad"><div class="stat-big">' + due.length + '</div><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.08em;font-weight:750">para repasar hoy</div></div>' +
      '<div class="card pad"><div class="stat-big">' + total + '</div><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.08em;font-weight:750">tarjetas en total</div></div>' +
      '<div class="card pad"><div class="stat-big">' + (S.cards.filter(function (x) { return x.reps >= 3; }).length) + '</div><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.08em;font-weight:750">aprendidas</div></div>' +
      '</div>' +

      '<div class="row" style="margin-bottom:16px;gap:8px;flex-wrap:wrap">' +
      '<button class="btn teal lg" id="v-start" ' + (due.length ? '' : 'disabled') + '>Repasar ' + due.length + ' tarjetas</button>' +
      '<button class="btn ghost" id="v-add">＋ Nueva tarjeta</button>' +
      '<button class="btn ghost" id="v-fromtext">＋ Sacar del texto</button>' +
      '<button class="btn ghost" id="v-fromguide">＋ Vocabulario de la guía</button>' +
      '<div class="spacer"></div><input type="text" id="v-busca" placeholder="Buscar…" style="max-width:200px">' +
      '</div>' +

      '<div id="v-stage"></div>' +
      '<div class="card" style="margin-top:16px" id="v-lista"></div>';

    c.querySelector('#v-start').onclick = function () { iniciarSRS(due); };
    c.querySelector('#v-fromtext').onclick = function () {
      if (!App.doc) { U.toast('Analizá un texto primero.', 'bad'); return; }
      var n = PZ.store.cardsFromText(App.doc);
      U.toast(n + ' tarjetas nuevas', 'good'); render();
    };
    c.querySelector('#v-fromguide').onclick = function () {
      var n = 0;
      window.ORAL_SEED.vocab.forEach(function (v) { if (PZ.store.addCard(v.pt, v.es, { fonte: 'guia' }).nuevo) n++; });
      U.toast(n + ' tarjetas nuevas', 'good'); render();
    };
    c.querySelector('#v-add').onclick = function () {
      U.toast('Se abre abajo: completá palabra y traducción.');
      var box = c.querySelector('#v-stage');
      box.innerHTML = '<div class="card pad" style="max-width:520px"><div class="row" style="gap:8px;flex-wrap:wrap">' +
        '<input type="text" id="nc-pt" placeholder="palabra en portugués" style="max-width:200px">' +
        '<input type="text" id="nc-es" placeholder="en español" style="max-width:200px">' +
        '<button class="btn" id="nc-ok">Agregar</button></div></div>';
      box.querySelector('#nc-ok').onclick = function () {
        var pt = box.querySelector('#nc-pt').value.trim(), es = box.querySelector('#nc-es').value.trim();
        if (!pt || !es) return;
        PZ.store.addCard(pt, es, { fonte: 'manual' });
        render(); U.toast('Agregada', 'good');
      };
    };
    c.querySelector('#v-busca').oninput = function (e) { desenharLista(c.querySelector('#v-lista'), e.target.value.toLowerCase()); };
    desenharLista(c.querySelector('#v-lista'), '');
  }

  function desenharLista(cont, filtro) {
    var cards = S.cards.filter(function (x) {
      return !filtro || (x.front + ' ' + x.back).toLowerCase().indexOf(filtro) >= 0;
    }).sort(function (a, b) { return b.created - a.created; }).slice(0, 200);
    if (!cards.length) {
      cont.innerHTML = '<div class="empty"><div class="em">🃏</div><p>Todavía no hay tarjetas.<br>Sacalas de tu texto o de la guía.</p></div>';
      return;
    }
    cont.innerHTML = '<div style="max-height:420px;overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:13.5px">' +
      cards.map(function (x) {
        var dias = Math.round((x.due - Date.now()) / 864e5);
        var estado = dias <= 0 ? '<span class="chip coral" style="font-size:10px">hoy</span>' :
          '<span class="chip" style="font-size:10px">en ' + dias + 'd</span>';
        return '<tr style="border-bottom:1px solid var(--line)">' +
          '<td style="padding:8px 10px;font-weight:650">' + U.esc(x.front) + '</td>' +
          '<td style="padding:8px 10px" class="muted">' + U.esc(x.back) + '</td>' +
          '<td style="padding:8px 6px;text-align:right">' + estado + '</td>' +
          '<td style="padding:8px 6px;text-align:right"><button class="btn sm ghost" data-del="' + x.id + '">✕</button></td></tr>';
      }).join('') + '</table></div>';
    cont.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () { PZ.store.removeCard(b.dataset.del); render(); };
    });
  }

  function iniciarSRS(cards) {
    App.srs = { fila: cards.slice(0, 20), i: 0, ok: 0, aberto: false };
    render();
    setTimeout(desenharSRS, 30);
  }

  function virarCard() {
    if (!App.srs) return;
    App.srs.aberto = true;
    desenharSRS();
  }

  function desenharSRS() {
    var st = App.srs;
    var box = document.getElementById('v-stage');
    if (!box || !st) return;
    if (st.i >= st.fila.length) {
      box.innerHTML = '<div class="card pad center"><h3 style="font-family:var(--serif);font-size:24px">Repaso terminado 🎉</h3>' +
        '<p class="muted" style="margin:8px 0 14px">' + st.fila.length + ' tarjetas · ' + st.ok + ' recordadas.</p>' +
        '<button class="btn" id="srs-done">Volver</button></div>';
      box.querySelector('#srs-done').onclick = function () { App.srs = null; render(); };
      U.confetti(80);
      return;
    }
    var card = st.fila[st.i];
    box.innerHTML =
      '<div class="tiny muted" style="margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em;font-weight:750">' +
      (st.i + 1) + ' / ' + st.fila.length + '</div>' +
      '<div class="fc-stage"><div class="fc' + (st.aberto ? ' flipped' : '') + '" id="fc">' +
      '<div class="front"><div class="face"><small>Portugués</small>' + U.esc(card.front) + '</div>' +
      '<div class="hint-tap">tocá para ver la traducción · barra espaciadora</div></div>' +
      '<div class="back"><div class="face" style="font-size:26px"><small>Español</small>' + U.esc(card.back) + '</div>' +
      '<div class="hint-tap">¿La sabías? Puntuá abajo</div></div>' +
      '</div></div>' +
      '<div class="rate-row" id="fc-rate" style="visibility:' + (st.aberto ? 'visible' : 'hidden') + '">' +
      '<button class="btn coral sm" data-r="0">Otra vez</button>' +
      '<button class="btn ghost sm" data-r="1">Difícil</button>' +
      '<button class="btn teal sm" data-r="2">Bien</button>' +
      '<button class="btn azul sm" data-r="3">Fácil</button></div>';
    var fc = box.querySelector('#fc');
    fc.onclick = function () { st.aberto = true; desenharSRS(); };
    box.querySelectorAll('[data-r]').forEach(function (b) {
      b.onclick = function () {
        var q = +b.dataset.r;
        PZ.store.rateCard(card.id, q);
        if (q >= 2) { st.ok++; PZ.store.addXP(q === 3 ? 5 : 4); } else { PZ.store.addXP(1); }
        st.i++; st.aberto = false;
        atualizarXP(); desenharSRS();
      };
    });
  }

  /* ============================================================
     JUEGOS
     ============================================================ */
  function vistaJogos(c) {
    if (App.jogoAtual) {
      c.innerHTML = '<div id="jogo-box"></div>';
      var box = c.querySelector('#jogo-box');
      var fn = PZ.games[App.jogoAtual];
      fn(box, function (res) {
        App.jogoAtual = null;
        if (res) U.toast('¡Juego terminado! +XP', 'good');
        render();
      });
      return;
    }
    var jogos = [
      ['match', '🔗', 'teal', 'Emparejar', 'Uní cada palabra con su traducción. Memoria + velocidad.'],
      ['dictation', '👂', 'azul', 'Dictado', 'Escuchá una frase de tu oral y escribila bien.'],
      ['conj', '🧩', 'grape', 'Conjugación', 'Te pido un verbo, un tiempo y una persona. ¿Te animás?'],
      ['gender', '⚖️', 'saffron', 'Género y plural', 'o/a, masculino/femenino. La trampa favorita de los exámenes.'],
      ['order', '🧱', 'coral', 'Ordenar la frase', 'Reconstruí tus propias frases del oral.'],
      ['translate', '⚡', 'green', 'Traducción rápida', 'Doce palabras, cuatro opciones, sin dudar.']
    ];
    c.innerHTML =
      '<div class="card pad" style="margin-bottom:16px"><div class="row" style="flex-wrap:wrap;gap:10px">' +
      '<div><h3 style="font-size:17px">Jugá 3 minutos y te quedás con las palabras</h3>' +
      '<div class="small muted">Cada acierto suma XP. Los errores vuelven en el repaso.</div></div>' +
      '<div class="spacer"></div><span class="chip teal">' + S.xp + ' XP</span>' +
      '<span class="chip">Nivel ' + PZ.store.levelInfo().level + '</span></div></div>' +
      '<div class="grid g3">' + jogos.map(function (j) {
        return '<button class="tile" data-jogo="' + j[0] + '"><span class="ico ' + j[2] + '">' + j[1] + '</span>' +
          '<span><b>' + j[3] + '</b><span>' + j[4] + '</span></span></button>';
      }).join('') + '</div>' +
      '<div class="sec-title"><h3>Tu puntería</h3></div><div id="j-stats" class="grid g3"></div>';
    c.querySelectorAll('[data-jogo]').forEach(function (b) {
      b.onclick = function () { App.jogoAtual = b.dataset.jogo; render(); };
    });
    var stats = c.querySelector('#j-stats');
    var nomes = { match: 'Emparejar', dictation: 'Dictado', conj: 'Conjugación', gender: 'Género', order: 'Ordenar', translate: 'Traducción' };
    var html = '';
    Object.keys(nomes).forEach(function (k) {
      var g = S.games[k];
      var pct = g && g.total ? Math.round((g.ok / g.total) * 100) : 0;
      html += '<div class="card pad"><div class="row"><b style="font-size:14px">' + nomes[k] + '</b><div class="spacer"></div>' +
        '<span class="small muted">' + (g ? g.ok + '/' + g.total : '—') + '</span></div>' +
        '<div class="xp-bar" style="width:100%;margin-top:8px"><i style="width:' + pct + '%"></i></div></div>';
    });
    stats.innerHTML = html;
  }

  /* ============================================================
     CHAT
     ============================================================ */
  function vistaChat(c) {
    var seed = window.ORAL_SEED;
    c.innerHTML =
      '<div class="chat-wrap">' +
      '<div class="card chat">' +
      '<div class="chat-log" id="chat-log"></div>' +
      '<div class="chat-in">' +
      '<textarea id="chat-in" placeholder="Preguntá lo que quieras: «¿cómo digo que quiero estudiar Medicina?»"></textarea>' +
      '<button class="btn teal" id="chat-send" style="height:44px">➤</button>' +
      '</div></div>' +
      '<aside class="chat-side">' +
      '<div class="card" style="margin-bottom:12px"><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.1em;font-weight:750;margin-bottom:8px">Atajos</div>' +
      ['Explicame qué es el "infinitivo personal" con ejemplos.',
        'Hacéme 5 preguntas sobre mi oral, una por vez.',
        'Corregí este texto en portugués: …',
        'Dame 10 palabras clave de mi oral con pronunciación.',
        '¿Cuál es la diferencia entre "ser" y "estar" en mi oral?',
        'Practicá conmigo una conversación de 2 minutos sobre mis objetivos.'].map(function (q) {
        return '<button class="qchip" data-q="' + U.esc(q) + '">' + U.esc(q) + '</button>';
      }).join('') + '</div>' +
      '<div class="card"><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.1em;font-weight:750;margin-bottom:6px">Estado de la IA</div>' +
      '<div id="ai-status" class="small"></div></div>' +
      '</aside></div>';

    atuaizarAvisoIA();
    desenharChat();
    var ta = c.querySelector('#chat-in');
    c.querySelector('#chat-send').onclick = function () { enviarChat(ta.value); };
    ta.onkeydown = function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarChat(ta.value); }
    };
    c.querySelectorAll('[data-q]').forEach(function (b) {
      b.onclick = function () { ta.value = b.dataset.q; ta.focus(); };
    });
  }

  function atuaizarAvisoIA() {
    var el = document.getElementById('ai-status');
    if (!el) return;
    var ok = PZ.ai.configurado();
    el.innerHTML = ok
      ? '<span class="chip teal">● Conectada</span> <span class="tiny muted">' + (PZ.ai.proxy ? 'vía puente local' : 'directo') + '</span>'
      : '<span class="chip coral">● Sin clave</span><div class="tiny muted" style="margin-top:6px">Cargá tu API key en <a href="#" id="go-ajustes">Ajustes</a>.</div>';
    var g = document.getElementById('go-ajustes');
    if (g) g.onclick = function (e) { e.preventDefault(); ir('ajustes'); };
  }

  function desenharChat() {
    var log = document.getElementById('chat-log');
    if (!log) return;
    if (!App.chatMsgs.length) {
      log.innerHTML = '<div class="empty" style="padding:30px 10px"><div class="em">🎓</div>' +
        '<p style="max-width:38ch;margin:0 auto">Soy tu profe de portugués. Preguntame lo que quieras sobre tu oral, pedime que te tome lección o que te explique una frase palabra por palabra.</p></div>';
      return;
    }
    log.innerHTML = App.chatMsgs.map(function (m) {
      var eu = m.role === 'user';
      return '<div class="msg ' + (eu ? 'me' : '') + '"><div class="av">' + (eu ? '🙋' : '🎓') + '</div>' +
        '<div class="bub">' + (eu ? U.esc(m.content) : U.md(m.content)) + '</div></div>';
    }).join('');
    log.scrollTop = log.scrollHeight;
  }

  function enviarChat(texto) {
    texto = (texto || '').trim();
    if (!texto) return;
    var ta = document.getElementById('chat-in');
    if (ta) ta.value = '';
    App.chatMsgs.push({ role: 'user', content: texto });
    desenharChat();
    salvarChat();

    if (!PZ.ai.configurado()) {
      var resp = PZ.ai.explicarSinIA(texto);
      App.chatMsgs.push({ role: 'assistant', content: resp });
      desenharChat(); salvarChat();
      return;
    }

    var log = document.getElementById('chat-log');
    var node = U.el('div', { class: 'msg' });
    node.innerHTML = '<div class="av">🎓</div><div class="bub"><span class="typing"><i></i><i></i><i></i></span></div>';
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
    var bub = node.querySelector('.bub');

    var hist = App.chatMsgs.slice(-10).map(function (m) { return { role: m.role, content: m.content }; });
    PZ.ai.chat(hist, {
      onDelta: function (d) {
        if (bub.querySelector('.typing')) bub.innerHTML = '';
        bub.textContent += d;
        log.scrollTop = log.scrollHeight;
      }
    }).then(function (full) {
      var txt = full || bub.textContent;
      bub.innerHTML = U.md(txt);
      App.chatMsgs.push({ role: 'assistant', content: txt });
      salvarChat(); atualizarXP();
    }).catch(function (e) {
      bub.innerHTML = '<span style="color:var(--coral)">' + U.esc(e.message) + '</span>';
    });
  }

  function salvarChat() {
    S.chat = App.chatMsgs.slice(-40);
    PZ.store.save();
  }

  function irAChat(pergunta) {
    App.tab = 'chat';
    render();
    setTimeout(function () {
      var ta = document.getElementById('chat-in');
      if (ta) { ta.value = pergunta; ta.focus(); }
    }, 60);
  }

  /* ============================================================
     PROGRESO
     ============================================================ */
  function vistaProgresso(c) {
    var lv = PZ.store.levelInfo();
    var dias = [];
    for (var i = 13; i >= 0; i--) {
      var d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
      dias.push({ d: d, xp: S.days[d] || 0 });
    }
    var max = Math.max.apply(null, dias.map(function (x) { return x.xp; }).concat([10]));
    var aprendidas = S.cards.filter(function (x) { return x.reps >= 3; }).length;
    var domingo = new Date().getDay();
    var semana = dias.slice(-7).reduce(function (a, b) { return a + (b.xp > 0 ? 1 : 0); }, 0);

    c.innerHTML =
      '<div class="grid g3" style="margin-bottom:16px">' +
      '<div class="card pad row" style="gap:16px"><div class="ring" style="--p:' + lv.pct + '"><div>' + lv.level + '</div></div>' +
      '<div><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.08em;font-weight:750">Tu nivel</div>' +
      '<div class="stat-big">' + lv.xp + ' XP</div><div class="tiny muted">Faltan ' + lv.falta + ' para el nivel ' + (lv.level + 1) + '</div></div></div>' +
      '<div class="card pad"><div class="stat-big">🔥 ' + S.streak + '</div><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.08em;font-weight:750">días seguidos</div>' +
      '<div class="tiny muted" style="margin-top:6px">' + semana + ' de los últimos 7 días con actividad</div></div>' +
      '<div class="card pad"><div class="stat-big">' + S.cards.length + '</div><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.08em;font-weight:750">tarjetas</div>' +
      '<div class="tiny muted" style="margin-top:6px">' + aprendidas + ' ya consolidadas</div></div>' +
      '</div>' +

      '<div class="card pad"><div class="row"><h3 style="font-size:16px">Últimos 14 días</h3><div class="spacer"></div>' +
      '<span class="chip">' + (S.days[PZ.store.hoy()] || 0) + ' XP hoy</span></div>' +
      '<div class="bars">' + dias.map(function (x) {
        var h = Math.max(3, Math.round((x.xp / max) * 100));
        return '<div class="b" style="height:' + h + '%"><span>' + (x.xp || '') + '</span><i>' + x.d.slice(8) + '</i></div>';
      }).join('') + '</div></div>' +

      '<div class="sec-title"><h3>Juegos</h3></div><div id="p-games" class="grid g3"></div>' +

      '<div class="sec-title"><h3>Logros</h3></div><div id="p-logros" class="grid g4"></div>';

    var nomes = { match: 'Emparejar', dictation: 'Dictado', conj: 'Conjugación', gender: 'Género', order: 'Ordenar', translate: 'Traducción' };
    c.querySelector('#p-games').innerHTML = Object.keys(nomes).map(function (k) {
      var g = S.games[k] || { ok: 0, total: 0 };
      var pct = g.total ? Math.round((g.ok / g.total) * 100) : 0;
      return '<div class="card pad"><div class="row"><b style="font-size:13.5px">' + nomes[k] + '</b><div class="spacer"></div><b>' + pct + '%</b></div>' +
        '<div class="xp-bar" style="width:100%;margin-top:8px"><i style="width:' + pct + '%"></i></div>' +
        '<div class="tiny muted" style="margin-top:4px">' + g.ok + ' aciertos de ' + g.total + '</div></div>';
    }).join('');

    var logros = [
      ['🌱', 'Primer paso', S.xp > 0],
      ['🔥', 'Racha de 3', S.streak >= 3],
      ['🃏', '10 tarjetas', S.cards.length >= 10],
      ['📖', 'Texto analizado', !!App.doc],
      ['🎤', 'Guía escuchada', true],
      ['🧩', '20 conjugaciones', (S.games.conj || {}).total >= 20],
      ['⚡', 'Traducción veloz', ((S.games.translate || {}).ok || 0) >= 20],
      ['🏆', 'Nivel 5', lv.level >= 5]
    ];
    c.querySelector('#p-logros').innerHTML = logros.map(function (l) {
      return '<div class="card pad center" style="opacity:' + (l[2] ? 1 : .38) + '"><div style="font-size:26px">' + l[0] + '</div>' +
        '<div class="small" style="font-weight:650">' + l[1] + '</div></div>';
    }).join('');
  }

  /* ============================================================
     AJUSTES
     ============================================================ */
  function naWeb() {
    return location.protocol.indexOf('http') === 0 &&
      location.hostname !== '127.0.0.1' && location.hostname !== 'localhost';
  }

  function vistaAjustes(c) {
    var s = S.settings;
    var provs = Object.keys(PZ.ai.proveedores).map(function (k) {
      return '<option value="' + k + '"' + (s.provider === k ? ' selected' : '') + '>' + PZ.ai.proveedores[k].nome + '</option>';
    }).join('');
    var vozes = U.vocesPt().map(function (v) {
      return '<option value="' + U.esc(v.name) + '"' + (s.voice === v.name ? ' selected' : '') + '>' + U.esc(v.name) + ' (' + v.lang + ')</option>';
    }).join('');

    c.innerHTML =
      '<div class="grid g2">' +
      '<div class="card pad">' +
      '<h3 style="font-size:16px;margin-bottom:4px">Inteligencia artificial</h3>' +
      '<p class="small muted" style="margin-bottom:14px">Pegá tu clave de API. Se guarda solo en tu navegador y nunca se sube a ningún lado.</p>' +
      '<label class="fld"><span>Proveedor</span><select id="s-prov">' + provs + '</select></label>' +
      '<label class="fld"><span>Modelo</span><input type="text" id="s-model" value="' + U.esc(s.model) + '" placeholder="deepseek-chat"></label>' +
      '<label class="fld"><span>API key</span><input type="password" id="s-key" value="' + U.esc(s.apiKey) + '" placeholder="sk-…"></label>' +
      '<label class="fld"><span>URL base (opcional)</span><input type="text" id="s-base" value="' + U.esc(s.baseUrl) + '" placeholder="https://…"></label>' +
      '<div class="row" style="gap:8px"><button class="btn teal" id="s-save">Guardar</button>' +
      '<button class="btn ghost" id="s-test">Probar conexión</button></div>' +
      '<div id="s-test-out" class="small" style="margin-top:10px"></div>' +
      '</div>' +

      '<div class="card pad">' +
      '<h3 style="font-size:16px;margin-bottom:12px">Voz y lectura</h3>' +
      '<label class="fld"><span>Variedad</span><select id="s-variety">' +
      '<option value="br"' + (s.variety === 'br' ? ' selected' : '') + '>Portugués de Brasil</option>' +
      '<option value="pt"' + (s.variety === 'pt' ? ' selected' : '') + '>Portugués de Portugal</option></select></label>' +
      '<label class="fld"><span>Voz</span><select id="s-voice"><option value="">Automática</option>' + vozes + '</select></label>' +
      '<label class="fld"><span>Velocidad: <b id="s-rate-v">' + s.rate + '</b></span>' +
      '<input type="range" id="s-rate" min="0.5" max="1.3" step="0.05" value="' + s.rate + '" style="width:100%"></label>' +
      '<label class="fld"><span>Tu nivel</span><select id="s-level">' +
      ['A1', 'A2', 'B1', 'B2'].map(function (n) { return '<option' + (s.aiLevel === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
      '</select></label>' +
      '<div class="row" style="gap:8px"><button class="btn ghost sm" id="s-demo">🔊 Probar voz</button>' +
      '<span class="tiny muted">' + U.vocesPt().length + ' voces en portugués detectadas</span></div>' +
      '</div>' +

      '<div class="card pad">' +
      '<h3 style="font-size:16px;margin-bottom:12px">Tus datos</h3>' +
      '<p class="small muted" style="margin-bottom:12px">Todo vive en este navegador. Podés llevarte una copia o empezar de cero.</p>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ghost sm" id="s-export">⬇ Exportar progreso</button>' +
      '<label class="btn ghost sm" style="cursor:pointer">⬆ Importar<input type="file" id="s-import" accept=".json" style="display:none"></label>' +
      '<button class="btn sm" id="s-reset" style="background:var(--coral)">Borrar todo</button></div>' +
      '</div>' +

      '<div class="card pad">' +
      '<h3 style="font-size:16px;margin-bottom:8px">Cómo funciona la IA</h3>' +
      (naWeb()
        ? '<p class="small muted">Estás usando la <b>versión web</b>: la clave se guarda en este navegador y viaja directo al proveedor que elijas (no pasa por ningún servidor nuestro). Funciona con los cinco proveedores de la lista.</p>'
        : '<p class="small muted">Estás usando la <b>versión local</b>: las consultas pasan por el pequeño servidor de <b>Iniciar app.command</b>, así que no hay problemas de conexión con ningún proveedor.</p>') +
      '<div class="divider"></div>' +
      '<div class="tiny muted">Consejo: para el oral alcanza con DeepSeek u OpenAI. Pegá la clave, guardá y probá. No uses una computadora compartida: la clave queda en ese navegador.</div>' +
      '</div>' +
      '</div>';

    c.querySelector('#s-save').onclick = function () {
      s.provider = c.querySelector('#s-prov').value;
      s.model = c.querySelector('#s-model').value.trim();
      s.apiKey = c.querySelector('#s-key').value.trim();
      s.baseUrl = c.querySelector('#s-base').value.trim();
      s.variety = c.querySelector('#s-variety').value;
      s.voice = c.querySelector('#s-voice').value;
      s.rate = parseFloat(c.querySelector('#s-rate').value);
      s.aiLevel = c.querySelector('#s-level').value;
      PZ.store.saveNow();
      U.toast('Guardado ✓', 'good');
      atuaizarAvisoIA();
    };
    c.querySelector('#s-rate').oninput = function (e) { c.querySelector('#s-rate-v').textContent = e.target.value; };
    c.querySelector('#s-demo').onclick = function () { U.speak('Olá! Eu quero aprender português para o meu oral de 2027.'); };
    c.querySelector('#s-test').onclick = function () {
      var out = c.querySelector('#s-test-out');
      out.innerHTML = '<span class="muted">Probando…</span>';
      PZ.ai.chat([{ role: 'user', content: 'Respondé solo: "ok"' }], { maxTokens: 12 })
        .then(function (t) { out.innerHTML = '<span style="color:var(--green);font-weight:650">Funciona ✓ (' + U.esc(t.slice(0, 40)) + ')</span>'; })
        .catch(function (e) { out.innerHTML = '<span style="color:var(--coral)">' + U.esc(e.message) + '</span>'; });
    };
    c.querySelector('#s-export').onclick = function () {
      var blob = new Blob([PZ.store.exportar()], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'portugues-progreso-' + PZ.store.hoy() + '.json';
      a.click();
    };
    c.querySelector('#s-import').onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try { PZ.store.importar(r.result); U.toast('Importado ✓', 'good'); init(); }
        catch (err) { U.toast('Archivo inválido', 'bad'); }
      };
      r.readAsText(f);
    };
    c.querySelector('#s-reset').onclick = function () {
      if (!confirm('¿Borrar TODO tu progreso? No se puede deshacer.')) return;
      PZ.store.reset(); U.toast('Listo, empezás de cero'); init();
    };
  }

  /* ============================================================
     API pública
     ============================================================ */
  PZ.app = {
    init: init, ir: ir, render: render, irAChat: irAChat,
    atualizarXP: atualizarXP,
    get doc() { return App.doc; },
    get tab() { return App.tab; }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
