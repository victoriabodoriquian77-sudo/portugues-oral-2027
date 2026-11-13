/* ============================================================
   ai.js — chat con IA y traducción.
   Funciona de dos maneras:
   (a) directo desde el navegador con tu API key
   (b) a través del pequeño servidor local (recomendado, evita
       los bloqueos de CORS del navegador)
   ============================================================ */
(function () {
  'use strict';
  var PZ = (window.PZ = window.PZ || {});

  var PROVEEDORES = {
    deepseek: { nome: 'DeepSeek', base: 'https://api.deepseek.com', modelo: 'deepseek-chat', tipo: 'openai' },
    openai: { nome: 'OpenAI', base: 'https://api.openai.com/v1', modelo: 'gpt-4o-mini', tipo: 'openai' },
    openrouter: { nome: 'OpenRouter', base: 'https://openrouter.ai/api/v1', modelo: 'deepseek/deepseek-chat', tipo: 'openai' },
    groq: { nome: 'Groq', base: 'https://api.groq.com/openai/v1', modelo: 'llama-3.3-70b-versatile', tipo: 'openai' },
    gemini: { nome: 'Google Gemini', base: 'https://generativelanguage.googleapis.com/v1beta', modelo: 'gemini-2.0-flash', tipo: 'gemini' },
    custom: { nome: 'Otro (compatible OpenAI)', base: '', modelo: '', tipo: 'openai' }
  };

  var proxyOK = false;
  var proxyKey = false;

  function cfg() {
    var s = PZ.store.s;
    var p = PROVEEDORES[s.provider] || PROVEEDORES.deepseek;
    return {
      provider: s.provider,
      tipo: p.tipo,
      base: (s.baseUrl || p.base || '').replace(/\/+$/, ''),
      model: s.model || p.model,
      key: s.apiKey || ''
    };
  }

  function detectarProxy() {
    if (location.protocol === 'file:') return Promise.resolve(false);
    return fetch('api/ping', { method: 'GET' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        proxyOK = !!(j && j.proxy);
        proxyKey = !!(j && j.hasKey);
        return proxyOK;
      })
      .catch(function () { proxyOK = false; return false; });
  }

  function configurado() { return !!cfg().key || (proxyOK && proxyKey) || (proxyOK && !!cfg().key); }

  /* ---------- system prompt ---------- */
  function contextoOral() {
    var S = window.ORAL_SEED;
    if (!S) return '';
    var txt = S.script.map(function (l) { return l.pt; }).join(' ');
    return 'O texto do oral da aluna chama-se "' + S.title + '": ' + txt +
      ' Perguntas que a professora costuma fazer: ' + S.questions.map(function (q) { return q.q; }).join(' | ') + '.';
  }

  function systemPrompt() {
    return [
      'Você é um professor de português brasileiro (pt-BR) que dá aula particular para uma aluna argentina de 17 anos.',
      'Ela está aprendendo português do zero e precisa apresentar um oral no colégio sobre "Meus objetivos para 2027".',
      'Nível atual dela: ' + (PZ.store.s.aiLevel || 'A2') + '.',
      contextoOral(),
      '',
      'REGRAS DE RESPOSTA:',
      '1. Responda SEMPRE em espanhol rio-platense (a aluna é argentina), claro e curto. Nunca responda só em português.',
      '2. Todo exemplo em português vai em negrito com a tradução entre parênteses. Ex.: **Eu quero estudar** (quiero estudiar).',
      '3. Quando ela errar, mostre o erro, a correção e a regra em UMA linha.',
      '4. Se ela pedir vocabulário, dê listas de no máximo 10 itens no formato: português — español (pronúncia aproximada em espanhol).',
      '5. Se ela pedir para praticar, faça UMA pergunta por vez e espere a resposta dela.',
      '6. Seja encorajador, mas não encha de elogios vazios. Máximo 160 palavras, salvo se ela pedir mais.',
      '7. Quando for útil, lembre a diferença Brasil/Portugal, mas priorize o português do Brasil.',
      '8. Nunca invente que ela falou algo. Se a pergunta for ambígua, pergunte o que ela quer.'
    ].join('\n');
  }

  /* ---------- helpers HTTP ---------- */
  function mensagemErro(status, corpo) {
    if (status === 401 || status === 403) return 'La clave de API no es válida o no tiene permiso (error ' + status + '). Revisala en Ajustes.';
    if (status === 429) return 'El proveedor dice que hay demasiadas consultas seguidas (error 429). Esperá unos segundos.';
    if (status === 402) return 'La cuenta del proveedor no tiene saldo (error 402).';
    if (status >= 500) return 'El proveedor está fallando (error ' + status + '). Probá de nuevo en un rato.';
    var extra = '';
    try { extra = (JSON.parse(corpo).error && JSON.parse(corpo).error.message) || ''; } catch (e) { extra = (corpo || '').slice(0, 160); }
    return 'Error ' + status + ': ' + extra;
  }

  function sseParse(res, onDelta, alTerminar) {
    var reader = res.body.getReader();
    var dec = new TextDecoder();
    var buf = '';
    function paso() {
      return reader.read().then(function (r) {
        if (r.done) { alTerminar(); return; }
        buf += dec.decode(r.value, { stream: true });
        var lineas = buf.split('\n');
        buf = lineas.pop();
        lineas.forEach(function (l) {
          l = l.trim();
          if (!l || l.indexOf('data:') !== 0) return;
          var data = l.slice(5).trim();
          if (data === '[DONE]') return;
          try {
            var j = JSON.parse(data);
            var d = j.choices && j.choices[0] && j.choices[0].delta;
            var txt = d && (d.content || '');
            if (txt) onDelta(txt);
          } catch (e) { }
        });
        return paso();
      });
    }
    return paso();
  }

  /* ---------- chat ---------- */
  function chat(mensajes, opts) {
    opts = opts || {};
    var c = cfg();
    var sys = systemPrompt();
    var cuerpo = {
      model: c.model,
      messages: [{ role: 'system', content: sys }].concat(mensajes),
      temperature: 0.6,
      max_tokens: opts.maxTokens || 900,
      stream: !!opts.onDelta
    };

    var url, headers = { 'Content-Type': 'application/json' };
    var usarProxy = proxyOK;

    if (usarProxy) {
      url = 'api/chat';
      cuerpo.provider = c.provider;
      cuerpo.key = c.key || '';
      cuerpo.base = c.base;
    } else if (c.tipo === 'gemini') {
      url = c.base + '/models/' + c.model + ':streamGenerateContent?alt=sse&key=' + encodeURIComponent(c.key);
      cuerpo = {
        systemInstruction: { parts: [{ text: sys }] },
        contents: mensajes.map(function (m) {
          return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
        }),
        generationConfig: { temperature: 0.6, maxOutputTokens: opts.maxTokens || 900 }
      };
    } else {
      url = c.base + '/chat/completions';
      headers['Authorization'] = 'Bearer ' + c.key;
    }

    if (!c.key && !(proxyOK && proxyKey)) {
      return Promise.reject(new Error('Falta la clave de API. Andá a Ajustes y pegala (o abrí la app con "Iniciar app.command" para usar el modo puente).'));
    }

    return fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(cuerpo) })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) { throw new Error(mensagemErro(res.status, t)); });
        }
        if (cuerpo.stream && res.body && res.body.getReader) {
          var acc = '';
          var fin = function () { };
          return sseParse(res, function (d) { acc += d; if (opts.onDelta) opts.onDelta(d); }, fin).then(function () { return acc; });
        }
        return res.json().then(function (j) {
          if (c.tipo === 'gemini' || usarProxy && j.candidates) {
            var cand = j.candidates && j.candidates[0];
            return (cand && cand.content && cand.content.parts || []).map(function (p) { return p.text; }).join('');
          }
          var m = j.choices && j.choices[0] && j.choices[0].message;
          return (m && m.content) || '';
        });
      })
      .catch(function (e) {
        if (e instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(String(e.message))) {
          throw new Error('El navegador bloqueó la conexión con el proveedor (CORS). Solución: abrí la app con "Iniciar app.command" y volvé a probar.');
        }
        throw e;
      });
  }

  /* ---------- traducción por lotes ---------- */
  function traducir(frases) {
    if (!frases.length) return Promise.resolve([]);
    var c = cfg();
    var lista = frases.map(function (f, i) { return (i + 1) + '. ' + f; }).join('\n');
    var msgs = [{
      role: 'user',
      content: 'Traducí al español rioplatense estas frases en portugués. Devolvé SOLO un array JSON de strings, con el mismo orden y la misma cantidad (' + frases.length + '). Sin explicaciones, sin numeración.\n\n' + lista
    }];
    return chat(msgs, { maxTokens: Math.min(3000, 200 + frases.length * 60) }).then(function (txt) {
      var m = txt.match(/\[[\s\S]*\]/);
      if (!m) throw new Error('La IA no devolvió un JSON válido.');
      var arr = JSON.parse(m[0]);
      return arr.map(function (x) { return String(x); });
    });
  }

  /* ---------- traductor offline de emergencia ---------- */
  var REV_ES = null;
  function indiceEs() {
    if (REV_ES) return REV_ES;
    REV_ES = {};
    var W = (window.LEX_DATA && window.LEX_DATA.words) || {};
    Object.keys(W).forEach(function (pt) {
      var w = W[pt];
      if (!w || !w.es) return;
      String(w.es).split(' / ').forEach(function (alt) {
        alt = alt.replace(/\(.*?\)/g, '').trim().toLowerCase();
        if (alt && !REV_ES[alt]) REV_ES[alt] = pt;
      });
    });
    var F = window.FUNC_WORDS || {};
    Object.keys(F).forEach(function (g) {
      Object.keys(F[g]).forEach(function (pt) {
        var es = String(F[g][pt]).toLowerCase();
        if (!REV_ES[es]) REV_ES[es] = pt;
      });
    });
    return REV_ES;
  }

  function fichaOffline(pt) {
    var W = (window.LEX_DATA && window.LEX_DATA.words) || {};
    var hit = W[pt];
    if (!hit) return null;
    var out = '**' + pt + '** — ' + hit.es + (hit.pos ? ' _(' + hit.pos + ')_' : '');
    if (hit.g) out += '\nGénero: ' + (hit.g === 'f' ? 'femenino (a / uma)' : 'masculino (o / um)');
    if (hit.pl) out += '\nPlural: **' + hit.pl + '**';
    if (hit.ex && hit.ex[0]) out += '\nEjemplo: **' + hit.ex[0] + '**\n(' + hit.ex[1] + ')';
    return out;
  }

  function explicarSinIA(pregunta) {
    var q = String(pregunta).toLowerCase().replace(/[¿?¡!]/g, '');
    var m = q.match(/(?:c[oó]mo se dice|c[oó]mo se diz|c[oó]mo diz|c[oó]mo falo|c[oó]mo digo|c[oó]mo se pronuncia|qu[eé] significa|significa|tradu[cz]|traduci|traduzir)\s+(?:el |la |los |las |o |a )?["'“]?([a-záéíóúâêôãõçàüñ\s-]{2,40})["'”]?/);
    if (!m) {
      var semA = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (semA !== q) {
        var m2 = semA.match(/(?:como se dice|como se diz|como diz|como falo|como digo|que significa|significa|traduz|traduci)\s+(?:el |la |los |las |o |a )?["'“]?([a-z\s-]{2,40})["'”]?/);
        if (m2) m = m2;
      }
    }
    if (m) {
      var buscada = m[1].trim().replace(/\s+(em|en) (portugues|espanhol|espanol)$/, '').trim();
      var direto = fichaOffline(buscada) || fichaOffline(PZ.ana.singularizar(buscada)[0]);
      if (direto) return direto + '\n\n_(Respuesta del diccionario offline: ' + Object.keys((window.LEX_DATA || {}).words || {}).length + ' palabras. Para el chat completo, cargá tu clave de IA en Ajustes.)_';
      var rev = indiceEs()[buscada];
      if (rev) {
        return 'En portugués: **' + rev + '**' + (fichaOffline(rev) ? '\n' + fichaOffline(rev).split('— ')[1] : '') +
          '\n\n_(Diccionario offline. Para preguntarme lo que quieras, cargá tu clave de IA en Ajustes.)_';
      }
      return 'No encontré **' + buscada + '** en el diccionario offline.\n\n' +
        'Para preguntarme cualquier cosa, cargá una clave de IA en **Ajustes** (o abrí la app con "Iniciar app.command").';
    }
    return 'Todavía no tengo IA conectada, así que solo puedo usar el diccionario offline.\n\n' +
      'Para chatear de verdad:\n1. Entrá a **Ajustes**\n2. Elegí el proveedor y pegá tu API key\n\n' +
      'Mientras tanto probá con: _"¿cómo se dice gimnasio?"_ o _"¿qué significa aprendizado?"_';
  }

  PZ.ai = {
    proveedores: PROVEEDORES,
    detectarProxy: detectarProxy,
    configurado: configurado,
    chat: chat,
    traducir: traducir,
    systemPrompt: systemPrompt,
    explicarSinIA: explicarSinIA,
    get proxy() { return proxyOK; }
  };
})();
