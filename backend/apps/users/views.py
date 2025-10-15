from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.html import escape
from django.contrib.auth.hashers import make_password
from urllib.parse import unquote
import json
import mysql.connector

# ==========================
# Helpers
# ==========================

def _corsify(response):
    # Ajusta a tu política real de CORS si lo necesitas
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response["Content-Type"] = "application/json; charset=utf-8"
    return response

def _preflight_if_options(request):
    if request.method == 'OPTIONS':
        return _corsify(JsonResponse({'status': 'ok'}))
    return None

def _json_error(message, status=400):
    return _corsify(JsonResponse({'status': 'error', 'message': message}, status=status))

def _required_fields(data, campos):
    for c in campos:
        if not data.get(c):
            return c
    return None

def _conn():
    # Ajusta tus credenciales aquí
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='',
        database='studysphere'
    )

# ==========================
# Health
# ==========================

@csrf_exempt
def health(request):
    pre = _preflight_if_options(request)
    if pre: return pre
    if request.method != 'GET':
        return _json_error('Método no permitido. Usa GET.', status=405)
    return _corsify(JsonResponse({'status': 'success', 'message': 'ok'}))

# ==========================
# REGISTRO
# ==========================

@csrf_exempt
def registrar_estudiante(request):
    pre = _preflight_if_options(request)
    if pre: return pre

    if request.method != 'POST':
        return _json_error('Método no permitido. Usa POST.', status=405)

    try:
        data = json.loads(request.body or '{}')
    except Exception:
        return _json_error('JSON inválido en el cuerpo de la petición', status=400)

    # Campos obligatorios (incluye password si tu front ya lo envía)
    obligatorios = ['nombre_completo', 'correo_institucional', 'numero_control', 'carrera_actual']
    faltante = _required_fields(data, obligatorios)
    if faltante:
        return _json_error(f'Campo obligatorio faltante: {faltante}', status=400)

    # Password (opcionales — si los usas, valida y guarda hash)
    pwd = data.get('password')
    pwd2 = data.get('password2')
    pwd_hash = None
    if pwd or pwd2:
        if not pwd or not pwd2:
            return _json_error('Debes proporcionar password y password2', status=400)
        if pwd != pwd2:
            return _json_error('Las contraseñas no coinciden', status=400)
        if len(pwd) < 8:
            return _json_error('La contraseña debe tener al menos 8 caracteres', status=400)
        pwd_hash = make_password(pwd)

    try:
        conn = _conn()
        cursor = conn.cursor()

        # Intenta insertar con password_hash y email_verified si existen
        try:
            sql = """
                INSERT INTO estudiantes
                (nombre_completo, correo_institucional, password_hash,
                 numero_control, carrera_actual, otra_carrera, semestre,
                 habilidades, area_interes, email_verified, fecha_registro)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, %s, NOW())
            """
            valores = (
                data['nombre_completo'],
                data['correo_institucional'],
                pwd_hash,
                data['numero_control'],
                data['carrera_actual'],
                data.get('otra_carrera', 'No'),
                data.get('semestre', ''),
                data.get('habilidades', ''),
                data.get('area_interes', ''),
                0
            )
            cursor.execute(sql, valores)
        except mysql.connector.Error as e:
            # Fallback si tu tabla aún no tiene password_hash/email_verified
            if e.errno in (1054, 1136):  # Columna desconocida / count columnas no coincide
                sql = """
                    INSERT INTO estudiantes
                    (nombre_completo, correo_institucional, numero_control, carrera_actual, otra_carrera, semestre, habilidades, area_interes)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                """
                valores = (
                    data['nombre_completo'],
                    data['correo_institucional'],
                    data['numero_control'],
                    data['carrera_actual'],
                    data.get('otra_carrera', 'No'),
                    data.get('semestre', ''),
                    data.get('habilidades', ''),
                    data.get('area_interes', '')
                )
                cursor.execute(sql, valores)
            else:
                raise

        conn.commit()

        cursor.execute("SELECT LAST_INSERT_ID()")
        r = cursor.fetchone()
        new_id = r[0] if r else None

        cursor.close()
        conn.close()

        return _corsify(JsonResponse({
            'status': 'success',
            'message': '¡Estudiante registrado exitosamente!',
            'id': new_id
        }, status=201))

    except mysql.connector.Error as e:
        return _json_error(f'Error de base de datos: {str(e)}', status=500)
    except Exception as e:
        return _json_error(f'Error interno: {str(e)}', status=500)


@csrf_exempt
def registrar_docente(request):
    pre = _preflight_if_options(request)
    if pre: return pre

    if request.method != 'POST':
        return _json_error('Método no permitido. Usa POST.', status=405)

    try:
        data = json.loads(request.body or '{}')
    except Exception:
        return _json_error('JSON inválido en el cuerpo de la petición', status=400)

    obligatorios = ['nombre_completo', 'correo_institucional', 'carrera_egreso']
    faltante = _required_fields(data, obligatorios)
    if faltante:
        return _json_error(f'Campo obligatorio faltante: {faltante}', status=400)

    pwd = data.get('password')
    pwd2 = data.get('password2')
    pwd_hash = None
    if pwd or pwd2:
        if not pwd or not pwd2:
            return _json_error('Debes proporcionar password y password2', status=400)
        if pwd != pwd2:
            return _json_error('Las contraseñas no coinciden', status=400)
        if len(pwd) < 8:
            return _json_error('La contraseña debe tener al menos 8 caracteres', status=400)
        pwd_hash = make_password(pwd)

    try:
        conn = _conn()
        cursor = conn.cursor()

        try:
            sql = """
                INSERT INTO docentes
                (nombre_completo, correo_institucional, password_hash,
                 carrera_egreso, carreras_imparte, grado_academico,
                 habilidades, logros, email_verified, fecha_registro)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s, %s, NOW())
            """
            valores = (
                data['nombre_completo'],
                data['correo_institucional'],
                pwd_hash,
                data['carrera_egreso'],
                data.get('carreras_imparte', ''),
                data.get('grado_academico', ''),
                data.get('habilidades', ''),
                data.get('logros', ''),
                0
            )
            cursor.execute(sql, valores)
        except mysql.connector.Error as e:
            if e.errno in (1054, 1136):
                sql = """
                    INSERT INTO docentes
                    (nombre_completo, correo_institucional, carrera_egreso, carreras_imparte, grado_academico, habilidades, logros)
                    VALUES (%s,%s,%s,%s,%s,%s,%s)
                """
                valores = (
                    data['nombre_completo'],
                    data['correo_institucional'],
                    data['carrera_egreso'],
                    data.get('carreras_imparte', ''),
                    data.get('grado_academico', ''),
                    data.get('habilidades', ''),
                    data.get('logros', '')
                )
                cursor.execute(sql, valores)
            else:
                raise

        conn.commit()
        cursor.execute("SELECT LAST_INSERT_ID()")
        r = cursor.fetchone()
        new_id = r[0] if r else None

        cursor.close()
        conn.close()

        return _corsify(JsonResponse({
            'status': 'success',
            'message': '¡Docente registrado exitosamente!',
            'id': new_id
        }, status=201))

    except mysql.connector.Error as e:
        return _json_error(f'Error de base de datos: {str(e)}', status=500)
    except Exception as e:
        return _json_error(f'Error interno: {str(e)}', status=500)


@csrf_exempt
def registrar_egresado(request):
    pre = _preflight_if_options(request)
    if pre: return pre

    if request.method != 'POST':
        return _json_error('Método no permitido. Usa POST.', status=405)

    try:
        data = json.loads(request.body or '{}')
    except Exception:
        return _json_error('JSON inválido en el cuerpo de la petición', status=400)

    obligatorios = ['nombre_completo', 'correo_institucional', 'carrera_egreso', 'anio_egreso']
    faltante = _required_fields(data, obligatorios)
    if faltante:
        return _json_error(f'Campo obligatorio faltante: {faltante}', status=400)

    # Validación de año
    try:
        anio_egreso = int(data['anio_egreso'])
        if anio_egreso < 1900 or anio_egreso > 2025:
            return _json_error('El año de egreso debe estar entre 1900 y 2025', status=400)
    except ValueError:
        return _json_error('El año de egreso debe ser un número válido', status=400)

    pwd = data.get('password')
    pwd2 = data.get('password2')
    pwd_hash = None
    if pwd or pwd2:
        if not pwd or not pwd2:
            return _json_error('Debes proporcionar password y password2', status=400)
        if pwd != pwd2:
            return _json_error('Las contraseñas no coinciden', status=400)
        if len(pwd) < 8:
            return _json_error('La contraseña debe tener al menos 8 caracteres', status=400)
        pwd_hash = make_password(pwd)

    try:
        conn = _conn()
        cursor = conn.cursor()

        try:
            sql = """
                INSERT INTO egresados
                (nombre_completo, correo_institucional, password_hash,
                 carrera_egreso, anio_egreso, ocupacion_actual, perfil_linkedin,
                 empresa, puesto, logros, habilidades, competencias,
                 email_verified, fecha_registro)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, %s, NOW())
            """
            valores = (
                data['nombre_completo'],
                data['correo_institucional'],
                pwd_hash,
                data['carrera_egreso'],
                anio_egreso,
                data.get('ocupacion_actual', ''),
                data.get('perfil_linkedin', ''),
                data.get('empresa', ''),
                data.get('puesto', ''),
                data.get('logros', ''),
                data.get('habilidades', ''),
                data.get('competencias', ''),
                0
            )
            cursor.execute(sql, valores)
        except mysql.connector.Error as e:
            if e.errno in (1054, 1136):
                sql = """
                    INSERT INTO egresados
                    (nombre_completo, correo_institucional,
                     carrera_egreso, anio_egreso, ocupacion_actual, perfil_linkedin,
                     empresa, puesto, logros, habilidades, competencias)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """
                valores = (
                    data['nombre_completo'],
                    data['correo_institucional'],
                    data['carrera_egreso'],
                    anio_egreso,
                    data.get('ocupacion_actual', ''),
                    data.get('perfil_linkedin', ''),
                    data.get('empresa', ''),
                    data.get('puesto', ''),
                    data.get('logros', ''),
                    data.get('habilidades', ''),
                    data.get('competencias', '')
                )
                cursor.execute(sql, valores)
            else:
                raise

        conn.commit()
        cursor.execute("SELECT LAST_INSERT_ID()")
        r = cursor.fetchone()
        new_id = r[0] if r else None

        cursor.close()
        conn.close()

        return _corsify(JsonResponse({
            'status': 'success',
            'message': '¡Egresado registrado exitosamente!',
            'id': new_id
        }, status=201))

    except mysql.connector.Error as e:
        return _json_error(f'Error de base de datos: {str(e)}', status=500)
    except Exception as e:
        return _json_error(f'Error interno: {str(e)}', status=500)

# ==========================
# LISTADOS
# ==========================

@csrf_exempt
def listar_estudiantes(request):
    pre = _preflight_if_options(request)
    if pre: return pre
    if request.method != 'GET':
        return _json_error('Método no permitido. Usa GET.', status=405)
    try:
        conn = _conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, numero_control,
                   carrera_actual, otra_carrera, semestre, habilidades, area_interes
            FROM estudiantes
            ORDER BY id DESC
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return _corsify(JsonResponse({'status': 'success', 'data': rows}))
    except Exception as e:
        return _json_error(str(e), status=500)


@csrf_exempt
def listar_docentes(request):
    pre = _preflight_if_options(request)
    if pre: return pre
    if request.method != 'GET':
        return _json_error('Método no permitido. Usa GET.', status=405)
    try:
        conn = _conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, carrera_egreso,
                   carreras_imparte, grado_academico, habilidades, logros
            FROM docentes
            ORDER BY id DESC
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return _corsify(JsonResponse({'status': 'success', 'data': rows}))
    except Exception as e:
        return _json_error(str(e), status=500)


@csrf_exempt
def listar_egresados(request):
    pre = _preflight_if_options(request)
    if pre: return pre
    if request.method != 'GET':
        return _json_error('Método no permitido. Usa GET.', status=405)
    try:
        conn = _conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, carrera_egreso, anio_egreso,
                   ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, competencias
            FROM egresados
            ORDER BY id DESC
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return _corsify(JsonResponse({'status': 'success', 'data': rows}))
    except Exception as e:
        return _json_error(str(e), status=500)

# ==========================
# BÚSQUEDA
# ==========================

def _get_query(request):
    q = request.GET.get('q') or ''
    return unquote(q).strip()

@csrf_exempt
def buscar_estudiantes(request):
    pre = _preflight_if_options(request)
    if pre: return pre
    if request.method != 'GET':
        return _json_error('Método no permitido. Usa GET.', status=405)

    q = _get_query(request)
    try:
        conn = _conn()
        cursor = conn.cursor(dictionary=True)
        if q:
            like = f"%{q}%"
            cursor.execute("""
                SELECT id, nombre_completo, correo_institucional, numero_control,
                       carrera_actual, otra_carrera, semestre, habilidades, area_interes
                FROM estudiantes
                WHERE nombre_completo LIKE %s OR correo_institucional LIKE %s
                      OR numero_control LIKE %s OR carrera_actual LIKE %s
                      OR habilidades LIKE %s OR area_interes LIKE %s
                ORDER BY id DESC
            """, (like, like, like, like, like, like))
        else:
            cursor.execute("""
                SELECT id, nombre_completo, correo_institucional, numero_control,
                       carrera_actual, otra_carrera, semestre, habilidades, area_interes
                FROM estudiantes
                ORDER BY id DESC
            """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return _corsify(JsonResponse({'status': 'success', 'data': rows}))
    except Exception as e:
        return _json_error(str(e), status=500)


@csrf_exempt
def buscar_docentes(request):
    pre = _preflight_if_options(request)
    if pre: return pre
    if request.method != 'GET':
        return _json_error('Método no permitido. Usa GET.', status=405)

    q = _get_query(request)
    try:
        conn = _conn()
        cursor = conn.cursor(dictionary=True)
        if q:
            like = f"%{q}%"
            cursor.execute("""
                SELECT id, nombre_completo, correo_institucional, carrera_egreso,
                       carreras_imparte, grado_academico, habilidades, logros
                FROM docentes
                WHERE nombre_completo LIKE %s OR correo_institucional LIKE %s
                      OR carrera_egreso LIKE %s OR carreras_imparte LIKE %s
                      OR grado_academico LIKE %s OR habilidades LIKE %s OR logros LIKE %s
                ORDER BY id DESC
            """, (like, like, like, like, like, like, like))
        else:
            cursor.execute("""
                SELECT id, nombre_completo, correo_institucional, carrera_egreso,
                       carreras_imparte, grado_academico, habilidades, logros
                FROM docentes
                ORDER BY id DESC
            """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return _corsify(JsonResponse({'status': 'success', 'data': rows}))
    except Exception as e:
        return _json_error(str(e), status=500)


@csrf_exempt
def buscar_egresados(request):
    pre = _preflight_if_options(request)
    if pre: return pre
    if request.method != 'GET':
        return _json_error('Método no permitido. Usa GET.', status=405)

    q = _get_query(request)
    try:
        conn = _conn()
        cursor = conn.cursor(dictionary=True)
        if q:
            like = f"%{q}%"
            cursor.execute("""
                SELECT id, nombre_completo, correo_institucional, carrera_egreso, anio_egreso,
                       ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, competencias
                FROM egresados
                WHERE nombre_completo LIKE %s OR correo_institucional LIKE %s
                      OR carrera_egreso LIKE %s OR ocupacion_actual LIKE %s
                      OR empresa LIKE %s OR puesto LIKE %s
                      OR habilidades LIKE %s OR competencias LIKE %s OR logros LIKE %s
                ORDER BY id DESC
            """, (like, like, like, like, like, like, like, like, like))
        else:
            cursor.execute("""
                SELECT id, nombre_completo, correo_institucional, carrera_egreso, anio_egreso,
                       ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, competencias
                FROM egresados
                ORDER BY id DESC
            """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return _corsify(JsonResponse({'status': 'success', 'data': rows}))
    except Exception as e:
        return _json_error(str(e), status=500)

# ==========================
# PERFILES INDIVIDUALES
# ==========================

@csrf_exempt
def perfil_estudiante(request, estudiante_id):
    pre = _preflight_if_options(request)
    if pre: return pre
    if request.method != 'GET':
        return _json_error('Método no permitido. Usa GET.', status=405)

    try:
        conn = _conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM estudiantes WHERE id = %s", (estudiante_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if row:
            return _corsify(JsonResponse({'status': 'success', 'data': row, 'tipo': 'estudiante'}))
        return _json_error('Estudiante no encontrado', status=404)

    except Exception as e:
        return _json_error(str(e), status=500)


@csrf_exempt
def perfil_docente(request, docente_id):
    pre = _preflight_if_options(request)
    if pre: return pre
    if request.method != 'GET':
        return _json_error('Método no permitido. Usa GET.', status=405)

    try:
        conn = _conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM docentes WHERE id = %s", (docente_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if row:
            return _corsify(JsonResponse({'status': 'success', 'data': row, 'tipo': 'docente'}))
        return _json_error('Docente no encontrado', status=404)

    except Exception as e:
        return _json_error(str(e), status=500)


@csrf_exempt
def perfil_egresado(request, egresado_id):
    pre = _preflight_if_options(request)
    if pre: return pre
    if request.method != 'GET':
        return _json_error('Método no permitido. Usa GET.', status=405)

    try:
        conn = _conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM egresados WHERE id = %s", (egresado_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if row:
            return _corsify(JsonResponse({'status': 'success', 'data': row, 'tipo': 'egresado'}))
        return _json_error('Egresado no encontrado', status=404)

    except Exception as e:
        return _json_error(str(e), status=500)
