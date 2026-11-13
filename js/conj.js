/* ============================================================
   conj.js — Motor de conjugación de portugués (pt-BR / pt-PT)
   - Genera todas las formas de cualquier verbo.
   - Hace el camino inverso: forma conjugada -> infinitivo + tiempo + persona.
   - Devuelve una explicación en español de POR QUÉ está así.
   ============================================================ */
(function () {
  'use strict';
  var PZ = (window.PZ = window.PZ || {});

  var PERSOAS = ['eu', 'tu', 'ele/ela/você', 'nós', 'vós', 'eles/elas/vocês'];
  var PERSOAS_CURTO = ['eu', 'tu', 'ele/ela', 'nós', 'vós', 'eles/elas'];

  /* ---------- terminaciones regulares ---------- */
  var REG = {
    ar: {
      pres: ['o', 'as', 'a', 'amos', 'ais', 'am'],
      perf: ['ei', 'aste', 'ou', 'amos', 'astes', 'aram'],
      imp: ['ava', 'avas', 'ávamos', 'áveis', 'avam'],
      subj: ['e', 'es', 'e', 'emos', 'eis', 'em']
    },
    er: {
      pres: ['o', 'es', 'e', 'emos', 'eis', 'em'],
      perf: ['i', 'este', 'eu', 'emos', 'estes', 'eram'],
      imp: ['ia', 'ias', 'íamos', 'íeis', 'iam'],
      subj: ['a', 'as', 'a', 'amos', 'ais', 'am']
    },
    ir: {
      pres: ['o', 'es', 'e', 'imos', 'is', 'em'],
      perf: ['i', 'iste', 'iu', 'imos', 'istes', 'iram'],
      imp: ['ia', 'ias', 'íamos', 'íeis', 'iam'],
      subj: ['a', 'as', 'a', 'amos', 'ais', 'am']
    }
  };
  var FUT = ['ei', 'ás', 'á', 'emos', 'eis', 'ão'];
  var COND = ['ia', 'ias', 'íamos', 'íeis', 'iam'];
  var SUBJIMP = ['sse', 'sses', 'sse', 'ssemos', 'sseis', 'ssem'];
  var SUBJFUT = ['r', 'res', 'r', 'rmos', 'rdes', 'rem'];
  var INFPES = ['', 'es', '', 'mos', 'des', 'em'];

  /* ---------- irregulares ---------- */
  /* pres/perf/subj/imp completos; part y ger cuando cambian */
  var IRR = {
    ser: { pres: ['sou', 'és', 'é', 'somos', 'sois', 'são'], perf: ['fui', 'foste', 'foi', 'fomos', 'fostes', 'foram'],
      imp: ['era', 'eras', 'éramos', 'éreis', 'eram'], subj: ['seja', 'sejas', 'seja', 'sejamos', 'sejais', 'sejam'],
      part: 'sido', ger: 'sendo', imper: ['sê', 'seja', 'sejamos', 'sede', 'sejam'] },
    estar: { pres: ['estou', 'estás', 'está', 'estamos', 'estais', 'estão'],
      perf: ['estive', 'estiveste', 'esteve', 'estivemos', 'estivestes', 'estiveram'],
      imp: ['estava', 'estavas', 'estávamos', 'estáveis', 'estavam'],
      subj: ['esteja', 'estejas', 'esteja', 'estejamos', 'estejais', 'estejam'],
      part: 'estado', ger: 'estando', imper: ['está', 'esteja', 'estejamos', 'estai', 'estejam'] },
    ter: { pres: ['tenho', 'tens', 'tem', 'temos', 'tendes', 'têm'],
      perf: ['tive', 'tiveste', 'teve', 'tivemos', 'tivestes', 'tiveram'],
      imp: ['tinha', 'tinhas', 'tínhamos', 'tínheis', 'tinham'],
      subj: ['tenha', 'tenhas', 'tenha', 'tenhamos', 'tenhais', 'tenham'],
      part: 'tido', ger: 'tendo', imper: ['tem', 'tenha', 'tenhamos', 'tende', 'tenham'] },
    haver: { pres: ['hei', 'hás', 'há', 'havemos', 'haveis', 'hão'],
      perf: ['houve', 'houveste', 'houve', 'houvemos', 'houvestes', 'houveram'],
      imp: ['havia', 'havias', 'havíamos', 'havíeis', 'haviam'],
      subj: ['haja', 'hajas', 'haja', 'hajamos', 'hajais', 'hajam'], part: 'havido', ger: 'havendo' },
    ir: { pres: ['vou', 'vais', 'vai', 'vamos', 'ides', 'vão'],
      perf: ['fui', 'foste', 'foi', 'fomos', 'fostes', 'foram'],
      imp: ['ia', 'ias', 'íamos', 'íeis', 'iam'],
      subj: ['vá', 'vás', 'vá', 'vamos', 'vades', 'vão'], part: 'ido', ger: 'indo',
      imper: ['vai', 'vá', 'vamos', 'ide', 'vão'] },
    vir: { pres: ['venho', 'vens', 'vem', 'vimos', 'vindes', 'vêm'],
      perf: ['vim', 'vieste', 'veio', 'viemos', 'viestes', 'vieram'],
      imp: ['vinha', 'vinhas', 'vínhamos', 'vínheis', 'vinham'],
      subj: ['venha', 'venhas', 'venha', 'venhamos', 'venhais', 'venham'],
      part: 'vindo', ger: 'vindo', imper: ['vem', 'venha', 'venhamos', 'vinde', 'venham'] },
    ver: { pres: ['vejo', 'vês', 'vê', 'vemos', 'vedes', 'veem'],
      perf: ['vi', 'viste', 'viu', 'vimos', 'vistes', 'viram'],
      imp: ['via', 'vias', 'víamos', 'víeis', 'viam'],
      subj: ['veja', 'vejas', 'veja', 'vejamos', 'vejais', 'vejam'],
      part: 'visto', ger: 'vendo', imper: ['vê', 'veja', 'vejamos', 'vede', 'vejam'] },
    dar: { pres: ['dou', 'dás', 'dá', 'damos', 'dais', 'dão'],
      perf: ['dei', 'deste', 'deu', 'demos', 'destes', 'deram'],
      imp: ['dava', 'davas', 'dávamos', 'dáveis', 'davam'],
      subj: ['dê', 'dês', 'dê', 'demos', 'deis', 'deem'],
      part: 'dado', ger: 'dando', imper: ['dá', 'dê', 'demos', 'dai', 'deem'] },
    saber: { pres: ['sei', 'sabes', 'sabe', 'sabemos', 'sabeis', 'sabem'],
      perf: ['soube', 'soubeste', 'soube', 'soubemos', 'soubestes', 'souberam'],
      imp: ['sabia', 'sabias', 'sabíamos', 'sabíeis', 'sabiam'],
      subj: ['saiba', 'saibas', 'saiba', 'saibamos', 'saibais', 'saibam'], part: 'sabido', ger: 'sabendo' },
    poder: { pres: ['posso', 'podes', 'pode', 'podemos', 'podeis', 'podem'],
      perf: ['pude', 'pudeste', 'pôde', 'pudemos', 'pudestes', 'puderam'],
      imp: ['podia', 'podias', 'podíamos', 'podíeis', 'podiam'],
      subj: ['possa', 'possas', 'possa', 'possamos', 'possais', 'possam'], part: 'podido', ger: 'podendo' },
    querer: { pres: ['quero', 'queres', 'quer', 'queremos', 'quereis', 'querem'],
      perf: ['quis', 'quiseste', 'quis', 'quisemos', 'quisestes', 'quiseram'],
      imp: ['queria', 'querias', 'queríamos', 'queríeis', 'queriam'],
      subj: ['queira', 'queiras', 'queira', 'queiramos', 'queirais', 'queiram'], part: 'querido', ger: 'querendo' },
    fazer: { pres: ['faço', 'fazes', 'faz', 'fazemos', 'fazeis', 'fazem'],
      perf: ['fiz', 'fizeste', 'fez', 'fizemos', 'fizestes', 'fizeram'],
      imp: ['fazia', 'fazias', 'fazíamos', 'fazíeis', 'faziam'],
      subj: ['faça', 'faças', 'faça', 'façamos', 'façais', 'façam'],
      part: 'feito', ger: 'fazendo', futStem: 'far', imper: ['faz', 'faça', 'façamos', 'fazei', 'façam'] },
    dizer: { pres: ['digo', 'dizes', 'diz', 'dizemos', 'dizeis', 'dizem'],
      perf: ['disse', 'disseste', 'disse', 'dissemos', 'dissestes', 'disseram'],
      imp: ['dizia', 'dizias', 'dizíamos', 'dizíeis', 'diziam'],
      subj: ['diga', 'digas', 'diga', 'digamos', 'digais', 'digam'],
      part: 'dito', ger: 'dizendo', futStem: 'dir', imper: ['diz', 'diga', 'digamos', 'dizei', 'digam'] },
    trazer: { pres: ['trago', 'trazes', 'traz', 'trazemos', 'trazeis', 'trazem'],
      perf: ['trouxe', 'trouxeste', 'trouxe', 'trouxemos', 'trouxestes', 'trouxeram'],
      imp: ['trazia', 'trazias', 'trazíamos', 'trazíeis', 'traziam'],
      subj: ['traga', 'tragas', 'traga', 'tragamos', 'tragais', 'tragam'],
      part: 'trazido', ger: 'trazendo', futStem: 'trar', imper: ['traz', 'traga', 'tragamos', 'trazei', 'tragam'] },
    'pôr': { pres: ['ponho', 'pões', 'põe', 'pomos', 'pondes', 'põem'],
      perf: ['pus', 'puseste', 'pôs', 'pusemos', 'pusestes', 'puseram'],
      imp: ['punha', 'punhas', 'púnhamos', 'púnheis', 'punham'],
      subj: ['ponha', 'ponhas', 'ponha', 'ponhamos', 'ponhais', 'ponham'],
      part: 'posto', ger: 'pondo', futStem: 'por', imper: ['põe', 'ponha', 'ponhamos', 'ponde', 'ponham'] },
    ler: { pres: ['leio', 'lês', 'lê', 'lemos', 'ledes', 'leem'],
      perf: ['li', 'leste', 'leu', 'lemos', 'lestes', 'leram'],
      imp: ['lia', 'lias', 'líamos', 'líeis', 'liam'],
      subj: ['leia', 'leias', 'leia', 'leiamos', 'leiais', 'leiam'], part: 'lido', ger: 'lendo' },
    ouvir: { pres: ['ouço', 'ouves', 'ouve', 'ouvimos', 'ouvis', 'ouvem'],
      perf: ['ouvi', 'ouviste', 'ouviu', 'ouvimos', 'ouvistes', 'ouviram'],
      imp: ['ouvia', 'ouvias', 'ouvíamos', 'ouvíeis', 'ouviam'],
      subj: ['ouça', 'ouças', 'ouça', 'ouçamos', 'ouçais', 'ouçam'], part: 'ouvido', ger: 'ouvindo' },
    perder: { pres: ['perco', 'perdes', 'perde', 'perdemos', 'perdeis', 'perdem'],
      subj: ['perca', 'percas', 'perca', 'percamos', 'percais', 'percam'], part: 'perdido', ger: 'perdendo' },
    pedir: { pres: ['peço', 'pedes', 'pede', 'pedimos', 'pedis', 'pedem'],
      subj: ['peça', 'peças', 'peça', 'peçamos', 'peçais', 'peçam'], part: 'pedido', ger: 'pedindo' },
    dormir: { pres: ['durmo', 'dormes', 'dorme', 'dormimos', 'dormis', 'dormem'],
      subj: ['durma', 'durmas', 'durma', 'durmamos', 'durmais', 'durmam'], part: 'dormido', ger: 'dormindo' },
    sentir: { pres: ['sinto', 'sentes', 'sente', 'sentimos', 'sentis', 'sentem'],
      subj: ['sinta', 'sintas', 'sinta', 'sintamos', 'sintais', 'sintam'], part: 'sentido', ger: 'sentindo' },
    servir: { pres: ['sirvo', 'serves', 'serve', 'servimos', 'servis', 'servem'],
      subj: ['sirva', 'sirvas', 'sirva', 'sirvamos', 'sirvais', 'sirvam'], part: 'servido', ger: 'servindo' },
    descer: { pres: ['desço', 'desces', 'desce', 'descemos', 'desceis', 'descem'],
      subj: ['desça', 'desças', 'desça', 'desçamos', 'desçais', 'desçam'], part: 'descido', ger: 'descendo' },
    seguir: { pres: ['sigo', 'segues', 'segue', 'seguimos', 'seguis', 'seguem'],
      subj: ['siga', 'sigas', 'siga', 'sigamos', 'sigais', 'sigam'], part: 'seguido', ger: 'seguindo' },
    conseguir: { pres: ['consigo', 'consegues', 'consegue', 'conseguimos', 'consegueis', 'conseguem'],
      subj: ['consiga', 'consigas', 'consiga', 'consigamos', 'consigais', 'consigam'], part: 'conseguido', ger: 'conseguindo' },
    preferir: { pres: ['prefiro', 'preferes', 'prefere', 'preferimos', 'preferis', 'preferem'],
      subj: ['prefira', 'prefiras', 'prefira', 'prefiramos', 'prefirais', 'prefiram'], part: 'preferido', ger: 'preferindo' },
    repetir: { pres: ['repito', 'repetes', 'repete', 'repetimos', 'repetis', 'repetem'],
      subj: ['repita', 'repitas', 'repita', 'repitamos', 'repitais', 'repitam'], part: 'repetido', ger: 'repetindo' },
    vestir: { pres: ['visto', 'vestes', 'veste', 'vestimos', 'vestis', 'vestem'],
      subj: ['vista', 'vistas', 'vista', 'vistamos', 'vistais', 'vistam'], part: 'vestido', ger: 'vestindo' },
    cair: { pres: ['caio', 'cais', 'cai', 'caímos', 'caís', 'caem'],
      subj: ['caia', 'caias', 'caia', 'caiamos', 'caiais', 'caiam'], part: 'caído', ger: 'caindo' },
    sair: { pres: ['saio', 'sais', 'sai', 'saímos', 'saís', 'saem'],
      subj: ['saia', 'saias', 'saia', 'saiamos', 'saiais', 'saiam'], part: 'saído', ger: 'saindo' },
    valer: { pres: ['valho', 'vales', 'vale', 'valemos', 'valeis', 'valem'],
      subj: ['valha', 'valhas', 'valha', 'valhamos', 'valhais', 'valham'], part: 'valido', ger: 'valendo' },
    caber: { pres: ['caibo', 'cabes', 'cabe', 'cabemos', 'cabeis', 'cabem'],
      perf: ['coube', 'coubeste', 'coube', 'coubemos', 'coubestes', 'couberam'],
      subj: ['caiba', 'caibas', 'caiba', 'caibamos', 'caibais', 'caibam'], part: 'cabido', ger: 'cabendo' },
    medir: { pres: ['meço', 'medes', 'mede', 'medimos', 'medis', 'medem'],
      subj: ['meça', 'meças', 'meça', 'meçamos', 'meçais', 'meçam'], part: 'medido', ger: 'medindo' },
    construir: { pres: ['construo', 'constróis', 'constrói', 'construímos', 'construís', 'constroem'],
      subj: ['construa', 'construas', 'construa', 'construamos', 'construais', 'construam'], part: 'construído', ger: 'construindo' },
    fugir: { pres: ['fujo', 'foges', 'foge', 'fugimos', 'fugis', 'fogem'],
      subj: ['fuja', 'fujas', 'fuja', 'fujamos', 'fujais', 'fujam'], part: 'fugido', ger: 'fugindo' },
    rir: { pres: ['rio', 'ris', 'ri', 'rimos', 'rides', 'riem'],
      subj: ['ria', 'rias', 'ria', 'riamos', 'riais', 'riam'], part: 'rido', ger: 'rindo' },
    sorrir: { pres: ['sorrio', 'sorris', 'sorri', 'sorrimos', 'sorrides', 'sorriem'],
      subj: ['sorria', 'sorrias', 'sorria', 'sorriamos', 'sorriais', 'sorriam'], part: 'sorrido', ger: 'sorrindo' },
    escrever: { pres: ['escrevo', 'escreves', 'escreve', 'escrevemos', 'escreveis', 'escrevem'],
      subj: ['escreva', 'escrevas', 'escreva', 'escrevamos', 'escrevais', 'escrevam'], part: 'escrito', ger: 'escrevendo' },
    esquecer: { pres: ['esqueço', 'esqueces', 'esquece', 'esquecemos', 'esqueceis', 'esquecem'],
      subj: ['esqueça', 'esqueças', 'esqueça', 'esqueçamos', 'esqueçais', 'esqueçam'], part: 'esquecido', ger: 'esquecendo' },
    apetecer: { pres: ['apeteço', 'apeteces', 'apetece', 'apetecemos', 'apeteceis', 'apetecem'],
      subj: ['apeteça', 'apeteças', 'apeteça', 'apeteçamos', 'apeteçais', 'apeteçam'], part: 'apetecido', ger: 'apetecendo' },
    abrir: { pres: ['abro', 'abres', 'abre', 'abrimos', 'abris', 'abrem'], part: 'aberto', ger: 'abrindo' },
    cobrir: { pres: ['cubro', 'cobres', 'cobre', 'cobrimos', 'cobris', 'cobrem'], part: 'coberto', ger: 'cobrindo' },
    subir: { pres: ['subo', 'sobes', 'sobe', 'subimos', 'subis', 'sobem'], part: 'subido', ger: 'subindo' }
  };

  var PART_IRR = {
    abrir: 'aberto', cobrir: 'coberto', dizer: 'dito', escrever: 'escrito', fazer: 'feito',
    'pôr': 'posto', ver: 'visto', vir: 'vindo', ganhar: 'ganho', gastar: 'gasto',
    pagar: 'pago', entregar: 'entregue', imprimir: 'impresso', resolver: 'resolvido',
    abrir_: '', aceitar: 'aceito', limpar: 'limpo', soltar: 'solto', salvar: 'salvo'
  };

  var GER_IRR = {
    'pôr': 'pondo', ter: 'tendo', vir: 'vindo', ver: 'vendo', dar: 'dando', ir: 'indo',
    ler: 'lendo', ouvir: 'ouvindo', cair: 'caindo', rir: 'rindo', sorrir: 'sorrindo',
    ser: 'sendo', estar: 'estando', haver: 'havendo'
  };

  /* ---------- núcleo ---------- */
  var PORE_PREF = { '': 1, com: 1, dis: 1, pro: 1, sup: 1, su: 1, re: 1, trans: 1, just: 1, inde: 1, indis: 1, opo: 1, ante: 1, entre: 1, sobre: 1, contra: 1, de: 1, pre: 1, pos: 1, ob: 1 };

  function ehCompostoDePor(inf) {
    var m = /^(.*)p[oô]r$/.exec(inf);
    return !!(m && PORE_PREF.hasOwnProperty(m[1]));
  }
  function prefixoDePor(inf) { return inf.replace(/p[oô]r$/, ''); }

  function grupo(inf) {
    if (ehCompostoDePor(inf)) return 'er';
    var g = inf.slice(-2);
    return (g === 'ar' || g === 'er' || g === 'ir') ? g : null;
  }

  function conjugar(inf) {
    inf = (inf || '').trim().toLowerCase();
    var g = grupo(inf);
    if (!g) return null;

    /* compuestos de pôr: compor, dispor, supor, propor… */
    if (ehCompostoDePor(inf) && inf !== 'pôr') {
      var baseP = conjugar('pôr');
      var pref = prefixoDePor(inf);
      var outP = {};
      Object.keys(baseP).forEach(function (k) {
        var v = baseP[k];
        outP[k] = Array.isArray(v) ? v.map(function (x) { return x ? pref + x : x; }) : (v ? pref + v : v);
      });
      outP.infinitivo = inf;
      outP.regular = false;
      outP.infinitivoPessoal = outP.infinitivoPessoal.map(function (x, i) {
        return i === 0 ? inf : x.replace(/ô/g, 'o');
      });
      outP.participio = pref + baseP.participio;
      return outP;
    }

    var stem = inf.slice(0, -2);
    var irr = IRR[inf] || {};
    var e = REG[g];

    var pres = irr.pres || e.pres.map(function (x) { return stem + x; });
    var perf = irr.perf || e.perf.map(function (x) { return stem + x; });
    var imp = irr.imp || e.imp.map(function (x) { return stem + x; });
    var subj = irr.subj || e.subj.map(function (x) { return stem + x; });

    // raíz del pretérito para imperfecto de subjuntivo y futuro de subjuntivo
    var perfStem = perf[5].replace(/ram$/, '');
    if (perf[5].slice(-3) !== 'ram') perfStem = perf[5].replace(/am$/, '');

    var subjImp = SUBJIMP.map(function (x) { return perfStem + x; });
    var subjFut = SUBJFUT.map(function (x) { return perfStem + x; });

    var futStem = irr.futStem || inf;
    var fut = FUT.map(function (x) { return futStem + x; });
    var cond = COND.map(function (x) { return futStem + x; });

    var ger = irr.ger || GER_IRR[inf] || (g === 'ar' ? stem + 'ando' : (g === 'er' ? stem + 'endo' : stem + 'indo'));
    var part = irr.part || PART_IRR[inf] || (g === 'ar' ? stem + 'ado' : stem + 'ido');

    var imper = irr.imper || [pres[2], subj[2], subj[3], pres[4], subj[5]];
    var imperNeg = [null, subj[1], subj[2], subj[3], subj[4], subj[5]];
    var infPes = INFPES.map(function (x) { return inf + x; });

    return {
      infinitivo: inf, grupo: g, regular: !Object.keys(irr).length,
      presente: pres, perfeito: perf, imperfeito: imp,
      futuro: fut, condicional: cond,
      subjPresente: subj, subjImperfeito: subjImp, subjFuturo: subjFut,
      imperativo: imper, imperativoNeg: imperNeg,
      infinitivoPessoal: infPes, gerundio: ger, participio: part
    };
  }

  /* ---------- etiquetas y explicaciones ---------- */
  var TEMPOS = {
    presente: { nome: 'Presente de indicativo', es: 'presente', why: 'Se usa para lo que pasa ahora, para hábitos y para verdades generales. Equivale al presente español: <b>falo</b> = hablo.' },
    perfeito: { nome: 'Pretérito perfecto simple (passado)', es: 'pasado puntual', why: 'Acción terminada y puntual en el pasado. Equivale al pretérito indefinido español: <b>falei</b> = hablé. En Brasil es el pasado más usado al hablar.' },
    imperfeito: { nome: 'Pretérito imperfecto', es: 'pasado descriptivo', why: 'Describe cómo era algo, rutinas del pasado o una acción que estaba en curso. Equivale a <b>hablaba / estaba hablando</b>.' },
    futuro: { nome: 'Futuro del presente', es: 'futuro', why: 'Planes y predicciones. En el habla diaria se prefiere <b>vou falar</b> (voy a hablar), pero en un oral formal queda muy bien.' },
    condicional: { nome: 'Condicional', es: 'condicional', why: 'Hipótesis y cortesía: <b>falaria</b> = hablaría. Aparece en frases con <i>se</i>.' },
    subjPresente: { nome: 'Presente de subjuntivo', es: 'subjuntivo presente', why: 'Aparece detrás de <b>que</b> cuando hay deseo, duda, emoción o influencia: <i>quero que você <b>fale</b></i>. El español hace lo mismo.' },
    subjImperfeito: { nome: 'Imperfecto de subjuntivo', es: 'subjuntivo pasado', why: 'Hipótesis poco real o deseo en el pasado: <i>se eu <b>falasse</b></i> = si yo hablara.' },
    subjFuturo: { nome: 'Futuro de subjuntivo', es: 'subjuntivo futuro', why: 'Muy portugués: se usa después de <b>quando, se, assim que, logo que</b> con idea de futuro. <i>Quando eu <b>falar</b> com ela…</i> = cuando hable con ella.' },
    imperativo: { nome: 'Imperativo', es: 'imperativo', why: 'Para dar órdenes o pedidos. Ojo: el imperativo afirmativo de <i>tu</i> es igual a la 3ª persona del presente.' },
    imperativoNeg: { nome: 'Imperativo negativo', es: 'imperativo negativo', why: 'Siempre con subjuntivo: <i>não <b>fales</b></i> / <i>não <b>fale</b></i>.' },
    gerundio: { nome: 'Gerundio', es: 'gerundio', why: 'Acción en desarrollo. En Brasil se usa con <i>estar</i>: <i>estou <b>falando</b></i>. En Portugal se prefiere <i>estou a falar</i>.' },
    participio: { nome: 'Participio', es: 'participio', why: 'Forma del verbo que funciona como adjetivo o con <i>ter/haver</i>: <i>tenho <b>falado</b></i>.' },
    infinitivo: { nome: 'Infinitivo', es: 'infinitivo', why: 'Es el nombre del verbo. En portugués es la forma de diccionario y se usa después de preposiciones (<i>para</i>, <i>sem</i>, <i>antes de</i>), de verbos modales (<i>querer</i>, <i>poder</i>, <i>dever</i>, <i>precisar</i>) y de <i>ir + infinitivo</i>.' },
    infinitivoPessoal: { nome: 'Infinitivo personal', es: 'infinitivo conjugado', why: '¡Truco portugués! El infinitivo puede llevar desinencia para marcar QUIÉN hace la acción: <i>para eu <b>falar</b></i>, <i>para tu <b>falares</b></i>, <i>para nós <b>falarmos</b></i>. Se usa sobre todo para dejar claro el sujeto (en español se resuelve con "que + subjuntivo").' }
  };

  var FORMAS = [
    ['presente', 'presente', 'presente'],
    ['perfeito', 'perfeito', 'perfeito'],
    ['imperfeito', 'imperfeito', 'imperfeito'],
    ['futuro', 'futuro', 'futuro'],
    ['condicional', 'condicional', 'condicional'],
    ['subjPresente', 'subjPresente', 'subjPresente'],
    ['subjImperfeito', 'subjImperfeito', 'subjImperfeito'],
    ['subjFuturo', 'subjFuturo', 'subjFuturo'],
    ['gerundio', 'gerundio', 0],
    ['participio', 'participio', 0]
  ];

  /* índice inverso: forma -> [{inf, tempo, pessoa}] */
  var REV = null;

  function construirIndice(lemas) {
    REV = Object.create(null);
    var vistos = Object.create(null);
    (lemas || []).forEach(function (inf) {
      var c = conjugar(inf);
      if (!c) return;
      FORMAS.forEach(function (f) {
        var chave = f[0], tempo = f[1], idxFixa = f[2];
        var valor = c[chave];
        if (!valor) return;
        var arr = Array.isArray(valor) ? valor.map(function (v, i) { return [v, i]; }) : [[valor, null]];
        arr.forEach(function (par) {
          var forma = par[0], i = par[1];
          if (!forma) return;
          var k = forma.toLowerCase();
          var id = inf + '|' + tempo + '|' + (i === null ? '-' : i);
          if (vistos[id]) return;
          vistos[id] = 1;
          (REV[k] = REV[k] || []).push({
            inf: inf, tempo: tempo,
            pessoa: (i === null || i === undefined) ? null : i,
            forma: forma,
            grupo: c.grupo
          });
        });
      });
      // infinitivo y formas personales
      [(c.infinitivo + '|infinitivo|-'), ].forEach(function () { });
      var addForma = function (forma, tempo, pessoa) {
        var k = String(forma).toLowerCase();
        var id = inf + '|' + tempo + '|' + (pessoa === null ? '-' : pessoa);
        if (vistos[id]) return;
        vistos[id] = 1;
        (REV[k] = REV[k] || []).push({ inf: inf, tempo: tempo, pessoa: pessoa, forma: forma, grupo: c.grupo });
      };
      addForma(c.infinitivo, 'infinitivo', null);
      c.infinitivoPessoal.forEach(function (f, i) {
        if (i === 0) return;        // "falar" ya está como infinitivo
        addForma(f, 'infinitivoPessoal', i);
      });
      c.imperativo.forEach(function (f, i) { addForma(f, 'imperativo', i + 1); });
      c.imperativoNeg.forEach(function (f, i) { if (f) addForma(f, 'imperativoNeg', i); });
    });
    return REV;
  }

  /* lemas por defecto = verbos del léxico + irregulares conocidos */
  function lemasDisponiveis() {
    var out = Object.create(null);
    Object.keys(IRR).forEach(function (k) { out[k] = 1; });
    var L = window.LEX_DATA && window.LEX_DATA.words;
    if (L) {
      Object.keys(L).forEach(function (k) {
        var w = L[k];
        if (w && w.pos === 'verbo' && grupo(k)) out[k] = 1;
      });
    }
    var seed = window.ORAL_SEED && window.ORAL_SEED.verbs;
    if (seed) seed.forEach(function (v) { if (grupo(v)) out[v] = 1; });
    return Object.keys(out);
  }

  function garantirIndice() {
    if (!REV) construirIndice(lemasDisponiveis());
    return REV;
  }

  function analisar(forma) {
    var rev = garantirIndice();
    var k = String(forma || '').toLowerCase();
    var achados = rev[k];
    if (!achados) return null;
    // deduplicar por inf+tempo+pessoa
    var ORDEM = { infinitivo: 0, infinitivoPessoal: 1, presente: 2, perfeito: 3, imperfeito: 4 };
    var vistos = {}, out = [];
    achados.forEach(function (a) {
      var id = a.inf + a.tempo + a.pessoa;
      if (vistos[id]) return;
      vistos[id] = 1;
      out.push(a);
    });
    out.sort(function (x, y) {
      var ox = ORDEM[x.tempo] == null ? 9 : ORDEM[x.tempo];
      var oy = ORDEM[y.tempo] == null ? 9 : ORDEM[y.tempo];
      return ox - oy;
    });
    return out;
  }

  function pessoaNome(i, curto) {
    if (i === null || i === undefined) return '';
    return (curto ? PERSOAS_CURTO : PERSOAS)[i] || '';
  }

  /* Devuelve una ficha lista para mostrar */
  function ficha(a) {
    var t = TEMPOS[a.tempo] || {};
    var p = pessoaNome(a.pessoa);
    var titulo = t.nome || a.tempo;
    if (p && a.tempo !== 'gerundio' && a.tempo !== 'participio') titulo += ' · ' + p;
    return {
      infinitivo: a.inf,
      tempo: a.tempo,
      tempoNome: t.nome || a.tempo,
      tempoEs: t.es || '',
      pessoa: p,
      pessoaIdx: a.pessoa,
      titulo: titulo,
      why: t.why || '',
      forma: a.forma,
      grupo: a.grupo
    };
  }

  /* Tabla de conjugación para mostrar en el panel */
  function tabela(inf, tempoDestaque) {
    var c = conjugar(inf);
    if (!c) return null;
    var linhas = [];
    ['presente', 'perfeito', 'imperfeito', 'futuro', 'subjPresente'].forEach(function (t) {
      linhas.push({
        tempo: t,
        nome: (TEMPOS[t] || {}).nome || t,
        formas: c[t],
        destaque: t === tempoDestaque
      });
    });
    return linhas;
  }

  PZ.conj = {
    conjugar: conjugar,
    analisar: analisar,
    ficha: ficha,
    tabela: tabela,
    tempos: TEMPOS,
    pessoaNome: pessoaNome,
    pessoas: PERSOAS,
    construirIndice: construirIndice,
    grupo: grupo,
    irregulares: IRR
  };
})();
