# apps/users/admin_permissions.py
"""
Autenticación y permisos del panel de administración.

El panel usa un token propio (no el login de Estudiante/Docente/Egresado,
y tampoco el login de Django) para no mezclar "soy alguien de la red" con
"administro la red". El token es un valor firmado con la SECRET_KEY de
Django (django.core.signing): no hace falta una tabla de sesiones en la
base de datos, y expira solo pasado ADMIN_TOKEN_MAX_AGE aunque nadie
"cierre sesión" explícitamente.
"""
from functools import wraps

from django.core import signing
from django.http import JsonResponse

ADMIN_TOKEN_SALT = 'studysphere.admin-panel'
ADMIN_TOKEN_MAX_AGE = 60 * 60 * 12  # 12 horas


def generar_token_admin(admin_user):
    """Crea el token firmado que el frontend guarda como 'adminToken'."""
    payload = {'admin_id': admin_user.id, 'username': admin_user.username}
    return signing.dumps(payload, salt=ADMIN_TOKEN_SALT)


def _payload_desde_token(token):
    """Payload del token si es válido y no ha expirado; None si no."""
    if not token:
        return None
    try:
        return signing.loads(token, salt=ADMIN_TOKEN_SALT, max_age=ADMIN_TOKEN_MAX_AGE)
    except signing.BadSignature:
        return None


def admin_desde_request(request):
    """
    AdminUser dueño del token en la cabecera X-Admin-Token, o None si no
    hay token, es inválido, expiró, o la cuenta fue desactivada.
    """
    from .models import AdminUser  # import local: evita ciclos al cargar la app

    payload = _payload_desde_token(request.headers.get('X-Admin-Token'))
    if not payload:
        return None

    try:
        # La identidad real siempre se resuelve por id contra la BD (el
        # username del token es solo informativo); así, si se desactiva
        # una cuenta, sus tokens ya emitidos dejan de servir de inmediato.
        return AdminUser.objects.get(id=payload.get('admin_id'), is_active=True)
    except AdminUser.DoesNotExist:
        return None


def admin_required(view_func):
    """
    Decorador para vistas del panel: exige un token de admin válido en la
    cabecera X-Admin-Token. Si falta o es inválido, responde 401 sin
    llegar a ejecutar la vista. Deja al admin autenticado en
    request.admin_user para que la vista lo use si lo necesita.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if request.method == 'OPTIONS':
            return JsonResponse({'status': 'success', 'data': {'ok': True}})

        admin = admin_desde_request(request)
        if admin is None:
            return JsonResponse(
                {
                    'status': 'error',
                    'message': 'Sesión de administrador inválida o expirada. Inicia sesión de nuevo.',
                },
                status=401,
            )

        request.admin_user = admin
        return view_func(request, *args, **kwargs)

    return wrapper
