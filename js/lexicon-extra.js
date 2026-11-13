/* ============================================================
   lexicon-extra.js — refuerzo del diccionario con el vocabulario
   exacto de la guía del oral y verbos que el motor necesita.
   Solo agrega lo que falta (no pisa lo que ya está).
   ============================================================ */
(function () {
  'use strict';
  if (!window.LEX_DATA) window.LEX_DATA = { meta: {}, words: {}, expressions: [] };
  var W = window.LEX_DATA.words;
  var EXTRA = {
    /* --- del texto del oral --- */
    'objetivo': { es: 'objetivo', pos: 'sust', g: 'm', pl: 'objetivos', ex: ['Meu objetivo é passar em todas as matérias.', 'Mi objetivo es aprobar todas las materias.'] },
    'principal': { es: 'principal', pos: 'adj', pl: 'principais', f: 'principal' },
    'pessoal': { es: 'personal', pos: 'adj', pl: 'pessoais', f: 'pessoal', ex: ['Na minha vida pessoal, quero viajar.', 'En mi vida personal, quiero viajar.'] },
    'físico': { es: 'físico', pos: 'adj', pl: 'físicos', f: 'física' },
    'importado': { es: 'importado', pos: 'adj', pl: 'importados', f: 'importada' },
    'produtivo': { es: 'productivo', pos: 'adj', pl: 'produtivos', f: 'produtiva' },
    'experiência': { es: 'experiencia', pos: 'sust', g: 'f', pl: 'experiências' },
    'aprendizado': { es: 'aprendizaje', pos: 'sust', g: 'm', pl: 'aprendizados', ex: ['Cada dia é um aprendizado novo.', 'Cada día es un aprendizaje nuevo.'] },
    'independência': { es: 'independencia', pos: 'sust', g: 'f', pl: 'independências' },
    'coisa': { es: 'cosa', pos: 'sust', g: 'f', pl: 'coisas' },
    'plano': { es: 'plan', pos: 'sust', g: 'm', pl: 'planos' },
    'pessoa': { es: 'persona', pos: 'sust', g: 'f', pl: 'pessoas' },
    'futuro': { es: 'futuro', pos: 'sust', g: 'm', pl: 'futuros' },
    'passado': { es: 'pasado', pos: 'sust', g: 'm' },
    'vida': { es: 'vida', pos: 'sust', g: 'f', pl: 'vidas' },
    'aula': { es: 'clase', pos: 'sust', g: 'f', pl: 'aulas' },
    'matéria': { es: 'materia (asignatura)', pos: 'sust', g: 'f', pl: 'matérias' },
    'nota': { es: 'nota', pos: 'sust', g: 'f', pl: 'notas' },

    /* --- verbos --- */
    'inscrever': { es: 'inscribir', pos: 'verbo', conj: 'er', ex: ['Quero me inscrever na faculdade.', 'Quiero inscribirme en la facultad.'] },
    'realizar': { es: 'realizar / cumplir', pos: 'verbo', conj: 'ar' },
    'frequentar': { es: 'frecuentar', pos: 'verbo', conj: 'ar', ex: ['Continuo frequentando a academia.', 'Sigo yendo al gimnasio.'] },
    'alcançar': { es: 'alcanzar / lograr', pos: 'verbo', conj: 'ar' },
    'apetecer': { es: 'dar ganas', pos: 'verbo', conj: 'er' },
    'lembrar': { es: 'recordar', pos: 'verbo', conj: 'ar' },
    'esquecer': { es: 'olvidar', pos: 'verbo', conj: 'er' },
    'acordar': { es: 'despertarse', pos: 'verbo', conj: 'ar' },
    'deitar': { es: 'acostarse', pos: 'verbo', conj: 'ar' },
    'levantar': { es: 'levantar(se)', pos: 'verbo', conj: 'ar' },
    'sentir': { es: 'sentir', pos: 'verbo', conj: 'ir' },
    'ficar': { es: 'quedarse / estar', pos: 'verbo', conj: 'ar', ex: ['Fico feliz com isso.', 'Me alegro por eso.'] },
    'vontade': { es: 'ganas', pos: 'sust', g: 'f', pl: 'vontades', ex: ['Estou com vontade de viajar.', 'Tengo ganas de viajar.'] },
    'saudade': { es: 'nostalgia / extrañar', pos: 'sust', g: 'f', pl: 'saudades', ex: ['Estou com saudade da minha família.', 'Extraño a mi familia.'] },

    /* --- colegio / vida --- */
    'faculdade': { es: 'facultad', pos: 'sust', g: 'f', pl: 'faculdades' },
    'academia': { es: 'gimnasio', pos: 'sust', g: 'f', pl: 'academias' },
    'negócio': { es: 'negocio', pos: 'sust', g: 'm', pl: 'negócios' },
    'produto': { es: 'producto', pos: 'sust', g: 'm', pl: 'produtos' },
    'carro': { es: 'auto / coche', pos: 'sust', g: 'm', pl: 'carros' },
    'carteira': { es: 'billetera / registro (de conducir)', pos: 'sust', g: 'f', pl: 'carteiras' },
    'médico': { es: 'médico', pos: 'sust', g: 'm', pl: 'médicos', f: 'médica' },
    'medicina': { es: 'medicina', pos: 'sust', g: 'f' },
    'familia': { es: 'familia', pos: 'sust', g: 'f' },
    'família': { es: 'familia', pos: 'sust', g: 'f', pl: 'famílias' },
    'sonho': { es: 'sueño', pos: 'sust', g: 'm', pl: 'sonhos' },
    'medo': { es: 'miedo', pos: 'sust', g: 'm', pl: 'medos' },
    'desafio': { es: 'desafío', pos: 'sust', g: 'm', pl: 'desafios' },
    'feliz': { es: 'feliz', pos: 'adj', pl: 'felizes', f: 'feliz' },
    'fácil': { es: 'fácil', pos: 'adj', pl: 'fáceis', f: 'fácil' },
    'difícil': { es: 'difícil', pos: 'adj', pl: 'difíceis', f: 'difícil' },
    'ano': { es: 'año', pos: 'sust', g: 'm', pl: 'anos' },
    'dia': { es: 'día', pos: 'sust', g: 'm', pl: 'dias' },
    'filme': { es: 'película', pos: 'sust', g: 'm', pl: 'filmes' },
    'série': { es: 'serie', pos: 'sust', g: 'f', pl: 'séries' },
    'festa': { es: 'fiesta', pos: 'sust', g: 'f', pl: 'festas' },
    'novo': { es: 'nuevo', pos: 'adj', pl: 'novos', f: 'nova' },
    'velho': { es: 'viejo', pos: 'adj', pl: 'velhos', f: 'velha' },
    'mesmo': { es: 'mismo', pos: 'adj', pl: 'mesmos', f: 'mesma' },
    'próprio': { es: 'propio', pos: 'adj', pl: 'próprios', f: 'própria' },
    'todo': { es: 'todo', pos: 'det', pl: 'todos', f: 'toda' }
  };
  var n = 0;
  Object.keys(EXTRA).forEach(function (k) {
    if (!W[k]) { W[k] = EXTRA[k]; n++; }
    else {
      /* completar campos que falten sin pisar lo existente */
      Object.keys(EXTRA[k]).forEach(function (f) { if (W[k][f] === undefined) W[k][f] = EXTRA[k][f]; });
    }
  });
  if (!window.LEX_DATA.expressions) window.LEX_DATA.expressions = [];
  var expExtra = [
    { pt: 'além disso', es: 'además de eso' },
    { pt: 'apesar de', es: 'a pesar de' },
    { pt: 'no próximo ano', es: 'el año que viene' },
    { pt: 'de agora em diante', es: 'de ahora en adelante' },
    { pt: 'com certeza', es: 'sin duda' },
    { pt: 'na minha opinião', es: 'en mi opinión' },
    { pt: 'acho que', es: 'me parece que' },
    { pt: 'espero que', es: 'espero que (+ subjuntivo)' },
    { pt: 'quero que', es: 'quiero que (+ subjuntivo)' },
    { pt: 'ter de / ter que', es: 'tener que' },
    { pt: 'estar com vontade de', es: 'tener ganas de' },
    { pt: 'valer a pena', es: 'valer la pena' }
  ];
  var ptSet = {};
  window.LEX_DATA.expressions.forEach(function (e) { ptSet[e.pt] = 1; });
  expExtra.forEach(function (e) { if (!ptSet[e.pt]) window.LEX_DATA.expressions.push(e); });
  window.LEX_DATA.meta = window.LEX_DATA.meta || {};
  window.LEX_DATA.meta.extra = n;
})();
