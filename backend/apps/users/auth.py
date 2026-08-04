# apps/users/auth.py
"""
Autenticación basada en JWT para los perfiles de la red (Estudiante /
Docente / Egresado).

Antes, `_usuario_actual()` en views.py confiaba ciegamente en las
cabeceras X-User-Id / X-User-Tipo que mandaba el frontend: cualquiera
podía suplantar a cualquier usuario con solo poner esas dos cabeceras en
la petición (no había ninguna firma ni verificación). Este módulo lo
sustituye por un JWT firmado con SECRET_KEY: el cliente no puede fabricar
uno válido, ni modificar el perfil_id/tipo de uno existente, sin conocer
la clave del servidor.

No usamos RefreshToken.for_user() porque estos perfiles no son instancias
de settings.AUTH_USER_MODEL (viven en tablas propias — estudiantes,
docentes, egresados — manejadas con SQL directo, no con el ORM de auth de
Django). En su lugar, construimos los tokens "en blanco" y les asignamos
las claims (perfil_id, tipo, email) a mano.
"""
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

TIPOS_VALIDOS = ('estudiante', 'docente', 'egresado')


def emitir_tokens(perfil_id, tipo, email=None):
    """
    Crea un par (access, refresh) para un perfil recién autenticado.
    Se llama una sola vez, justo después de validar la contraseña en
    login_user().
    """
    if tipo not in TIPOS_VALIDOS:
        raise ValueError(f"tipo de usuario inválido: {tipo!r}")

    refresh = RefreshToken()
    refresh['perfil_id'] = perfil_id
    refresh['tipo'] = tipo
    if email:
        refresh['email'] = email

    access = refresh.access_token
    access['perfil_id'] = perfil_id
    access['tipo'] = tipo
    if email:
        access['email'] = email

    return {'access': str(access), 'refresh': str(refresh)}


def refrescar_access_token(refresh_str):
    """
    Devuelve un access token nuevo a partir de un refresh token válido.
    Lanza TokenError si el refresh token es inválido, expiró o fue
    manipulado (el caller debe convertirlo en una respuesta 401).
    """
    refresh = RefreshToken(refresh_str)
    perfil_id = refresh.get('perfil_id')
    tipo = refresh.get('tipo')
    email = refresh.get('email')

    access = refresh.access_token
    access['perfil_id'] = perfil_id
    access['tipo'] = tipo
    if email:
        access['email'] = email
    return str(access)


def _token_desde_header(request):
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    return header[len('Bearer '):].strip()


def usuario_desde_request(request):
    """
    (perfil_id:int, tipo:str) del dueño del access token en la cabecera
    Authorization: Bearer <token>, o (None, None) si no hay token, es
    inválido, expiró o fue manipulado.

    Esta es la única fuente de "quién es el usuario logueado" que deberían
    usar las vistas — sustituye a leer X-User-Id/X-User-Tipo directo del
    request, que no probaba nada.
    """
    token_str = _token_desde_header(request)
    if not token_str:
        return None, None
    try:
        token = AccessToken(token_str)
    except TokenError:
        return None, None

    perfil_id = token.get('perfil_id')
    tipo = token.get('tipo')
    if perfil_id is None or tipo not in TIPOS_VALIDOS:
        return None, None
    try:
        return int(perfil_id), tipo
    except (TypeError, ValueError):
        return None, None
