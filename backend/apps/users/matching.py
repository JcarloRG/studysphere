# apps/users/matching.py
"""
Motor de compatibilidad de StudySphere.

Reemplaza el "random.shuffle" / "random.randint(70, 99)" que había en views.py
por un cálculo real basado en las habilidades e intereses de los perfiles.

Idea general
------------
1. Cada perfil (estudiante/docente/egresado) tiene texto libre en `habilidades`
   y en un campo de intereses (`area_interes`, `logros` o `competencias`
   según el tipo).
2. El usuario que busca puede tener además una fila en `user_preferences`
   (tabla que ya existía pero no se usaba) donde dice explícitamente qué
   habilidades/intereses está buscando en otras personas.
3. Convertimos todo ese texto libre en conjuntos de "palabras clave"
   normalizadas y medimos qué tanto se solapan el perfil que busca y el
   perfil candidato.

Nada de esto depende de librerías externas de NLP/ML: es determinista,
rápido y fácil de razonar, que es lo que necesita este proyecto ahora mismo.
Si más adelante quieren algo más fino (sinónimos, embeddings, etc.) esto se
puede sustituir sin tocar el resto del código, porque todo pasa por
`calcular_compatibilidad()`.
"""

import re
import unicodedata

import psycopg2.extras

# Separa un texto libre en "trozos": comas, punto y coma, saltos de línea,
# barras, la palabra "y"/"and" usada como conector, etc.
_SEPARADORES = re.compile(r'[,;/\n\|•·]+|\s+y\s+|\s+and\s+')

# Palabras demasiado genéricas como para aportar señal de compatibilidad.
_STOPWORDS = {
    'de', 'del', 'la', 'el', 'los', 'las', 'y', 'en', 'con', 'para', 'un',
    'una', 'unos', 'unas', 'que', 'me', 'gusta', 'gustan', 'interes',
    'intereses', 'area', 'habilidad', 'habilidades', 'etc', 'entre', 'otros',
}


def _normalizar_texto(txt):
    """minúsculas + sin acentos, para que 'Programación' == 'programacion'."""
    if not txt:
        return ''
    txt = txt.strip().lower()
    txt = unicodedata.normalize('NFKD', txt).encode('ascii', 'ignore').decode('ascii')
    return txt


def extraer_palabras_clave(texto):
    """
    'Python, React, Trabajo en equipo' -> {'python', 'react', 'trabajo en equipo'}
    """
    texto = _normalizar_texto(texto)
    if not texto:
        return set()

    keywords = set()
    for parte in _SEPARADORES.split(texto):
        parte = parte.strip(' .')
        if not parte or parte in _STOPWORDS:
            continue
        keywords.add(parte)
    return keywords


def _similitud_conjuntos(a, b):
    """
    Coeficiente de solapamiento (overlap coefficient) = intersección /
    tamaño del conjunto más chico.

    Se usa esto en vez de Jaccard normal porque aquí es común comparar un
    conjunto corto (lo que alguien está buscando: 2-3 palabras) contra un
    perfil con muchas habilidades. Con Jaccard, un perfil muy completo
    "diluye" el score aunque tenga exactamente lo que se busca; con overlap
    coefficient no.

    También se da medio punto por coincidencias parciales (substring), para
    que 'python' y 'python avanzado' no cuenten como cero.
    """
    if not a or not b:
        return 0.0

    exactas = a & b
    restantes_a = a - exactas
    restantes_b = b - exactas

    parciales = 0
    for ka in restantes_a:
        for kb in restantes_b:
            if ka in kb or kb in ka:
                parciales += 1
                break

    total = len(exactas) + parciales * 0.5
    return total / min(len(a), len(b))


def calcular_compatibilidad(origen, candidato, pesos=(0.6, 0.4)):
    """
    origen / candidato: tuplas (set_habilidades, set_intereses)
    pesos: (peso_habilidades, peso_intereses) — habilidades pesa más porque
           es la señal más directa de "puede ayudarme / le puedo ayudar".

    Devuelve un entero 0-100.
    """
    w_hab, w_int = pesos
    hab_o, int_o = origen
    hab_c, int_c = candidato

    sim_hab = _similitud_conjuntos(hab_o, hab_c)
    sim_int = _similitud_conjuntos(int_o, int_c)

    score = (sim_hab * w_hab + sim_int * w_int) * 100
    return max(0, min(100, round(score)))


# --------------------------------------------------------------------------
# Acceso a datos: de dónde sacamos las habilidades/intereses de cada tipo
# de usuario, y las preferencias explícitas de búsqueda.
# --------------------------------------------------------------------------

# Nombre de la tabla y de la columna que hace de "intereses" para cada tipo.
_TABLA_POR_TIPO = {
    'estudiante': ('estudiantes', 'area_interes'),
    'docente': ('docentes', 'logros'),
    'egresado': ('egresados', 'competencias'),
}


def obtener_texto_perfil(conn, tipo, usuario_id):
    """
    Devuelve (habilidades_texto, intereses_texto) del perfil dado, o
    ('', '') si no existe / el tipo no es válido.
    """
    info = _TABLA_POR_TIPO.get(tipo)
    if not info or not usuario_id:
        return '', ''

    tabla, columna_interes = info
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT habilidades, {columna_interes} AS intereses FROM {tabla} WHERE id=%s",
        (usuario_id,),
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return '', ''
    return row.get('habilidades') or '', row.get('intereses') or ''


def obtener_preferencia(conn, usuario_id, usuario_tipo):
    """
    Lee la fila de user_preferences del usuario (lo que dice que está
    buscando explícitamente), o None si nunca la configuró.
    """
    if not usuario_id or not usuario_tipo:
        return None
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        """
        SELECT habilidades_buscadas, intereses_buscados, tipo_colaboracion
        FROM user_preferences
        WHERE usuario_id=%s AND usuario_tipo=%s
        LIMIT 1
        """,
        (usuario_id, usuario_tipo),
    )
    row = cur.fetchone()
    cur.close()
    return row


def construir_perfil_busqueda(conn, usuario_id, usuario_tipo):
    """
    Arma el conjunto de keywords "de búsqueda" del usuario origen, con esta
    prioridad:

      1. Si configuró user_preferences (habilidades_buscadas /
         intereses_buscados) -> se usa eso. Es la señal más fuerte porque el
         usuario dijo explícitamente qué está buscando.
      2. Si no, se usa su propio perfil (habilidades / area_interes) -> en
         ausencia de una búsqueda explícita, se le recomienda gente afín a
         lo que YA sabe/le interesa (razonable como default).
      3. Si tampoco tiene perfil llenado -> conjuntos vacíos ("cold start";
         se maneja aparte en quien llama a esta función).

    Devuelve (set_habilidades, set_intereses, modo) donde modo es uno de
    'preferencias' | 'perfil_propio' | 'vacio', para que el caller pueda
    decidir qué hacer en el caso 'vacio' y para que el frontend pueda, si
    quiere, explicarle al usuario por qué le está recomendando lo que le
    recomienda.
    """
    pref = obtener_preferencia(conn, usuario_id, usuario_tipo)
    if pref and (pref.get('habilidades_buscadas') or pref.get('intereses_buscados')):
        hab = extraer_palabras_clave(pref.get('habilidades_buscadas'))
        interes = extraer_palabras_clave(pref.get('intereses_buscados'))
        if hab or interes:
            return hab, interes, 'preferencias'

    hab_txt, interes_txt = obtener_texto_perfil(conn, usuario_tipo, usuario_id)
    hab = extraer_palabras_clave(hab_txt)
    interes = extraer_palabras_clave(interes_txt)
    if hab or interes:
        return hab, interes, 'perfil_propio'

    return set(), set(), 'vacio'


def compatibilidad_entre_perfiles(conn, origen_id, origen_tipo, destino_id, destino_tipo):
    """
    Atajo para calcular compatibilidad entre dos perfiles puntuales (se usa
    al solicitar un match directo). Usa la misma lógica de
    construir_perfil_busqueda para el origen, comparada contra el perfil
    propio del destino.
    """
    hab_o, int_o, _modo = construir_perfil_busqueda(conn, origen_id, origen_tipo)
    hab_txt, interes_txt = obtener_texto_perfil(conn, destino_tipo, destino_id)
    hab_d = extraer_palabras_clave(hab_txt)
    int_d = extraer_palabras_clave(interes_txt)

    if not (hab_o or int_o) or not (hab_d or int_d):
        # No hay suficiente información de ninguno de los dos lados como
        # para calcular algo con sentido.
        return None

    return calcular_compatibilidad((hab_o, int_o), (hab_d, int_d))