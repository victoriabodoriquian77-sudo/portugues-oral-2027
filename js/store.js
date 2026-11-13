/* ============================================================
   store.js — estado, progreso, repaso espaciado (SRS) y ajustes
   Todo se guarda en localStorage de tu navegador.
   ============================================================ */
(function () {
  'use strict';
  var PZ = (window.PZ = window.PZ || {});
  var KEY = 'pzc.v1';

  function hoy() { return new Date().toISOString().slice(0, 10); }

  var DEFAULT = {
    v: 1,
    xp: 0,
    streak: 0,
    lastDay: '',
    days: {},          // { '2026-11-13': xp }
    cards: [],         // flashcards SRS
    games: {},         // estadísticas por juego
    seen: {},          // lemas ya vistos
    chat: [],          // historial del chat
    settings: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: '',
      baseUrl: '',
      voice: '',
      rate: 0.95,
      showEs: true,
      gloss: false,
      variety: 'br',
      aiLevel: 'A2',
      autoTranslate: true
    },
    oral: { done: {}, notes: '' }
  };

  var state = null;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        state = Object.assign(clone(DEFAULT), d);
        state.settings = Object.assign(clone(DEFAULT.settings), d.settings || {});
        state.oral = Object.assign(clone(DEFAULT.oral), d.oral || {});
      } else {
        state = clone(DEFAULT);
      }
    } catch (e) {
      state = clone(DEFAULT);
    }
    return state;
  }

  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { }
    }, 120);
  }
  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { }
  }

  /* ---------- progreso ---------- */
  function levelInfo() {
    var xp = state.xp;
    // nivel n requiere 60 * n^1.35 acumulado
    var n = 1;
    while (xp >= xpForLevel(n + 1)) n++;
    var base = xpForLevel(n), next = xpForLevel(n + 1);
    return {
      level: n,
      xp: xp,
      base: base,
      next: next,
      pct: Math.max(0, Math.min(100, ((xp - base) / (next - base)) * 100)),
      falta: Math.max(0, next - xp)
    };
  }
  function xpForLevel(n) { return Math.round(60 * Math.pow(n - 1, 1.35) * 1.6); }

  function addXP(n, motivo) {
    var antes = levelInfo().level;
    state.xp += n;
    state.days[hoy()] = (state.days[hoy()] || 0) + n;
    save();
    var desp = levelInfo().level;
    if (desp > antes) {
      document.dispatchEvent(new CustomEvent('pz:levelup', { detail: { level: desp } }));
    }
    return { xp: state.xp, level: desp };
  }

  function touchStreak() {
    var h = hoy();
    if (state.lastDay === h) return state.streak;
    var ayer = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    if (state.lastDay === ayer) state.streak += 1;
    else if (state.lastDay !== h) state.streak = 1;
    state.lastDay = h;
    save();
    return state.streak;
  }

  /* ---------- tarjetas / SRS ---------- */
  function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }

  function addCard(front, back, meta) {
    meta = meta || {};
    var existe = state.cards.filter(function (c) {
      return c.front.toLowerCase() === String(front).toLowerCase();
    })[0];
    if (existe) return { card: existe, nuevo: false };
    var c = {
      id: uid(), front: front, back: back, meta: meta,
      due: Date.now(), interval: 0, ease: 2.5, reps: 0, lapses: 0, created: Date.now()
    };
    state.cards.push(c);
    save();
    return { card: c, nuevo: true };
  }

  function removeCard(id) {
    state.cards = state.cards.filter(function (c) { return c.id !== id; });
    save();
  }

  function dueCards() {
    var now = Date.now();
    return state.cards.filter(function (c) { return c.due <= now; })
      .sort(function (a, b) { return a.due - b.due; });
  }

  function rateCard(id, q) {
    var c = state.cards.filter(function (x) { return x.id === id; })[0];
    if (!c) return null;
    c.reps += 1;
    var dias;
    if (q === 0) { c.lapses += 1; c.ease = Math.max(1.3, c.ease - 0.2); dias = 0; }
    else if (q === 1) { c.ease = Math.max(1.3, c.ease - 0.12); dias = Math.max(1, c.interval * 1.25); }
    else if (q === 2) { dias = c.interval === 0 ? 1 : c.interval * c.ease; }
    else { c.ease = Math.min(3.0, c.ease + 0.15); dias = (c.interval === 0 ? 2 : c.interval * c.ease * 1.25); }
    c.interval = Math.round(dias * 10) / 10;
    var ms = q === 0 ? 10 * 60 * 1000 : c.interval * 864e5;
    c.due = Date.now() + ms;
    c.last = Date.now();
    save();
    return c;
  }

  /* ---------- estadísticas ---------- */
  function gameStat(jogo, ok) {
    if (!state.games[jogo]) state.games[jogo] = { ok: 0, total: 0 };
    state.games[jogo].total += 1;
    if (ok) state.games[jogo].ok += 1;
    save();
  }

  function markSeen(lema) {
    if (!lema) return;
    var n = state.seen[lema] || 0;
    state.seen[lema] = n + 1;
    save();
  }

  function cardsFromText(doc) {
    var n = 0;
    (doc.palavras || []).forEach(function (p) {
      if (!p.es || p.fonte === 'none' || p.fonte === 'prop') return;
      var frente = p.lemma && p.pos === 'verbo' ? p.lemma : p.w;
      var verso = p.es;
      if (p.verbFicha && p.verbFicha.tempo !== 'infinitivo') {
        frente = p.lemma;
        verso = p.es + '  ·  forma del texto: ' + p.raw + ' (' + p.verbFicha.pessoa + ')';
      }
      var r = addCard(frente, verso, { pos: p.pos, fonte: 'texto' });
      if (r.nuevo) n++;
    });
    (window.ORAL_SEED ? window.ORAL_SEED.vocab : []).forEach(function (v) {
      var r = addCard(v.pt, v.es, { fonte: 'guia' });
      if (r.nuevo) n++;
    });
    return n;
  }

  function exportar() { return JSON.stringify(state, null, 2); }
  function importar(txt) {
    var d = JSON.parse(txt);
    if (!d || typeof d !== 'object') throw new Error('formato inválido');
    state = Object.assign(clone(DEFAULT), d);
    state.settings = Object.assign(clone(DEFAULT.settings), d.settings || {});
    saveNow();
    return true;
  }
  function reset() {
    state = clone(DEFAULT);
    saveNow();
  }

  PZ.store = {
    load: load, save: save, saveNow: saveNow,
    get state() { return state; },
    get s() { return state.settings; },
    levelInfo: levelInfo, addXP: addXP, touchStreak: touchStreak,
    addCard: addCard, removeCard: removeCard, dueCards: dueCards, rateCard: rateCard,
    cardsFromText: cardsFromText, gameStat: gameStat, markSeen: markSeen,
    exportar: exportar, importar: importar, reset: reset,
    hoy: hoy
  };
})();
