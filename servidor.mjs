#!/usr/bin/env node
/* ============================================================
   servidor.mjs — sirve la app y hace de puente con la IA.
   Sin dependencias: solo Node.
   Uso:  node servidor.mjs        (o doble clic en Iniciar app.command)
   ============================================================ */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { exec } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 7799);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2'
};

const PROVEEDORES = {
  deepseek: { base: 'https://api.deepseek.com', modelo: 'deepseek-chat', env: 'DEEPSEEK_API_KEY' },
  openai: { base: 'https://api.openai.com/v1', modelo: 'gpt-4o-mini', env: 'OPENAI_API_KEY' },
  openrouter: { base: 'https://openrouter.ai/api/v1', modelo: 'deepseek/deepseek-chat', env: 'OPENROUTER_API_KEY' },
  groq: { base: 'https://api.groq.com/openai/v1', modelo: 'llama-3.3-70b-versatile', env: 'GROQ_API_KEY' },
  gemini: { base: 'https://generativelanguage.googleapis.com/v1beta', modelo: 'gemini-2.0-flash', env: 'GEMINI_API_KEY', tipo: 'gemini' }
};

function claveDelEntorno() {
  for (const k of Object.keys(PROVEEDORES)) {
    const v = process.env[PROVEEDORES[k].env];
    if (v && v.trim()) return { provider: k, key: v.trim() };
  }
  return null;
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function leerCuerpo(req, limite = 3 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', (c) => {
      total += c.length;
      if (total > limite) { reject(new Error('cuerpo demasiado grande')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ---------- proxy de chat ---------- */
async function proxyChat(req, res) {
  let payload;
  try { payload = JSON.parse(await leerCuerpo(req)); }
  catch { return json(res, 400, { error: { message: 'JSON inválido' } }); }

  const prov = PROVEEDORES[payload.provider] || PROVEEDORES.deepseek;
  const envKey = process.env[prov.env];
  const key = (payload.key && String(payload.key).trim()) || (envKey ? envKey.trim() : '') || '';
  if (!key) return json(res, 401, { error: { message: 'Falta la API key: cargala en Ajustes o en la variable ' + prov.env } });

  const base = (payload.base || prov.base).replace(/\/+$/, '');
  const modelo = payload.model || prov.model;
  const mensajes = payload.messages || [];

  try {
    if (prov.tipo === 'gemini') {
      const sys = mensajes.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
      const contents = mensajes.filter((m) => m.role !== 'system').map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const cuerpo = {
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: payload.max_tokens || 900 }
      };
      if (sys) cuerpo.systemInstruction = { parts: [{ text: sys }] };
      const r = await fetch(`${base}/models/${modelo}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo)
      });
      if (!r.ok) { const t = await r.text(); return json(res, r.status, { error: { message: t.slice(0, 400) } }); }
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      const dec = new TextDecoder();
      let buf = '';
      for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        const lineas = buf.split('\n');
        buf = lineas.pop();
        for (const l of lineas) {
          const t = l.trim();
          if (!t.startsWith('data:')) continue;
          const data = t.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const j = JSON.parse(data);
            const txt = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text).join('');
            if (txt) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: txt } }] })}\n\n`);
          } catch { }
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const cuerpo = {
      model: modelo,
      messages: mensajes,
      temperature: payload.temperature ?? 0.6,
      max_tokens: payload.max_tokens || 900,
      stream: !!payload.stream
    };
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key };
    if (payload.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'http://localhost:' + PORT;
      headers['X-Title'] = 'Portugues Zero ao Cem';
    }
    const r = await fetch(`${base}/chat/completions`, { method: 'POST', headers, body: JSON.stringify(cuerpo) });
    if (!r.ok) {
      const t = await r.text();
      let msg = t.slice(0, 500);
      try { msg = JSON.parse(t).error?.message || msg; } catch { }
      return json(res, r.status, { error: { message: msg } });
    }
    if (cuerpo.stream && r.body) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      Readable.fromWeb(r.body).pipe(res);
    } else {
      const t = await r.text();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(t);
    }
  } catch (e) {
    json(res, 502, { error: { message: 'No pude conectar con el proveedor: ' + e.message } });
  }
}

/* ---------- estáticos ---------- */
function servirArchivo(req, res) {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  const destino = path.normalize(path.join(__dirname, rel));
  if (!destino.startsWith(__dirname)) return json(res, 403, { error: 'prohibido' });
  fs.stat(destino, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado: ' + rel);
    }
    const ext = path.extname(destino).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Content-Length': st.size
    });
    fs.createReadStream(destino).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/ping') {
    const env = claveDelEntorno();
    return json(res, 200, { proxy: true, hasKey: !!env, provider: env ? env.provider : null });
  }
  if (url === '/api/chat' && req.method === 'POST') return proxyChat(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'método no permitido' });
  servirArchivo(req, res);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  El puerto ${PORT} está ocupado. Cerrá la otra ventana o probá:\n  PORT=7801 node servidor.mjs\n`);
  } else {
    console.error(e);
  }
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  const env = claveDelEntorno();
  const url = `http://127.0.0.1:${PORT}/`;
  console.log('');
  console.log('  ┌───────────────────────────────────────────────┐');
  console.log('  │   Português do Zero ao Cem  ·  oral 2027      │');
  console.log('  └───────────────────────────────────────────────┘');
  console.log('');
  console.log('  Abrí la app en:  ' + url);
  console.log('  IA: ' + (env ? 'clave encontrada en el entorno (' + env.provider + ') ✓' : 'sin clave en el entorno — cargala en Ajustes'));
  console.log('');
  console.log('  Para cerrar: Ctrl + C  (o cerrá esta ventana)');
  console.log('');
  if (process.platform === 'darwin' && !process.env.PZ_NO_OPEN) {
    exec(`open "${url}"`);
  }
});
