# apps/users/admin_views.py
"""
Vistas del panel de administración de StudySphere.

Todas, salvo admin_login, requieren un token válido de AdminUser vía el
decorador @admin_required (cabecera X-Admin-Token).

Los endpoints de "eliminar" de aquí son independientes de
eliminar_estudiante/eliminar_docente/eliminar_egresado en views.py: esos
solo dejan a cada usuario borrar SU PROPIO perfil (_verificar_propietario);
estos dejan a un administrador autenticado borrar el perfil de cualquiera,
que es lo que un panel de admin necesita para ser útil de verdad.
"""
import json

from django.contrib.auth.hashers import check_password
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

import psycopg2.extras

from .admin_permissions import admin_required, generar_token_admin
from .views import allow_options, db_conn, json_ok, json_err


# ===================== LOGIN =====================

@csrf_exempt
def admin_login(request):
    """POST /api/admin/login/  { username, password } -> { token, admin }"""
    opt = allow_options(request)
    if opt:
        return opt
    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    from .models import AdminUser

    try:
        data = json.loads(request.body or "{}")
    except (ValueError, TypeError):
        return json_err('Cuerpo de la solicitud inválido.', 400)

    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return json_err('Usuario y contraseña son requeridos.', 400)

    try:
        admin = AdminUser.objects.get(username__iexact=username, is_active=True)
    except AdminUser.DoesNotExist:
        return json_err('Usuario o contraseña incorrectos.', 401)

    if not check_password(password, admin.password_hash):
        return json_err('Usuario o contraseña incorrectos.', 401)

    admin.last_login = timezone.now()
    admin.save(update_fields=['last_login'])

    token = generar_token_admin(admin)
    return json_ok(
        {
            'token': token,
            'admin': {
                'id': admin.id,
                'username': admin.username,
                'nombre': admin.nombre or admin.username,
            },
        },
        'Sesión iniciada correctamente.',
    )


@csrf_exempt
@admin_required
def admin_me(request):
    """GET /api/admin/me/ -> confirma que el token sigue siendo válido."""
    admin = request.admin_user
    return json_ok({
        'id': admin.id,
        'username': admin.username,
        'nombre': admin.nombre or admin.username,
    })


# ===================== DASHBOARD =====================

@csrf_exempt
@admin_required
def admin_stats(request):
    """GET /api/admin/stats/ -> conteos generales + últimos registros."""
    opt = allow_options(request)
    if opt:
        return opt

    try:
        conn = db_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        def contar(tabla, where=""):
            cur.execute(f"SELECT COUNT(*) AS n FROM {tabla} {where}")
            return cur.fetchone()['n']

        stats = {
            'estudiantes': contar('estudiantes'),
            'docentes': contar('docentes'),
            'egresados': contar('egresados'),
            'proyectos': contar('proyectos'),
            'matches_aceptados': contar('matches', "WHERE estado = 'aceptado'"),
            'matches_pendientes': contar('matches', "WHERE estado = 'pendiente'"),
        }

        try:
            stats['mensajes'] = contar('mensajes')
        except Exception:
            stats['mensajes'] = None

        cur.execute("""
            SELECT tipo, id, nombre_completo, correo_institucional, fecha_registro FROM (
                SELECT 'estudiante' AS tipo, id,
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                       correo_institucional, fecha_registro
                FROM estudiantes
                UNION ALL
                SELECT 'docente', id,
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')),
                       correo_institucional, fecha_registro
                FROM docentes
                UNION ALL
                SELECT 'egresado', id,
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')),
                       correo_institucional, fecha_registro
                FROM egresados
            ) recientes
            ORDER BY fecha_registro DESC
            LIMIT 8
        """)
        stats['registros_recientes'] = cur.fetchall()

        cur.close()
        conn.close()
        return json_ok(stats)
    except Exception as e:
        return json_err(str(e), 500)


# ===================== HELPERS DE LISTADO/BÚSQUEDA =====================

def _listar_perfiles(tabla, columnas_extra, columnas_busqueda, q):
    """
    SELECT genérico para estudiantes/docentes/egresados con búsqueda
    opcional (ILIKE) sobre columnas_busqueda cuando llega ?q=...
    """
    conn = db_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    sql = f"""
        SELECT id,
               CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
               nombre, apellido_paterno, apellido_materno,
               correo_institucional, {columnas_extra}, fecha_registro,
               COALESCE(foto, '/static/images/default-avatar.png') AS foto
        FROM {tabla}
    """
    params = []
    if q:
        condiciones = " OR ".join(f"{col} ILIKE %s" for col in columnas_busqueda)
        sql += f" WHERE ({condiciones})"
        like = f"%{q}%"
        params.extend([like] * len(columnas_busqueda))

    sql += " ORDER BY id DESC"
    cur.execute(sql, tuple(params))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


@csrf_exempt
@admin_required
def admin_estudiantes(request):
    """GET /api/admin/estudiantes/?q=... -> lista (y busca) estudiantes."""
    opt = allow_options(request)
    if opt:
        return opt
    if request.method != 'GET':
        return json_err('Método no permitido', 405)

    q = (request.GET.get('q') or '').strip()
    try:
        rows = _listar_perfiles(
            'estudiantes',
            'carrera_actual, otra_carrera, semestre, habilidades, area_interes',
            ['nombre', 'apellido_paterno', 'apellido_materno',
             'correo_institucional', 'carrera_actual', 'habilidades'],
            q,
        )
        return json_ok(rows)
    except Exception as e:
        return json_err(str(e), 500)


@csrf_exempt
@admin_required
def admin_docentes(request):
    """GET /api/admin/docentes/?q=... -> lista (y busca) docentes."""
    opt = allow_options(request)
    if opt:
        return opt
    if request.method != 'GET':
        return json_err('Método no permitido', 405)

    q = (request.GET.get('q') or '').strip()
    try:
        rows = _listar_perfiles(
            'docentes',
            'carrera_egreso, carreras_imparte, grado_academico, habilidades, logros',
            ['nombre', 'apellido_paterno', 'apellido_materno',
             'correo_institucional', 'carrera_egreso', 'carreras_imparte'],
            q,
        )
        return json_ok(rows)
    except Exception as e:
        return json_err(str(e), 500)


@csrf_exempt
@admin_required
def admin_egresados(request):
    """GET /api/admin/egresados/?q=... -> lista (y busca) egresados."""
    opt = allow_options(request)
    if opt:
        return opt
    if request.method != 'GET':
        return json_err('Método no permitido', 405)

    q = (request.GET.get('q') or '').strip()
    try:
        rows = _listar_perfiles(
            'egresados',
            'carrera_egreso, anio_egreso, ocupacion_actual, empresa, puesto, habilidades',
            ['nombre', 'apellido_paterno', 'apellido_materno', 'correo_institucional',
             'carrera_egreso', 'empresa', 'puesto'],
            q,
        )
        return json_ok(rows)
    except Exception as e:
        return json_err(str(e), 500)


# ===================== ELIMINAR (COMO ADMIN) =====================

@csrf_exempt
@admin_required
def admin_eliminar_estudiante(request, id):
    """POST /api/admin/estudiante/<id>/delete/"""
    from .models import Estudiante
    if request.method != 'POST':
        return json_err('Método no permitido', 405)
    try:
        est = Estudiante.objects.get(id=id)
        correo = est.correo_institucional
        est.delete()
        return json_ok({'id': id, 'correo': correo}, 'Estudiante eliminado exitosamente por el administrador.')
    except Estudiante.DoesNotExist:
        return json_err('Estudiante no encontrado', 404)
    except Exception as e:
        return json_err(str(e), 500)


@csrf_exempt
@admin_required
def admin_eliminar_docente(request, id):
    """POST /api/admin/docente/<id>/delete/"""
    from .models import Docente
    if request.method != 'POST':
        return json_err('Método no permitido', 405)
    try:
        doc = Docente.objects.get(id=id)
        correo = doc.correo_institucional
        doc.delete()
        return json_ok({'id': id, 'correo': correo}, 'Docente eliminado exitosamente por el administrador.')
    except Docente.DoesNotExist:
        return json_err('Docente no encontrado', 404)
    except Exception as e:
        return json_err(str(e), 500)


@csrf_exempt
@admin_required
def admin_eliminar_egresado(request, id):
    """POST /api/admin/egresado/<id>/delete/"""
    from .models import Egresado
    if request.method != 'POST':
        return json_err('Método no permitido', 405)
    try:
        egr = Egresado.objects.get(id=id)
        correo = egr.correo_institucional
        egr.delete()
        return json_ok({'id': id, 'correo': correo}, 'Egresado eliminado exitosamente por el administrador.')
    except Egresado.DoesNotExist:
        return json_err('Egresado no encontrado', 404)
    except Exception as e:
        return json_err(str(e), 500)


# ===================== PROYECTOS (COMO ADMIN) =====================

@csrf_exempt
@admin_required
def admin_proyectos(request):
    """GET /api/admin/proyectos/?q=... -> lista (y busca) proyectos."""
    opt = allow_options(request)
    if opt:
        return opt
    if request.method != 'GET':
        return json_err('Método no permitido', 405)

    q = (request.GET.get('q') or '').strip()
    try:
        conn = db_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        sql = """
            SELECT p.id, p.titulo, p.descripcion, p.tipo, p.modalidad, p.carrera,
                   p.estado, p.creador_id, p.creador_tipo,
                   creadores.nombre_completo AS creador_nombre,
                   p.creado_en
            FROM proyectos p
            LEFT JOIN (
                SELECT id, 'estudiante' AS tipo,
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo
                FROM estudiantes
                UNION ALL
                SELECT id, 'docente',
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, ''))
                FROM docentes
                UNION ALL
                SELECT id, 'egresado',
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, ''))
                FROM egresados
            ) creadores ON creadores.id = p.creador_id AND creadores.tipo = p.creador_tipo
        """
        params = []
        if q:
            sql += " WHERE (p.titulo ILIKE %s OR p.descripcion ILIKE %s)"
            like = f"%{q}%"
            params.extend([like, like])

        sql += " ORDER BY p.creado_en DESC"
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return json_ok(rows)
    except Exception as e:
        return json_err(str(e), 500)


@csrf_exempt
@admin_required
def admin_eliminar_proyecto(request, id):
    """POST /api/admin/proyecto/<id>/delete/"""
    if request.method != 'POST':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cur = conn.cursor()
        cur.execute("SELECT titulo FROM proyectos WHERE id = %s", (id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return json_err('Proyecto no encontrado', 404)

        cur.execute("DELETE FROM proyectos WHERE id = %s", (id,))
        conn.commit()
        cur.close()
        conn.close()
        return json_ok({'id': id, 'titulo': row[0]}, 'Proyecto eliminado exitosamente por el administrador.')
    except Exception as e:
        return json_err(str(e), 500)
