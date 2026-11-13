/* ============================================================
   func-words.js — palabras funcionales de altísima frecuencia.
   Sirven para que la glosa palabra por palabra funcione siempre,
   incluso si la palabra no está en el diccionario general.
   ============================================================ */
window.FUNC_WORDS = {
  art: {
    'o': 'el', 'a': 'la', 'os': 'los', 'as': 'las',
    'um': 'un', 'uma': 'una', 'uns': 'unos', 'umas': 'unas'
  },
  prep: {
    'de': 'de', 'em': 'en', 'por': 'por', 'para': 'para', 'com': 'con', 'sem': 'sin',
    'entre': 'entre', 'sobre': 'sobre', 'até': 'hasta', 'desde': 'desde', 'contra': 'contra',
    'após': 'después de', 'ante': 'ante', 'sob': 'bajo', 'como': 'como', 'conforme': 'según',
    'segundo': 'según', 'durante': 'durante', 'exceto': 'excepto', 'salvo': 'salvo',
    'menos': 'menos', 'via': 'vía', 'trás': 'atrás', 'perante': 'ante', 'mediante': 'mediante'
  },
  conj: {
    'e': 'y', 'ou': 'o', 'mas': 'pero', 'porém': 'sin embargo', 'contudo': 'sin embargo',
    'todavia': 'sin embargo', 'entretanto': 'sin embargo', 'porque': 'porque', 'pois': 'pues',
    'se': 'si', 'que': 'que', 'quando': 'cuando', 'enquanto': 'mientras', 'embora': 'aunque',
    'caso': 'caso', 'logo': 'luego', 'portanto': 'por lo tanto', 'assim': 'así',
    'então': 'entonces', 'também': 'también', 'nem': 'ni', 'ora': 'ahora', 'conquanto': 'aunque',
    'dado': 'dado', 'visto': 'visto', 'senão': 'sino', 'ou seja': 'o sea', 'isto é': 'es decir'
  },
  pron: {
    'eu': 'yo', 'tu': 'vos', 'ele': 'él', 'ela': 'ella', 'nós': 'nosotros', 'vós': 'vosotros',
    'eles': 'ellos', 'elas': 'ellas', 'você': 'vos / usted', 'vocês': 'ustedes',
    'me': 'me', 'te': 'te', 'se': 'se', 'lhe': 'le', 'lhes': 'les', 'nos': 'nos', 'vos': 'os',
    'o': 'lo', 'a': 'la', 'os': 'los', 'as': 'las', 'mim': 'mí', 'ti': 'ti', 'si': 'sí',
    'comigo': 'conmigo', 'contigo': 'contigo', 'consigo': 'consigo',
    'quem': 'quien', 'qual': 'cuál', 'quais': 'cuáles', 'quanto': 'cuánto', 'quanta': 'cuánta',
    'quantos': 'cuántos', 'quantas': 'cuántas', 'onde': 'dónde', 'aonde': 'adónde',
    'porquê': 'porqué', 'cadê': 'dónde está', 'algo': 'algo', 'alguém': 'alguien',
    'nada': 'nada', 'ninguém': 'nadie', 'tudo': 'todo', 'todos': 'todos', 'todas': 'todas',
    'outro': 'otro', 'outra': 'otra', 'outros': 'otros', 'outras': 'otras'
  },
  poss: {
    'meu': 'mi', 'minha': 'mi', 'meus': 'mis', 'minhas': 'mis',
    'teu': 'tu', 'tua': 'tu', 'teus': 'tus', 'tuas': 'tus',
    'seu': 'su', 'sua': 'su', 'seus': 'sus', 'suas': 'sus',
    'nosso': 'nuestro', 'nossa': 'nuestra', 'nossos': 'nuestros', 'nossas': 'nuestras',
    'vosso': 'vuestro', 'vossa': 'vuestra'
  },
  dem: {
    'este': 'este', 'esta': 'esta', 'estes': 'estos', 'estas': 'estas',
    'esse': 'ese', 'essa': 'esa', 'esses': 'esos', 'essas': 'esas',
    'isto': 'esto', 'isso': 'eso', 'aquilo': 'aquello',
    'aquele': 'aquel', 'aquela': 'aquella', 'aqueles': 'aquellos', 'aquelas': 'aquellas'
  },
  adv: {
    'não': 'no', 'sim': 'sí', 'já': 'ya', 'ainda': 'todavía', 'sempre': 'siempre',
    'nunca': 'nunca', 'jamais': 'jamás', 'quase': 'casi', 'talvez': 'quizás',
    'aqui': 'aquí', 'cá': 'acá', 'aí': 'ahí', 'ali': 'allí', 'lá': 'allá',
    'longe': 'lejos', 'perto': 'cerca', 'cedo': 'temprano', 'tarde': 'tarde',
    'ontem': 'ayer', 'hoje': 'hoy', 'amanhã': 'mañana', 'anteontem': 'anteayer',
    'depois': 'después', 'antes': 'antes', 'agora': 'ahora', 'depressa': 'rápido',
    'devagar': 'despacio', 'rápido': 'rápido', 'bem': 'bien', 'mal': 'mal',
    'mais': 'más', 'muito': 'mucho / muy', 'muita': 'mucha / muy', 'muitos': 'muchos', 'muitas': 'muchas', 'pouco': 'poco', 'pouca': 'poca', 'poucos': 'pocos', 'poucas': 'pocas', 'tantos': 'tantos', 'tantas': 'tantas', 'bastantes': 'bastantes', 'tão': 'tan', 'tanto': 'tanto',
    'apenas': 'apenas', 'só': 'solo', 'somente': 'solamente', 'inclusive': 'incluso',
    'principalmente': 'principalmente', 'finalmente': 'finalmente', 'realmente': 'realmente',
    'provavelmente': 'probablemente', 'certamente': 'certamente', 'claro': 'claro',
    'infelizmente': 'lamentablemente', 'felizmente': 'felizmente', 'geralmente': 'generalmente',
    'normalmente': 'normalmente', 'atualmente': 'actualmente', 'antigamente': 'antiguamente',
    'juntos': 'juntos', 'aliás': 'además', 'além': 'además', 'afinal': 'al final',
    'enfim': 'en fin', 'basicamente': 'básicamente', 'bastante': 'bastante',
    'demais': 'demasiado', 'cada': 'cada', 'qualquer': 'cualquier', 'algum': 'algún',
    'alguma': 'alguna', 'alguns': 'algunos', 'algumas': 'algunas', 'nenhum': 'ningún',
    'nenhuma': 'ninguna', 'todo': 'todo', 'toda': 'toda', 'vários': 'varios',
    'várias': 'varias', 'mesmo': 'mismo', 'próprio': 'propio', 'própria': 'propia'
  },
  num: {
    'zero': 'cero', 'um': 'uno', 'dois': 'dos', 'duas': 'dos', 'três': 'tres', 'quatro': 'cuatro',
    'cinco': 'cinco', 'seis': 'seis', 'sete': 'siete', 'oito': 'ocho', 'nove': 'nueve',
    'dez': 'diez', 'onze': 'once', 'doze': 'doce', 'treze': 'trece', 'quatorze': 'catorce',
    'catorze': 'catorce', 'quinze': 'quince', 'dezesseis': 'dieciséis', 'dezessete': 'diecisiete',
    'dezessete': 'diecisiete', 'dezoito': 'dieciocho', 'dezenove': 'diecinueve', 'vinte': 'veinte',
    'trinta': 'treinta', 'quarenta': 'cuarenta', 'cinquenta': 'cincuenta', 'sessenta': 'sesenta',
    'setenta': 'setenta', 'oitenta': 'ochenta', 'noventa': 'noventa', 'cem': 'cien',
    'cento': 'ciento', 'mil': 'mil', 'milhão': 'millón', 'primeiro': 'primero',
    'segunda': 'segunda', 'terceiro': 'tercero', 'último': 'último'
  },
  interj: {
    'obrigado': 'gracias', 'obrigada': 'gracias', 'oi': 'hola', 'olá': 'hola',
    'tchau': 'chau', 'desculpe': 'perdón', 'desculpa': 'perdón', 'por favor': 'por favor',
    'tomara': 'ojalá', 'vamos': 'vamos', 'eita': 'uy', 'poxa': 'vaya', 'nossa': 'vaya'
  }
};

/* Formas conjugadas de altísima frecuencia con glosa natural en español */
window.GLOSS_FIX = {
  'é': 'es', 'são': 'son', 'era': 'era', 'eram': 'eran', 'foi': 'fue', 'foram': 'fueron',
  'fui': 'fui', 'serei': 'seré', 'será': 'será', 'serão': 'serán', 'seja': 'sea',
  'sejam': 'sean', 'fosse': 'fuera', 'fossem': 'fueran', 'ter': 'tener', 'ser': 'ser', 'estar': 'estar', 'ir': 'ir', 'vir': 'venir', 'falar': 'hablar',
  'estou': 'estoy', 'está': 'está', 'estão': 'están', 'estava': 'estaba', 'estive': 'estuve',
  'tenho': 'tengo', 'tem': 'tiene', 'têm': 'tienen', 'tinha': 'tenía', 'tive': 'tuve',
  'terei': 'tendré', 'terá': 'tendrá', 'tenha': 'tenga', 'temos': 'tenemos',
  'vou': 'voy', 'vai': 'va', 'vamos': 'vamos', 'vão': 'van', 'ia': 'iba', 'iam': 'iban',
  'quero': 'quiero', 'quer': 'quiere', 'querem': 'quieren', 'queria': 'quería',
  'quis': 'quise', 'queira': 'quiera',
  'posso': 'puedo', 'pode': 'puede', 'podem': 'pueden', 'podia': 'podía', 'pôde': 'pudo',
  'sei': 'sé', 'sabe': 'sabe', 'sabem': 'saben', 'soube': 'supe',
  'faço': 'hago', 'faz': 'hace', 'fazem': 'hacen', 'fiz': 'hice', 'fez': 'hizo',
  'digo': 'digo', 'diz': 'dice', 'disse': 'dijo', 'vi': 'vi', 'viu': 'vio',
  'vejo': 'veo', 'vê': 've', 'vou': 'voy', 'venho': 'vengo', 'vem': 'viene', 'veio': 'vino',
  'dou': 'doy', 'dá': 'da', 'dão': 'dan', 'dei': 'di', 'deu': 'dio',
  'há': 'hay', 'houve': 'hubo', 'havia': 'había',
  'gosto': 'me gusta', 'gosta': 'le gusta', 'gostam': 'les gusta', 'gostei': 'me gustó',
  'acho': 'me parece', 'acha': 'le parece', 'achei': 'me pareció',
  'espero': 'espero', 'espera': 'espera', 'esperamos': 'esperamos',
  'preciso': 'necesito', 'precisa': 'necesita', 'consigo': 'consigo', 'consegue': 'consigue',
  'devo': 'debo', 'deve': 'debe', 'pretendo': 'pretendo', 'queria': 'quería',
  'vou': 'voy', 'irei': 'iré', 'seria': 'sería', 'teria': 'tendría', 'gostaria': 'me gustaría',
  'estou': 'estoy', 'ficou': 'quedó', 'fica': 'queda', 'ficar': 'quedar'
};
