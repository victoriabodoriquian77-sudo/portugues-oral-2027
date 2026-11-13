/* ============================================================
   analyzer.js — convierte un texto en un documento diglot:
   párrafos → frases → palabras con traducción, lema y análisis.
   ============================================================ */
(function () {
  'use strict';
  var PZ = (window.PZ = window.PZ || {});

  var PREPS = { para: 'para', por: 'por', sem: 'sin', de: 'de', em: 'en', com: 'con', a: 'a', 'até': 'hasta', entre: 'entre', sobre: 'sobre', desde: 'desde', contra: 'contra', 'após': 'después de', como: 'como', 'exceto': 'excepto', 'conforme': 'según', 'durante': 'durante', 'mediante': 'mediante', 'pra': 'para', 'pro': 'para el' };

  var MODAIS = { querer: 1, quero: 1, queres: 1, quer: 1, queremos: 1, querem: 1, poder: 1, posso: 1, podes: 1, pode: 1, podemos: 1, podem: 1, dever: 1, devo: 1, deves: 1, deve: 1, devemos: 1, devem: 1, precisar: 1, preciso: 1, precisas: 1, precisa: 1, precisamos: 1, precisam: 1, conseguir: 1, consigo: 1, consegues: 1, consegue: 1, conseguimos: 1, conseguem: 1, saber: 1, sei: 1, sabes: 1, sabe: 1, sabemos: 1, sabem: 1, 'ter': 1, tenho: 1, tens: 1, tem: 1, temos: 1, têm: 1, gostar: 1, gosto: 1, gostas: 1, gosta: 1, gostamos: 1, gostam: 1, deixar: 1, deixo: 1, tentar: 1, tento: 1, esperar: 1, espero: 1, pretender: 1, pretendo: 1, costumar: 1, costumo: 1, acabar: 1, começar: 1, odiar: 1, adorar: 1, poder: 1, conseguir_: 1 };

  var IR_FORMS = { vou: 1, vais: 1, vai: 1, vamos: 1, ides: 1, 'vão': 1, ia: 1, ias: 1, 'íamos': 1, iam: 1, irei: 1, 'irás': 1, 'irá': 1, iremos: 1, 'irão': 1 };

  var FUSAO = {
    do: ['de', 'o', 'del'], da: ['de', 'a', 'de la'], dos: ['de', 'os', 'de los'], das: ['de', 'as', 'de las'],
    dum: ['de', 'um', 'de un'], duma: ['de', 'uma', 'de una'],
    no: ['em', 'o', 'en el'], na: ['em', 'a', 'en la'], nos: ['em', 'os', 'en los'], nas: ['em', 'as', 'en las'],
    num: ['em', 'um', 'en un'], numa: ['em', 'uma', 'en una'],
    ao: ['a', 'o', 'al'], aos: ['a', 'os', 'a los'], 'à': ['a', 'a', 'a la'], 'às': ['a', 'as', 'a las'],
    pelo: ['por', 'o', 'por el'], pela: ['por', 'a', 'por la'], pelos: ['por', 'os', 'por los'], pelas: ['por', 'as', 'por las'],
    neste: ['em', 'este', 'en este'], nesta: ['em', 'esta', 'en esta'], nisto: ['em', 'isto', 'en esto'],
    nisso: ['em', 'isso', 'en eso'], nesse: ['em', 'esse', 'en ese'], nessa: ['em', 'essa', 'en esa'],
    naquele: ['em', 'aquele', 'en aquel'], naquela: ['em', 'aquela', 'en aquella'],
    dele: ['de', 'ele', 'de él'], dela: ['de', 'ela', 'de ella'], deles: ['de', 'eles', 'de ellos'], delas: ['de', 'elas', 'de ellas'],
    deste: ['de', 'este', 'de este'], desta: ['de', 'esta', 'de esta'], disto: ['de', 'isto', 'de esto'],
    disso: ['de', 'isso', 'de eso'], desse: ['de', 'esse', 'de ese'], dessa: ['de', 'essa', 'de esa'],
    daquele: ['de', 'aquele', 'de aquel'], daquela: ['de', 'aquela', 'de aquella'],
    pro: ['para', 'o', 'para el'], pra: ['para', 'a', 'para la']
  };

  var ARTIGOS = { o: 1, a: 1, os: 1, as: 1, um: 1, uma: 1, uns: 1, umas: 1 };
  var GRUPOS_FUNC = ['art', 'prep', 'conj', 'pron', 'poss', 'dem', 'adv', 'num', 'interj'];
  var NAO_VERBO_FUNC = { pron: 1, art: 1, conj: 1, prep: 1, adv: 1, num: 1 };

  /* ---------- tokenizado ---------- */
  var WORD_RE = /[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[’'\-][A-Za-zÀ-ÖØ-öø-ÿ]+)*|[^\s]/g;

  function tokenizar(frase) {
    var out = [], m;
    WORD_RE.lastIndex = 0;
    while ((m = WORD_RE.exec(frase)) !== null) {
      out.push({ raw: m[0], w: m[0].toLowerCase(), isWord: /[A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(m[0]) });
    }
    return out;
  }

  /* ---------- morfología ---------- */
  function singularizar(w) {
    var c = [];
    if (/(ões|ães|ãos)$/.test(w)) c.push(w.replace(/(ões|ães|ãos)$/, 'ão'));
    if (/ais$/.test(w)) c.push(w.replace(/ais$/, 'al'));
    if (/éis$/.test(w)) c.push(w.replace(/éis$/, 'el'));
    if (/eis$/.test(w)) c.push(w.replace(/eis$/, 'el'));
    if (/is$/.test(w)) c.push(w.replace(/is$/, 'il'), w.replace(/is$/, 'l'));
    if (/ns$/.test(w)) c.push(w.replace(/ns$/, 'm'));
    if (/res$/.test(w)) c.push(w.replace(/res$/, 'r'));
    if (/zes$/.test(w)) c.push(w.replace(/zes$/, 'z'));
    if (/ses$/.test(w)) c.push(w.replace(/ses$/, 's'));
    if (/es$/.test(w)) c.push(w.replace(/es$/, ''), w.replace(/es$/, 'e'));
    if (/s$/.test(w)) c.push(w.replace(/s$/, ''));
    return c;
  }

  function lex(w) { return (window.LEX_DATA && window.LEX_DATA.words) ? window.LEX_DATA.words[w] : null; }

  function verboConhecido(inf) {
    if (!inf) return false;
    if (PZ.conj.irregulares[inf]) return true;
    var L = lex(inf);
    if (L && L.pos === 'verbo') return true;
    var sv = (window.ORAL_SEED && window.ORAL_SEED.verbs) || [];
    return sv.indexOf(inf) >= 0;
  }

  function heuristica(w) {
    if (/-mente$/.test(w) && w.length > 7) {
      return { pos: 'adv', es: w.replace(/-mente$/, '') + 'mente', nota: 'Adverbio en -mente: se forma con el femenino del adjetivo + mente.' };
    }
    if (/(ção|ções)$/.test(w) && w.length > 5) {
      return { pos: 'sust', g: 'f', es: w.replace(/ções$/, 'ciones').replace(/ção$/, 'ción'), nota: 'Sustantivo femenino en -ção (plural -ções). Casi siempre equivale al español -ción.' };
    }
    if (/dade$/.test(w) && w.length > 6) return { pos: 'sust', g: 'f', es: w.replace(/dade$/, 'dad'), nota: 'Sustantivo femenino en -dade = español -dad.' };
    if (/(gem|gens)$/.test(w) && w.length > 5) return { pos: 'sust', g: 'f', es: '', nota: 'Sustantivo femenino en -gem.' };
    if (/ndo$/.test(w)) {
      var base = w.replace(/ndo$/, '');
      if (verboConhecido(base + 'ar') || verboConhecido(base + 'er') || verboConhecido(base + 'ir')) {
        return { pos: 'verbo', es: '', nota: 'Gerundio (terminación -ndo).' };
      }
    }
    if (/(ado|ido|ada|ida)$/.test(w) && w.length > 5) {
      var b2 = w.replace(/(ado|ido|ada|ida)$/, '');
      if (verboConhecido(b2 + 'ar') || verboConhecido(b2 + 'er') || verboConhecido(b2 + 'ir')) {
        return { pos: 'adj', es: '', nota: 'Participio usado como adjetivo.' };
      }
    }
    if (/(inho|inha)$/.test(w) && w.length > 6) return { pos: 'sust', es: '', nota: 'Diminutivo en -inho/-inha, muy usado en Brasil (carrinho = carrito).' };
    if (/(eiro|eira)$/.test(w) && w.length > 6) return { pos: 'sust', es: '', nota: 'Sustantivo en -eiro/-eira: oficio o lugar.' };
    if (/(oso|osa)$/.test(w) && w.length > 5) return { pos: 'adj', es: '', nota: 'Adjetivo en -oso/-osa.' };
    return null;
  }

  /* ---------- palabras funcionales ---------- */
  function funcInfo(w, ctx) {
    var F = window.FUNC_WORDS;
    if (!F) return null;
    for (var i = 0; i < GRUPOS_FUNC.length; i++) {
      var g = GRUPOS_FUNC[i];
      if (F[g] && F[g][w]) {
        // "a" y "o": artículo o pronombre según contexto
        if (ARTIGOS[w] && ctx && ctx.next) {
          var sig = ctx.next.toLowerCase();
          var sigEsVerbo = !!(PZ.conj.analisar(sig) || (lex(sig) && lex(sig).pos === 'verbo'));
          var prevEsVerbo = !!(ctx.prev && (PZ.conj.analisar(ctx.prev) || (lex(ctx.prev) && lex(ctx.prev).pos === 'verbo')));
          if (sigEsVerbo) {
            return { pos: 'prep', es: 'a', nota: 'Preposición <b>a</b>: delante de un verbo en infinitivo expresa finalidad o inicio de acción.' };
          }
          if (!ctx.next && prevEsVerbo) {
            return { pos: 'pron', es: (w === 'a' || w === 'as') ? 'la' : 'lo', nota: 'Pronombre de objeto directo, va después del verbo.' };
          }
        }
        return { pos: g === 'poss' ? 'det' : (g === 'dem' ? 'det' : g), es: F[g][w] };
      }
    }
    return null;
  }

  function esCorto(es) {
    if (!es) return '';
    return String(es).split(' / ')[0];
  }

  /* ---------- por qué está en infinitivo ---------- */
  function explicarInfinitivo(prev, prev2) {
    var p = (prev || '').toLowerCase(), p2 = (prev2 || '').toLowerCase();
    if (p === 'ao' || p === 'aos' || p === 'às') {
      return 'Va después de <b>ao / aos / às</b> + infinitivo. En español equivale a "al + infinitivo" y marca una acción simultánea o inmediata: <i>ao chegar</i> = al llegar.';
    }
    if (PREPS[p] && p !== 'a') {
      if (p === 'de' && (p2 === 'antes' || p2 === 'depois' || p2 === 'em vez' || p2 === 'apesar' || p2 === 'além')) {
        return 'Va después de <b>' + p2 + ' de</b>. En portugués, después de una preposición el verbo va en infinitivo, nunca en subjuntivo ni en gerundio.';
      }
      return 'Va después de la preposición <b>' + PREPS[p] + '</b> (' + p + '). En portugués las preposiciones se construyen con infinitivo.';
    }
    if (p === 'a') {
      return 'Va después de <b>a</b>: puede ser la preposición "a" o el inicio de una perífrasis (<i>começar a + infinitivo</i> = empezar a + infinitivo). En portugués, la preposición se construye con infinitivo.';
    }
    if (IR_FORMS[p]) {
      return 'Va después de <b>' + p + '</b> (verbo <i>ir</i>): es el <b>futuro perifrástico</b>, "ir + infinitivo" = "voy a + infinitivo". Es la forma más usada para hablar del futuro.';
    }
    if (MODAIS[p]) {
      return 'Va después de <b>' + p + '</b>, que ya está conjugado: el primer verbo lleva la persona y el segundo queda en infinitivo, igual que en español (<i>quiero estudiar</i>).';
    }
    if (p === 'por' || p === 'para') {
      return 'Va después de <b>' + p + '</b>: expresa finalidad o causa ("para + infinitivo").';
    }
    return 'Es la forma de diccionario del verbo. Aquí aparece sin conjugar, así que no lleva persona ni tiempo: nombra la acción.';
  }

  /* ---------- personas que comparten la misma forma ---------- */
  function pessoasDaForma(forma, tempo, inf) {
    var c = PZ.conj.conjugar(inf);
    if (!c) return '';
    var arr = c[tempo] || (tempo === 'gerundio' ? [] : null);
    if (!Array.isArray(arr)) return '';
    var out = [];
    arr.forEach(function (f, i) {
      if (i === 0 && tempo === 'imperativoNeg') return;
      if (String(f).toLowerCase() === String(forma).toLowerCase()) out.push(PZ.conj.pessoaNome(i, true));
    });
    return out.join(' / ');
  }

  /* ---------- análisis de una palabra ---------- */
  function analisarPalavra(raw, ctx) {
    ctx = ctx || {};
    var w = raw.toLowerCase();
    var info = { w: w, raw: raw, gloss: '', tipo: 'other', extra: [], fonte: 'none' };

    /* con guion: verbo + pronombre */
    if (raw.indexOf('-') > 0) {
      var partes = raw.split('-');
      var base = analisarPalavra(partes[0], ctx);
      var clit = partes.slice(1).map(function (p) {
        return { p: p.toLowerCase(), es: (window.FUNC_WORDS && window.FUNC_WORDS.pron[p.toLowerCase()]) || p };
      });
      return {
        w: w, raw: raw, tipo: base.tipo, fonte: base.fonte, gloss: base.gloss,
        base: base, cliticos: clit, es: base.es, lemma: base.lemma, pos: base.pos,
        verbFicha: base.verbFicha,
        nota: 'Forma con pronombre enclítico: el verbo va primero y el pronombre se pega con guion (' + clit.map(function (c) { return c.p; }).join(', ') + ').'
      };
    }

    var L = lex(w);
    var formas = PZ.conj.analisar(w);
    var F = funcInfo(w, ctx);

    /* 1) léxico no verbal */
    if (L && L.pos !== 'verbo') {
      if (ARTIGOS[w] && F && F.pos === 'art') {
        info.pos = 'art'; info.es = F.es; info.gloss = F.es; info.fonte = 'func'; info.tipo = 'other';
        info.nota = 'Artículo definido. En portugués concuerda en género y número con el sustantivo.';
        return info;
      }
      info.pos = L.pos; info.es = L.es; info.lemma = w; info.fonte = 'lex';
      info.gloss = esCorto(L.es);
      info.tipo = L.pos === 'sust' ? 'noun' : (L.pos === 'adj' ? 'adj' : 'other');
      if (L.g) info.genero = L.g;
      if (L.pl) info.plural = L.pl;
      if (L.f) info.fem = L.f;
      if (L.alt) info.alt = L.alt;
      if (L.ex) info.ex = L.ex;
      if (FUSAO[w]) {
        var fu0 = FUSAO[w];
        info.nota = '<b>' + w + '</b> = ' + fu0[0] + ' + ' + fu0[1] + '. En portugués la preposición y el artículo se fusionan obligatoriamente.';
      }
      if (formas && formas.length) info.extra.push('También es forma del verbo <b>' + formas[0].inf + '</b> (<i>' + formas[0].forma + '</i>).');
      return info;
    }

    /* 2) verbos */
    var podeSerVerbo = formas && formas.length && !(F && NAO_VERBO_FUNC[F.pos]);
    if (podeSerVerbo || (L && L.pos === 'verbo' && !(F && NAO_VERBO_FUNC[F.pos]))) {
      if (L && L.pos === 'verbo') {
        info.pos = 'verbo'; info.es = L.es; info.lemma = w; info.fonte = 'lex'; info.tipo = 'verb';
        info.gloss = esCorto(L.es);
        info.verbFicha = {
          infinitivo: w, tempo: 'infinitivo', tempoNome: 'Infinitivo', pessoa: '',
          titulo: 'Infinitivo · ' + w, why: explicarInfinitivo(ctx.prev, ctx.prev2),
          forma: w, grupo: PZ.conj.grupo(w)
        };
        if (L.ex) info.ex = L.ex;
        return info;
      }
      var f = formas[0];
      info.pos = 'verbo'; info.tipo = 'verb'; info.fonte = 'conj';
      var ficha = PZ.conj.ficha(f);
      var vLex = lex(f.inf);
      info.es = vLex ? vLex.es : '';
      info.lemma = f.inf;
      info.verbFicha = ficha;
      var pessoas = pessoasDaForma(f.forma, f.tempo, f.inf);
      if (pessoas) ficha.pessoa = pessoas;
      ficha.titulo = ficha.tempoNome + (pessoas ? ' · ' + pessoas : '');
      info.formas = formas.slice(0, 4).map(function (x) { return PZ.conj.ficha(x); });
      info.gloss = (window.GLOSS_FIX && window.GLOSS_FIX[w]) || esCorto(info.es) || f.inf;
      if (vLex && vLex.ex) info.ex = vLex.ex;
      return info;
    }

    /* 3) palabras funcionales */
    if (F) {
      info.pos = F.pos; info.es = F.es; info.gloss = F.es; info.fonte = 'func';
      info.tipo = 'other';
      var nomes = { art: 'Artículo', prep: 'Preposición', conj: 'Conjunción', pron: 'Pronombre', det: 'Determinante', adv: 'Adverbio', num: 'Numeral', interj: 'Interjección' };
      info.nota = (nomes[F.pos] || 'Palabra funcional') + '.';
      return info;
    }

    /* 4) contracciones */
    if (FUSAO[w]) {
      var fu = FUSAO[w];
      info.pos = 'prep'; info.fonte = 'fusao'; info.es = fu[2]; info.gloss = fu[2];
      info.nota = '<b>' + w + '</b> = ' + fu[0] + ' + ' + fu[1] + '. En portugués la preposición y el artículo se fusionan obligatoriamente.';
      return info;
    }

    /* 5) plural en el léxico */
    var cands = singularizar(w);
    for (var i = 0; i < cands.length; i++) {
      var L2 = lex(cands[i]);
      var viaFem = false;
      if (!L2 && /a$/.test(cands[i])) { L2 = lex(cands[i].replace(/a$/, 'o')); viaFem = !!L2; }
      if (L2 && L2.pos !== 'verbo') {
        info.pos = L2.pos; info.es = L2.es; info.lemma = cands[i]; info.fonte = 'lex-plural';
        var esp = esCorto(L2.es);
        if (viaFem && /o$/.test(esp)) esp = esp.slice(0, -1) + 'a';
        if (esp && esp.indexOf('/') < 0 && !/[sxz]$/.test(esp)) {
          esp = /[aeiouáéíóú]$/.test(esp) ? esp + 's' : esp + 'es';
        }
        info.gloss = esp;
        info.tipo = L2.pos === 'sust' ? 'noun' : (L2.pos === 'adj' ? 'adj' : 'other');
        info.nota = 'Plural de <b>' + cands[i] + '</b>.';
        if (L2.pl) info.plural = L2.pl;
        if (L2.g) info.genero = L2.g;
        if (L2.ex) info.ex = L2.ex;
        return info;
      }
    }
    if (/-a$/.test(w)) {
      var L3 = lex(w.replace(/-a$/, 'o'));
      if (L3 && L3.pos === 'adj') {
        info.pos = 'adj'; info.es = L3.es; info.lemma = w; info.fonte = 'lex-fem';
        info.gloss = esCorto(L3.es); info.tipo = 'adj';
        info.nota = 'Femenino del adjetivo <b>' + w.replace(/-a$/, 'o') + '</b>.';
        return info;
      }
    }

    /* 6) heurística morfológica */
    var h = heuristica(w);
    if (h) {
      info.pos = h.pos; info.es = h.es || ''; info.lemma = w; info.fonte = 'heur';
      info.gloss = esCorto(h.es) || w;
      info.nota = h.nota;
      if (h.g) info.genero = h.g;
      info.tipo = h.pos === 'sust' ? 'noun' : (h.pos === 'adj' ? 'adj' : 'other');
      return info;
    }

    /* 7) números y nombres propios */
    if (/^\d+([.,]\d+)?$/.test(w)) { info.pos = 'num'; info.es = w; info.gloss = w; info.fonte = 'num'; return info; }
    if (/^[A-ZÀ-Ý]/.test(raw)) {
      info.pos = 'nome'; info.es = ''; info.gloss = raw; info.fonte = 'prop';
      info.nota = 'Nombre propio: no se traduce.'; return info;
    }

    info.gloss = w;
    info.tipo = 'unk';
    info.nota = 'No está en el diccionario offline.';
    return info;
  }

  /* ---------- frases y párrafos ---------- */
  function partirFrases(texto) {
    var t = texto.replace(/\s+/g, ' ').trim();
    if (!t) return [];
    var out = [], ini = 0, m;
    var re = /([.!?…]+)(\s+|$)/g;
    while ((m = re.exec(t)) !== null) {
      var fim = m.index + m[1].length;
      var seg = t.slice(ini, fim).trim();
      if (seg) out.push(seg);
      ini = m.index + m[0].length;
    }
    if (ini < t.length) { var r = t.slice(ini).trim(); if (r) out.push(r); }
    return out.length ? out : [t];
  }

  function partirParagrafos(texto) {
    var blocos = String(texto).replace(/\r/g, '').split(/\n\s*\n/);
    if (blocos.length === 1) blocos = String(texto).replace(/\r/g, '').split(/\n/);
    return blocos.map(function (b) { return b.trim(); }).filter(function (b) { return b.length; });
  }

  /* ---------- documento ---------- */
  function analisar(texto) {
    var doc = { paragrafos: [], palavras: [], frases: [] };
    partirParagrafos(texto).forEach(function (p) {
      var frases = partirFrases(p).map(function (f) {
        var toks = tokenizar(f);
        var ultima = '', penultima = '';
        for (var i = 0; i < toks.length; i++) {
          var t = toks[i];
          if (!t.isWord) { t.info = null; continue; }
          var prox = '';
          for (var j = i + 1; j < toks.length; j++) if (toks[j].isWord) { prox = toks[j].w; break; }
          t.info = analisarPalavra(t.raw, { prev: ultima, prev2: penultima, next: prox });
          penultima = ultima; ultima = t.w;
        }
        return { texto: f, tokens: toks };
      });
      doc.paragrafos.push({ frases: frases });
      frases.forEach(function (fr) {
        doc.frases.push(fr);
        fr.tokens.forEach(function (t) { if (t.isWord) doc.palavras.push(t.info); });
      });
    });
    return doc;
  }

  /* ---------- glosa ---------- */
  function glosaFrase(frase) {
    var out = [];
    var toks = frase.tokens;
    for (var k = 0; k < toks.length; k++) {
      var t = toks[k];
      if (!t.isWord) { out.push(t.raw); continue; }
      var i = t.info;
      var proxI = null;
      for (var m = k + 1; m < toks.length; m++) { if (toks[m].isWord) { proxI = toks[m].info; break; } }
      /* "a minha vida" -> "mi vida": el artículo sobra en la glosa */
      if (i && i.pos === 'art' && proxI && (proxI.pos === 'det')) continue;
      /* "na minha vida" -> "en mi vida": la contracción pierde el artículo */
      var fusa = PZ.ana.fusoes[t.w];
      if (fusa && proxI && proxI.pos === 'det') {
        var PREP_ES = { em: 'en', de: 'de', a: 'a', por: 'por', para: 'para' };
        out.push(PREP_ES[fusa[0]] || fusa[0]);
        continue;
      }
      out.push(i && i.gloss ? i.gloss : t.raw);
    }
    var s = out.join(' ').replace(/\s+([,.;:!?…)])/g, '$1').replace(/\s+/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function estatisticas(doc) {
    var porPos = {}, desconhecidas = 0, total = 0, vistos = {};
    doc.palavras.forEach(function (p) {
      total++;
      porPos[p.pos || '?'] = (porPos[p.pos || '?'] || 0) + 1;
      if (p.fonte === 'none') desconhecidas++;
      var k = p.lemma || p.w;
      (vistos[k] = vistos[k] || { lemma: p.lemma || p.w, es: p.es || '', n: 0, pos: p.pos }).n++;
    });
    var lista = Object.keys(vistos).map(function (k) { return vistos[k]; }).sort(function (a, b) { return b.n - a.n; });
    return { total: total, porPos: porPos, desconhecidas: desconhecidas, unicas: lista };
  }

  PZ.ana = {
    analisar: analisar,
    analisarPalavra: analisarPalavra,
    tokenizar: tokenizar,
    partirFrases: partirFrases,
    partirParagrafos: partirParagrafos,
    glosaFrase: glosaFrase,
    estatisticas: estatisticas,
    singularizar: singularizar,
    fusoes: FUSAO,
    explicaInfinitivo: explicarInfinitivo
  };
})();
