# Português do Zero ao Cem 🇵🇹🇧🇷

App para aprender portugués (de Brasil) desde cero y preparar el **oral de 2027**:
*Meus objetivos para 2027*.

Todo funciona en tu computadora, sin instalar nada y sin crear cuentas. Tu progreso se
guarda en el navegador.

---

## Cómo abrirla

**Opción 1 (recomendada): doble clic en `Iniciar app.command`.**
Se abre una ventanita negra (Terminal) y el navegador solo. No la cierres mientras la usás:
esa ventanita es la que hace funcionar la app y la IA. Para apagarla, `Ctrl + C` o cerrá la ventana.

**Opción 2: doble clic en `index.html`.**
Funciona igual, pero el navegador puede bloquear la conexión con la IA (la lectura, los
juegos y el repaso funcionan perfecto igual).

---

## Qué tiene

| Sección | Para qué sirve |
|---|---|
| **Inicio** | Tu plan del día, accesos rápidos y el resumen del oral. |
| **Leer / Diglot** | Pegás cualquier texto en portugués y te lo parte frase por frase, con la traducción y **la glosa de cada palabra**. Tocás una palabra y te dice significado, lema, género, plural y —si es un verbo— **cuál es el verbo original, en qué tiempo y persona está y por qué está así**. |
| **Mi oral** | Tu texto completo con audio, las **8 preguntas de la guía** con respuesta modelo, **24 preguntas probables más**, simulacro al azar, grabador para escucharte y consejos de pronunciación. |
| **Vocabulario** | Repaso espaciado (SRS): te muestra las tarjetas justo cuando te estás por olvidar. |
| **Juegos** | Emparejar, dictado, conjugación, género y plural, ordenar frases y traducción rápida. Todo con el vocabulario de *tu* texto. |
| **Chat IA** | Un profe de portugués al que le preguntás lo que quieras, con atajos para pedirle que te tome lección. |
| **Progreso** | Nivel, XP, racha de días, gráfico de 14 días, puntería por juego y logros. |
| **Ajustes** | Clave de IA, voz, velocidad y copia de seguridad de tu progreso. |

---

## Conectar la IA (una sola vez)

1. Entrá a **Ajustes**.
2. Elegí **Proveedor**.
3. Pegá tu **API key**.
4. **Guardar** → **Probar conexión**.

Funciona con DeepSeek, OpenAI, OpenRouter, Groq, Google Gemini o cualquier API
compatible con OpenAI. La clave queda **solo en tu navegador**; no se manda a ningún
lugar salvo al proveedor que elegiste.

> Si abrís la app con `Iniciar app.command` (opción 1), la IA funciona siempre.
> Si abrís `index.html` directo y ves un error de conexión, usá la opción 1.

**Sin clave** la app igual funciona: lectura, glosa, audio, juegos, repaso y un
diccionario offline de **1650 palabras** que responde preguntas del tipo
«¿cómo se dice gimnasio?».

---

## Cómo se usa para el oral (plan de 5 días)

1. **Día 1** — *Leer*: tocá palabra por palabra las 6 frases de tu oral. Escuchá cada
   frase. Marcá «＋ Tarjetas» al final para llevarte el vocabulario.
2. **Día 2** — *Mi oral*: escuchá el texto completo 3 veces. Leelo en voz alta copiando
   la entonación. Grabate y compará.
3. **Día 3** — *Mi oral*: abrí las 8 preguntas, escuchá la respuesta modelo y contestá
   en voz alta antes de mirarla. Marcá «✓ Ya la sé».
4. **Día 4** — *Juegos*: dictado y ordenar frases (son los que más se parecen a hablar).
   *Vocabulario*: repaso del día.
5. **Día 5** — *Mi oral → Simulacro*: preguntas al azar. Después *Chat IA*:
   «Hacéme 5 preguntas sobre mi oral, una por vez».

---

## Cambiar el texto del oral

* Para leer otro texto: pegalo en **Leer → Analizar texto** (o arrastrá un `.txt`).
* Para cambiar el guion y las preguntas de la pestaña **Mi oral**, se edita el archivo
  `js/oral-seed.js` (es una lista de frases con su traducción y las preguntas con su
  respuesta). No hace falta saber programar para tocar los textos: son líneas de este estilo:

```js
{ pt: 'Meus objetivos para 2027', es: 'Mis objetivos para 2027' }
```

---

## Archivos del proyecto

```
portugues/
├── Iniciar app.command     ← doble clic para abrir todo
├── index.html              ← la app
├── servidor.mjs            ← servidor local + puente de IA (Node, sin dependencias)
├── css/app.css             ← estilos
├── js/
│   ├── func-words.js       ← artículos, preposiciones, pronombres…
│   ├── lexicon-data.js     ← diccionario PT→ES (1650 palabras)
│   ├── lexicon-extra.js    ← refuerzo con el vocabulario exacto del oral
│   ├── conj.js             ← motor de conjugación + análisis inverso
│   ├── analyzer.js         ← diglot palabra por palabra
│   ├── oral-seed.js        ← tu guía: texto, preguntas, vocabulario
│   ├── store.js            ← progreso, XP, repaso espaciado
│   ├── ai.js               ← chat y traducción con IA
│   ├── ui.js               ← panel de palabra, audio, confeti
│   ├── games.js            ← los 6 juegos
│   └── app.js              ← pantallas
├── tests/
│   ├── tests.html          ← 84 tests de lógica  → abrir en el navegador
│   └── audit.html          ← 63 chequeos de interfaz → abrir en el navegador
├── data/entrada/           ← el PDF original de la guía
└── tools/                  ← scripts usados para generar el diccionario
```

---

## Si algo no anda

| Problema | Solución |
|---|---|
| No se escucha el audio | El navegador necesita una voz en portugués. En Mac: Ajustes del sistema → Accesibilidad → Contenido leído → Voces del sistema → agregar «Português (Brasil)». Después recargá la app y elegí la voz en **Ajustes**. |
| «El navegador bloqueó la conexión» | Abrí con `Iniciar app.command` en vez de `index.html`. |
| «La clave no es válida» | Copiala de nuevo sin espacios; revisá que sea del proveedor que elegiste. |
| Perdí el progreso | Restaurá el `.json` que exportaste en **Ajustes → Importar**. |
| No aparece una palabra en el diccionario | Tocá la palabra y usá **🤖 Preguntar**, o pedíselo al chat. |

---

*Hecho para el oral de portugués 2027. Boa sorte!* 🍀
