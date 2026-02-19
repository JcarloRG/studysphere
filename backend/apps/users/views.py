# apps/users/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.core.files.storage import FileSystemStorage
from django.conf import settings

import os
import json
import random
import string
from datetime import datetime, timedelta
import traceback  # Necesario para tu bloque except

import mysql.connector


# ===================== ELIMINAR PERFILES (DJANGO ORM) =====================

@csrf_exempt
def eliminar_estudiante(request, id):
    """
    Endpoint para eliminar estudiante por ID
    """
    if request.method == 'POST':
        try:
            from .models import Estudiante

            print(f"🗑️ Intentando eliminar estudiante ID: {id}")

            estudiante = Estudiante.objects.get(id=id)
            email = estudiante.correo_institucional
            estudiante.delete()

            print(f"✅ Estudiante {email} eliminado exitosamente")

            return JsonResponse({
                'success': True,
                'message': 'Estudiante eliminado exitosamente',
                'email': email
            })

        except Estudiante.DoesNotExist:
            print(f"❌ Estudiante con ID {id} no encontrado")
            return JsonResponse({
                'success': False,
                'message': 'Estudiante no encontrado'
            }, status=404)

        except Exception as e:
            print(f"❌ Error eliminando estudiante: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error al eliminar estudiante: {str(e)}'
            }, status=500)

    return JsonResponse({
        'success': False,
        'message': 'Método no permitido'
    }, status=405)


@csrf_exempt
def eliminar_docente(request, id):
    """
    Endpoint para eliminar docente por ID
    """
    if request.method == 'POST':
        try:
            from .models import Docente

            print(f"🗑️ Intentando eliminar docente ID: {id}")

            docente = Docente.objects.get(id=id)
            email = docente.correo_institucional
            docente.delete()

            print(f"✅ Docente {email} eliminado exitosamente")

            return JsonResponse({
                'success': True,
                'message': 'Docente eliminado exitosamente',
                'email': email
            })

        except Docente.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Docente no encontrado'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al eliminar docente: {str(e)}'
            }, status=500)

    return JsonResponse({
        'success': False,
        'message': 'Método no permitido'
    }, status=405)


@csrf_exempt
def eliminar_egresado(request, id):
    """
    Endpoint para eliminar egresado por ID
    """
    if request.method == 'POST':
        try:
            from .models import Egresado

            print(f"🗑️ Intentando eliminar egresado ID: {id}")

            egresado = Egresado.objects.get(id=id)
            email = egresado.correo_institucional
            egresado.delete()

            print(f"✅ Egresado {email} eliminado exitosamente")

            return JsonResponse({
                'success': True,
                'message': 'Egresado eliminado exitosamente',
                'email': email
            })

        except Egresado.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Egresado no encontrado'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al eliminar egresado: {str(e)}'
            }, status=500)

    return JsonResponse({
        'success': False,
        'message': 'Método no permitido'
    }, status=405)


# ===================== Health =====================

@csrf_exempt
def health(request):
    return json_ok({'time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')}, "OK")


# ===================== Helpers =====================

def db_conn():
    return mysql.connector.connect(
        host='127.0.0.1',
        user='root',
        password='',
        database='studysphere'
    )


def json_ok(data=None, message=None, status=200):
    resp = JsonResponse({'status': 'success', 'data': data, 'message': message}, status=status)
    resp["Access-Control-Allow-Origin"] = "*"
    resp["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    resp["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return resp


def json_err(message, status=400, extra=None):
    payload = {'status': 'error', 'message': message}
    if extra:
        payload.update(extra)
    resp = JsonResponse(payload, status=status)
    resp["Access-Control-Allow-Origin"] = "*"
    resp["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    resp["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return resp


def allow_options(request):
    if request.method == 'OPTIONS':
        return json_ok({'ok': True})
    return None


def generate_code(n=6):
    return ''.join(random.choices(string.digits, k=n))


def send_verification_email(to_email, code):
    """
    Envía el código de verificación por correo.
    Si no hay credenciales configuradas, no detiene el flujo (solo loguea).
    """
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        print("⚠️ EMAIL_HOST_USER/EMAIL_HOST_PASSWORD no configurados. No se enviará correo real.")
        return False

    subject = "Código de verificación - StudySphere"
    message = (
        "Hola 👋\n\n"
        "Tu código de verificación es: {code}\n\n"
        "Este código vence en 15 minutos.\n\n"
        "Si tú no solicitaste este código, ignora este mensaje.\n\n"
        "StudySphere"
    ).format(code=code)

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER,
            [to_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print("❌ Error enviando email:", str(e))
        return False


# ===================== Storage Helpers =====================

def _estudiante_media_storage():
    """
    Crea un FileSystemStorage apuntando a /media/estudiantes
    """
    base_dir = os.path.join(settings.MEDIA_ROOT, 'estudiantes')
    base_url = settings.MEDIA_URL.rstrip('/') + '/estudiantes/'
    os.makedirs(base_dir, exist_ok=True)
    return FileSystemStorage(location=base_dir, base_url=base_url)


def _docente_media_storage():
    """
    Crea un FileSystemStorage apuntando a /media/docentes
    """
    base_dir = os.path.join(settings.MEDIA_ROOT, 'docentes')
    base_url = settings.MEDIA_URL.rstrip('/') + '/docentes/'
    os.makedirs(base_dir, exist_ok=True)
    return FileSystemStorage(location=base_dir, base_url=base_url)


def _egresado_media_storage():
    """
    Crea un FileSystemStorage apuntando a /media/egresados
    """
    base_dir = os.path.join(settings.MEDIA_ROOT, 'egresados')
    base_url = settings.MEDIA_URL.rstrip('/') + '/egresados/'
    os.makedirs(base_dir, exist_ok=True)
    return FileSystemStorage(location=base_dir, base_url=base_url)


def _parse_request_data(request):
    """
    Parsea datos del request según Content-Type
    Retorna (data, files)
    """
    content_type = request.content_type or ''

    if 'application/json' in content_type:
        data = json.loads(request.body)
        files = {}
    elif 'multipart/form-data' in content_type or 'application/x-www-form-urlencoded' in content_type:
        data = request.POST.dict()
        files = request.FILES
    else:
        raise ValueError('Content-Type no soportado. Use JSON o form-data.')

    return data, files


# ===================== LOGIN =====================

@csrf_exempt
def login_user(request):
    print("🔑 LOGIN USER - Endpoint llamado")
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data = json.loads(request.body or "{}")
        email = (data.get('correo_institucional') or '').strip().lower()
        password = data.get('password')

        if not email or not password:
            return json_err('Correo y contraseña son requeridos.', 400)

        conn = db_conn()
        cursor = conn.cursor(dictionary=True)
        user_info = None

        tablas = {
            'estudiantes': 'estudiante',
            'docentes': 'docente',
            'egresados': 'egresado'
        }

        for tabla, tipo in tablas.items():
            sql = f"""
            SELECT id, nombre_completo, correo_institucional, email_verified, foto
            FROM {tabla}
            WHERE LOWER(correo_institucional)=%s AND password_hash=SHA2(%s, 256)
            LIMIT 1
            """
            cursor.execute(sql, (email, password))
            row = cursor.fetchone()

            if row:
                user_info = {
                    'perfil_id': row['id'],
                    'nombre_completo': row['nombre_completo'],
                    'correo_institucional': row['correo_institucional'],
                    'tipo': tipo,
                    'email_verified': bool(row['email_verified']),
                    'foto': row['foto'] or '/static/images/default-avatar.png'
                }
                break

        cursor.close()
        conn.close()

        if user_info:
            print(f"✅ Usuario {email} ({user_info['tipo']}) inició sesión.")
            return json_ok(user_info, 'Inicio de sesión exitoso.')
        else:
            print(f"❌ Intento fallido de login para {email}.")
            return json_err('Correo o contraseña incorrectos.', 401)

    except mysql.connector.Error as e:
        print("❌ ERROR MySQL en login:", str(e))
        return json_err(f'Error de base de datos: {str(e)}', 500)
    except Exception as e:
        print("❌ ERROR general en login:", str(e))
        print("Traceback:", traceback.format_exc())
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== ESTUDIANTES =====================

@csrf_exempt
def registrar_estudiante(request):
    print("🎯 REGISTRAR ESTUDIANTE - Endpoint llamado")
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data, files = _parse_request_data(request)
        print("📝 Datos estudiante recibidos:", data)

        campos = ['nombre_completo', 'correo_institucional', 'numero_control', 'carrera_actual', 'password']
        for c in campos:
            if not data.get(c):
                return json_err(f'Campo obligatorio faltante: {c}', 400)

        conn = db_conn()
        cursor = conn.cursor()

        foto_url = None
        if 'foto' in files:
            foto = files['foto']
            if foto.size > 3 * 1024 * 1024:
                return json_err('La imagen no debe superar 3MB.', 400)

            fs = _estudiante_media_storage()
            base, ext = os.path.splitext(foto.name)
            safe_name = f"est_temp_{int(datetime.now().timestamp())}{ext.lower()}"
            filename = fs.save(safe_name, foto)
            foto_url = fs.url(filename)

        sql = """
        INSERT INTO estudiantes
        (nombre_completo, correo_institucional, password_hash, numero_control, carrera_actual, otra_carrera, semestre, habilidades, area_interes, foto)
        VALUES (%s,%s, SHA2(%s, 256), %s,%s,%s,%s,%s,%s,%s)
        """
        valores = (
            data['nombre_completo'],
            data['correo_institucional'],
            data['password'],
            data['numero_control'],
            data['carrera_actual'],
            data.get('otra_carrera', 'No'),
            data.get('semestre', ''),
            data.get('habilidades', ''),
            data.get('area_interes', ''),
            foto_url
        )
        cursor.execute(sql, valores)
        conn.commit()

        cursor.execute("SELECT LAST_INSERT_ID()")
        estudiante_id = cursor.fetchone()[0]

        if foto_url and 'foto' in files:
            foto = files['foto']
            base, ext = os.path.splitext(foto.name)
            new_name = f"est_{estudiante_id}_{int(datetime.now().timestamp())}{ext.lower()}"
            fs = _estudiante_media_storage()
            old_path = fs.path(os.path.basename(foto_url))
            new_path = fs.path(new_name)

            if os.path.exists(old_path):
                os.rename(old_path, new_path)

            new_url = fs.url(new_name)
            cursor.execute("UPDATE estudiantes SET foto=%s WHERE id=%s", (new_url, estudiante_id))
            conn.commit()
            foto_url = new_url

        code = generate_code(6)
        now = datetime.now()
        exp = now + timedelta(minutes=15)
        cursor.execute("""
            INSERT INTO email_verifications (email, code, tipo, perfil_id, is_used, created_at, expires_at)
            VALUES (%s,%s,'estudiante',%s,0,%s,%s)
        """, (data['correo_institucional'], code, estudiante_id, now, exp))
        conn.commit()

        send_verification_email(data['correo_institucional'], code)

        cursor.close()
        conn.close()

        return json_ok({
            'id': estudiante_id,
            'foto': foto_url or '/static/images/default-avatar.png'
        }, '¡Estudiante registrado! Revisa tu correo para el código.', 201)

    except mysql.connector.Error as e:
        print("❌ ERROR MySQL:", str(e))
        return json_err(f'Error de base de datos: {str(e)}', 500)
    except Exception as e:
        print("❌ ERROR general:", str(e))
        print("Traceback:", traceback.format_exc())
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== DOCENTES =====================

@csrf_exempt
def registrar_docente(request):
    print("🎯 REGISTRAR DOCENTE - Endpoint llamado")
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data, files = _parse_request_data(request)
        print("📝 Datos docente recibidos:", data)

        campos = ['nombre_completo', 'correo_institucional', 'carrera_egreso', 'password']
        for c in campos:
            if not data.get(c):
                return json_err(f'Campo obligatorio faltante: {c}', 400)

        conn = db_conn()
        cursor = conn.cursor()

        foto_url = None
        if 'foto' in files:
            foto = files['foto']
            if foto.size > 3 * 1024 * 1024:
                return json_err('La imagen no debe superar 3MB.', 400)

            fs = _docente_media_storage()
            base, ext = os.path.splitext(foto.name)
            safe_name = f"doc_temp_{int(datetime.now().timestamp())}{ext.lower()}"
            filename = fs.save(safe_name, foto)
            foto_url = fs.url(filename)

        sql = """
        INSERT INTO docentes
        (nombre_completo, correo_institucional, password_hash, carrera_egreso, carreras_imparte, grado_academico, habilidades, logros, foto)
        VALUES (%s,%s, SHA2(%s, 256), %s,%s,%s,%s,%s,%s)
        """
        valores = (
            data['nombre_completo'],
            data['correo_institucional'],
            data['password'],
            data['carrera_egreso'],
            data.get('carreras_imparte', ''),
            data.get('grado_academico', ''),
            data.get('habilidades', ''),
            data.get('logros', ''),
            foto_url
        )
        cursor.execute(sql, valores)
        conn.commit()

        cursor.execute("SELECT LAST_INSERT_ID()")
        docente_id = cursor.fetchone()[0]

        if foto_url and 'foto' in files:
            foto = files['foto']
            base, ext = os.path.splitext(foto.name)
            new_name = f"doc_{docente_id}_{int(datetime.now().timestamp())}{ext.lower()}"
            fs = _docente_media_storage()
            old_path = fs.path(os.path.basename(foto_url))
            new_path = fs.path(new_name)

            if os.path.exists(old_path):
                os.rename(old_path, new_path)

            new_url = fs.url(new_name)
            cursor.execute("UPDATE docentes SET foto=%s WHERE id=%s", (new_url, docente_id))
            conn.commit()
            foto_url = new_url

        code = generate_code(6)
        now = datetime.now()
        exp = now + timedelta(minutes=15)
        cursor.execute("""
            INSERT INTO email_verifications (email, code, tipo, perfil_id, is_used, created_at, expires_at)
            VALUES (%s,%s,'docente',%s,0,%s,%s)
        """, (data['correo_institucional'], code, docente_id, now, exp))
        conn.commit()

        send_verification_email(data['correo_institucional'], code)

        cursor.close()
        conn.close()

        return json_ok({
            'id': docente_id,
            'foto': foto_url or '/static/images/default-avatar.png'
        }, '¡Docente registrado! Revisa tu correo para el código.', 201)

    except mysql.connector.Error as e:
        print("❌ ERROR MySQL:", str(e))
        return json_err(f'Error de base de datos: {str(e)}', 500)
    except Exception as e:
        print("❌ ERROR general:", str(e))
        print("Traceback:", traceback.format_exc())
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== EGRESADOS =====================

@csrf_exempt
def registrar_egresado(request):
    print("🎯 REGISTRAR EGRESADO - Endpoint llamado")
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data, files = _parse_request_data(request)
        print("📝 Datos egresado recibidos:", data)

        campos = ['nombre_completo', 'correo_institucional', 'carrera_egreso', 'anio_egreso', 'password']
        for c in campos:
            if not data.get(c):
                return json_err(f'Campo obligatorio faltante: {c}', 400)

        anio = int(data['anio_egreso'])
        if anio < 1900 or anio > 2100:
            return json_err('Año de egreso inválido', 400)

        conn = db_conn()
        cursor = conn.cursor()

        foto_url = None
        if 'foto' in files:
            foto = files['foto']
            if foto.size > 3 * 1024 * 1024:
                return json_err('La imagen no debe superar 3MB.', 400)

            fs = _egresado_media_storage()
            base, ext = os.path.splitext(foto.name)
            safe_name = f"egr_temp_{int(datetime.now().timestamp())}{ext.lower()}"
            filename = fs.save(safe_name, foto)
            foto_url = fs.url(filename)

        sql = """
        INSERT INTO egresados
        (nombre_completo, correo_institucional, password_hash, carrera_egreso, anio_egreso, ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, competencias, foto)
        VALUES (%s,%s, SHA2(%s, 256), %s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """
        valores = (
            data['nombre_completo'],
            data['correo_institucional'],
            data['password'],
            data['carrera_egreso'],
            anio,
            data.get('ocupacion_actual', ''),
            data.get('perfil_linkedin', ''),
            data.get('empresa', ''),
            data.get('puesto', ''),
            data.get('logros', ''),
            data.get('habilidades', ''),
            data.get('competencias', ''),
            foto_url
        )
        cursor.execute(sql, valores)
        conn.commit()

        cursor.execute("SELECT LAST_INSERT_ID()")
        egresado_id = cursor.fetchone()[0]

        if foto_url and 'foto' in files:
            foto = files['foto']
            base, ext = os.path.splitext(foto.name)
            new_name = f"egr_{egresado_id}_{int(datetime.now().timestamp())}{ext.lower()}"
            fs = _egresado_media_storage()
            old_path = fs.path(os.path.basename(foto_url))
            new_path = fs.path(new_name)

            if os.path.exists(old_path):
                os.rename(old_path, new_path)

            new_url = fs.url(new_name)
            cursor.execute("UPDATE egresados SET foto=%s WHERE id=%s", (new_url, egresado_id))
            conn.commit()
            foto_url = new_url

        code = generate_code(6)
        now = datetime.now()
        exp = now + timedelta(minutes=15)
        cursor.execute("""
            INSERT INTO email_verifications (email, code, tipo, perfil_id, is_used, created_at, expires_at)
            VALUES (%s,%s,'egresado',%s,0,%s,%s)
        """, (data['correo_institucional'], code, egresado_id, now, exp))
        conn.commit()

        send_verification_email(data['correo_institucional'], code)

        cursor.close()
        conn.close()

        return json_ok({
            'id': egresado_id,
            'foto': foto_url or '/static/images/default-avatar.png'
        }, '¡Egresado registrado! Revisa tu correo para el código.', 201)

    except mysql.connector.Error as e:
        print("❌ ERROR MySQL:", str(e))
        return json_err(f'Error de base de datos: {str(e)}', 500)
    except Exception as e:
        print("❌ ERROR general:", str(e))
        print("Traceback:", traceback.format_exc())
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== LISTADOS (MODIFICADO para exclusión) =====================

def listar_estudiantes(request):
    if request.method != 'GET':
        return json_err('Método no permitido', 405)

    exclude_id = request.GET.get('exclude_id')

    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)

        sql = """
            SELECT id, nombre_completo, correo_institucional, numero_control, carrera_actual, 
                   otra_carrera, semestre, habilidades, area_interes, fecha_registro, 
                   COALESCE(foto, '/static/images/default-avatar.png') as foto
            FROM estudiantes
        """
        params = []

        if exclude_id and exclude_id.isdigit():
            sql += " WHERE id != %s "
            params.append(exclude_id)

        sql += " ORDER BY id DESC"

        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return json_ok(rows)
    except Exception as e:
        return json_err(str(e), 500)


def listar_docentes(request):
    if request.method != 'GET':
        return json_err('Método no permitido', 405)

    exclude_id = request.GET.get('exclude_id')

    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)

        sql = """
            SELECT id, nombre_completo, correo_institucional, carrera_egreso, 
                   carreras_imparte, grado_academico, habilidades, logros, fecha_registro,
                   COALESCE(foto, '/static/images/default-avatar.png') as foto
            FROM docentes
        """
        params = []

        if exclude_id and exclude_id.isdigit():
            sql += " WHERE id != %s "
            params.append(exclude_id)

        sql += " ORDER BY id DESC"

        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return json_ok(rows)
    except Exception as e:
        return json_err(str(e), 500)


def listar_egresados(request):
    if request.method != 'GET':
        return json_err('Método no permitido', 405)

    exclude_id = request.GET.get('exclude_id')

    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)

        sql = """
            SELECT id, nombre_completo, correo_institucional, carrera_egreso, anio_egreso,
                   ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, 
                   competencias, fecha_registro,
                   COALESCE(foto, '/static/images/default-avatar.png') as foto
            FROM egresados
        """
        params = []

        if exclude_id and exclude_id.isdigit():
            sql += " WHERE id != %s "
            params.append(exclude_id)

        sql += " ORDER BY id DESC"

        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return json_ok(rows)
    except Exception as e:
        return json_err(str(e), 500)


# ===================== PERFILES =====================

@csrf_exempt
def perfil_estudiante(request, estudiante_id):
    opt = allow_options(request)
    if opt:
        return opt
    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, numero_control, carrera_actual,
                   otra_carrera, semestre, habilidades, area_interes, fecha_registro, 
                   COALESCE(foto, '/static/images/default-avatar.png') as foto
            FROM estudiantes WHERE id=%s
        """, (estudiante_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if not row:
            return json_err('Estudiante no encontrado', 404)
        return json_ok(row, None, 200)
    except Exception as e:
        return json_err(str(e), 500)


@csrf_exempt
def perfil_docente(request, docente_id):
    opt = allow_options(request)
    if opt:
        return opt
    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, carrera_egreso,
                   carreras_imparte, grado_academico, habilidades, logros, fecha_registro,
                   COALESCE(foto, '/static/images/default-avatar.png') as foto
            FROM docentes WHERE id=%s
        """, (docente_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if not row:
            return json_err('Docente no encontrado', 404)
        return json_ok(row, None, 200)
    except Exception as e:
        return json_err(str(e), 500)


@csrf_exempt
def perfil_egresado(request, egresado_id):
    opt = allow_options(request)
    if opt:
        return opt
    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, carrera_egreso, anio_egreso,
                   ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, 
                   competencias, fecha_registro,
                   COALESCE(foto, '/static/images/default-avatar.png') as foto
            FROM egresados WHERE id=%s
        """, (egresado_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if not row:
            return json_err('Egresado no encontrado', 404)
        return json_ok(row, None, 200)
    except Exception as e:
        return json_err(str(e), 500)


# ===================== FOTO DE USUARIOS =====================
# ===================== ACTUALIZAR FOTOS =====================

@csrf_exempt
def actualizar_foto_estudiante(request, estudiante_id):
    """
    POST multipart/form-data con campo 'foto'
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        if 'foto' not in request.FILES:
            return json_err('Archivo "foto" no enviado', 400)

        foto = request.FILES['foto']
        if foto.size > 3 * 1024 * 1024:
            return json_err('La imagen no debe superar 3MB.', 400)

        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        file_ext = os.path.splitext(foto.name)[1].lower()
        if file_ext not in allowed_extensions:
            return json_err('Solo se permiten imágenes JPG, PNG o GIF.', 400)

        fs = _estudiante_media_storage()
        base, ext = os.path.splitext(foto.name)
        safe_name = f"est_{estudiante_id}_{int(datetime.now().timestamp())}{ext.lower()}"
        filename = fs.save(safe_name, foto)
        rel_url = fs.url(filename)

        conn = db_conn()
        cur = conn.cursor()
        cur.execute("UPDATE estudiantes SET foto=%s WHERE id=%s", (rel_url, estudiante_id))
        conn.commit()
        cur.close()
        conn.close()

        return json_ok({'foto': rel_url}, 'Foto actualizada correctamente', 200)

    except Exception as e:
        print("❌ actualizar_foto_estudiante error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def actualizar_foto_docente(request, docente_id):
    """
    POST multipart/form-data con campo 'foto'
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        if 'foto' not in request.FILES:
            return json_err('Archivo "foto" no enviado', 400)

        foto = request.FILES['foto']
        if foto.size > 3 * 1024 * 1024:
            return json_err('La imagen no debe superar 3MB.', 400)

        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        file_ext = os.path.splitext(foto.name)[1].lower()
        if file_ext not in allowed_extensions:
            return json_err('Solo se permiten imágenes JPG, PNG o GIF.', 400)

        fs = _docente_media_storage()
        base, ext = os.path.splitext(foto.name)
        safe_name = f"doc_{docente_id}_{int(datetime.now().timestamp())}{ext.lower()}"
        filename = fs.save(safe_name, foto)
        rel_url = fs.url(filename)

        conn = db_conn()
        cur = conn.cursor()
        cur.execute("UPDATE docentes SET foto=%s WHERE id=%s", (rel_url, docente_id))
        conn.commit()
        cur.close()
        conn.close()

        return json_ok({'foto': rel_url}, 'Foto actualizada correctamente', 200)

    except Exception as e:
        print("❌ actualizar_foto_docente error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def actualizar_foto_egresado(request, egresado_id):
    """
    POST multipart/form-data con campo 'foto'
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        if 'foto' not in request.FILES:
            return json_err('Archivo "foto" no enviado', 400)

        foto = request.FILES['foto']
        if foto.size > 3 * 1024 * 1024:
            return json_err('La imagen no debe superar 3MB.', 400)

        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        file_ext = os.path.splitext(foto.name)[1].lower()
        if file_ext not in allowed_extensions:
            return json_err('Solo se permiten imágenes JPG, PNG o GIF.', 400)

        fs = _egresado_media_storage()
        base, ext = os.path.splitext(foto.name)
        safe_name = f"egr_{egresado_id}_{int(datetime.now().timestamp())}{ext.lower()}"
        filename = fs.save(safe_name, foto)
        rel_url = fs.url(filename)

        conn = db_conn()
        cur = conn.cursor()
        cur.execute("UPDATE egresados SET foto=%s WHERE id=%s", (rel_url, egresado_id))
        conn.commit()
        cur.close()
        conn.close()

        return json_ok({'foto': rel_url}, 'Foto actualizada correctamente', 200)

    except Exception as e:
        print("❌ actualizar_foto_egresado error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== ELIMINAR FOTOS =====================

@csrf_exempt
def eliminar_foto_estudiante(request, estudiante_id):
    """
    POST para eliminar foto de estudiante (restablecer a default)
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        conn = db_conn()
        cur = conn.cursor()

        cur.execute("SELECT foto FROM estudiantes WHERE id=%s", (estudiante_id,))
        result = cur.fetchone()

        if result and result[0]:
            foto_actual = result[0]
            try:
                if foto_actual.startswith('/media/'):
                    file_path = os.path.join(settings.MEDIA_ROOT, foto_actual.replace('/media/', ''))
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"🗑️ Archivo eliminado: {file_path}")
            except Exception as file_error:
                print(f"⚠️ Error eliminando archivo: {file_error}")

        cur.execute("UPDATE estudiantes SET foto=NULL WHERE id=%s", (estudiante_id,))
        conn.commit()
        cur.close()
        conn.close()

        return json_ok(
            {'foto': '/static/images/default-avatar.png'},
            'Foto eliminada. Se ha restablecido la imagen por defecto.',
            200
        )

    except Exception as e:
        print("❌ eliminar_foto_estudiante error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def eliminar_foto_docente(request, docente_id):
    """
    POST para eliminar foto de docente (restablecer a default)
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        conn = db_conn()
        cur = conn.cursor()

        cur.execute("SELECT foto FROM docentes WHERE id=%s", (docente_id,))
        result = cur.fetchone()

        if result and result[0]:
            foto_actual = result[0]
            try:
                if foto_actual.startswith('/media/'):
                    file_path = os.path.join(settings.MEDIA_ROOT, foto_actual.replace('/media/', ''))
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"🗑️ Archivo eliminado: {file_path}")
            except Exception as file_error:
                print(f"⚠️ Error eliminando archivo: {file_error}")

        cur.execute("UPDATE docentes SET foto=NULL WHERE id=%s", (docente_id,))
        conn.commit()
        cur.close()
        conn.close()

        return json_ok(
            {'foto': '/static/images/default-avatar.png'},
            'Foto eliminada. Se ha restablecido la imagen por defecto.',
            200
        )

    except Exception as e:
        print("❌ eliminar_foto_docente error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def eliminar_foto_egresado(request, egresado_id):
    """
    POST para eliminar foto de egresado (restablecer a default)
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        conn = db_conn()
        cur = conn.cursor()

        cur.execute("SELECT foto FROM egresados WHERE id=%s", (egresado_id,))
        result = cur.fetchone()

        if result and result[0]:
            foto_actual = result[0]
            try:
                if foto_actual.startswith('/media/'):
                    file_path = os.path.join(settings.MEDIA_ROOT, foto_actual.replace('/media/', ''))
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"🗑️ Archivo eliminado: {file_path}")
            except Exception as file_error:
                print(f"⚠️ Error eliminando archivo: {file_error}")

        cur.execute("UPDATE egresados SET foto=NULL WHERE id=%s", (egresado_id,))
        conn.commit()
        cur.close()
        conn.close()

        return json_ok(
            {'foto': '/static/images/default-avatar.png'},
            'Foto eliminada. Se ha restablecido la imagen por defecto.',
            200
        )

    except Exception as e:
        print("❌ eliminar_foto_egresado error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== VERIFICACIÓN DE EMAIL =====================

@csrf_exempt
def request_email_code(request):
    """Enviar / reenviar código de verificación"""
    print("📨 REQUEST EMAIL CODE")
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data = json.loads(request.body or "{}")
        email = (data.get('email') or '').strip().lower()
        tipo = (data.get('tipo') or 'estudiante').strip().lower()
        perfil_id = data.get('perfil_id')
        purpose = (data.get('purpose') or 'signup').strip()

        if not email:
            return json_err('email es requerido', 400)

        conn = db_conn()
        cursor = conn.cursor()

        cursor.execute("UPDATE email_verifications SET is_used=1 WHERE email=%s AND is_used=0", (email,))
        conn.commit()

        code = generate_code(6)
        now = datetime.now()
        exp = now + timedelta(minutes=15)

        cursor.execute("""
            INSERT INTO email_verifications (email, code, tipo, perfil_id, purpose, is_used, created_at, expires_at)
            VALUES (%s,%s,%s,%s,%s,0,%s,%s)
        """, (email, code, tipo, perfil_id, purpose, now, exp))
        conn.commit()

        ok = send_verification_email(email, code)
        if not ok:
            print("⚠️ No se pudo enviar el correo (SMTP). Se guardó el código igualmente.")

        cursor.close()
        conn.close()

        return json_ok({'email': email}, "Código enviado. Revisa tu correo.")

    except Exception as e:
        print("❌ request_email_code error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def verify_email_code(request):
    """Validar código de verificación"""
    print("✅ VERIFY EMAIL CODE")
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data = json.loads(request.body or "{}")
        email = (data.get('email') or '').strip().lower()
        code = (data.get('code') or '').strip()

        if not email or not code:
            return json_err('email y code son requeridos', 400)

        now = datetime.now()

        conn = db_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM email_verifications
            WHERE LOWER(email)=%s AND code=%s
            ORDER BY id DESC
            LIMIT 1
        """, (email, code))
        row = cursor.fetchone()

        if not row:
            cursor.close()
            conn.close()
            return json_err('Código inválido.', 400)

        if int(row.get('is_used', 0)) == 1:
            cursor.close()
            conn.close()
            return json_err('El código ya fue utilizado. Solicita uno nuevo.', 400)

        if row.get('expires_at') and now >= row['expires_at']:
            cursor.close()
            conn.close()
            return json_err('El código ha expirado. Solicita uno nuevo.', 400)

        cursor2 = conn.cursor()
        cursor2.execute("UPDATE email_verifications SET is_used=1, verified=1 WHERE id=%s", (row['id'],))
        conn.commit()
        cursor2.close()

        perfil_id = row.get('perfil_id')
        tipo = (row.get('tipo') or '').strip().lower()
        if perfil_id and tipo in ('estudiante', 'docente', 'egresado'):
            tabla = 'estudiantes' if tipo == 'estudiante' else ('docentes' if tipo == 'docente' else 'egresados')
            cursor3 = conn.cursor()
            cursor3.execute(f"UPDATE {tabla} SET email_verified=1, verified_at=%s WHERE id=%s", (now, perfil_id))
            conn.commit()
            cursor3.close()

        cursor.close()
        conn.close()

        return json_ok(
            {'email': email, 'perfil_id': perfil_id, 'tipo': tipo},
            "Correo verificado correctamente."
        )

    except Exception as e:
        print("❌ verify_email_code error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== MATCHES USUARIO ↔ USUARIO (USANDO TABLA EXISTENTE) =====================

def _normalizar_tipo_usuario(tipo):
    tipo = (tipo or '').strip().lower()
    if tipo not in ('estudiante', 'docente', 'egresado'):
        return None
    return tipo


@csrf_exempt
def matches_solicitar(request):
    """
    Crea/actualiza una solicitud de match entre el usuario origen y el perfil objetivo.
    Usa la tabla:
      id, usuario_id, usuario_tipo, perfil_match_id, perfil_match_tipo,
      compatibilidad, estado, fecha_match, fecha_actualizacion
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data = json.loads(request.body or "{}")

        # usuario que está logueado (origen)
        usuario_id = data.get('origen_id')
        usuario_tipo = _normalizar_tipo_usuario(data.get('origen_tipo'))

        # perfil al que quiere hacer match
        perfil_id = data.get('perfil_id')
        perfil_tipo = _normalizar_tipo_usuario(data.get('tipo_perfil'))

        # compatibilidad opcional (si no llega, la calculamos al azar 70–99)
        compat = data.get('compatibilidad')
        if compat is None:
            compat = random.randint(70, 99)

        if not usuario_id or not usuario_tipo:
            return json_err('Faltan origen_id / origen_tipo en el cuerpo.', 400)
        if not perfil_id or not perfil_tipo:
            return json_err('Faltan perfil_id / tipo_perfil en el cuerpo.', 400)

        usuario_id = int(usuario_id)
        perfil_id = int(perfil_id)

        if usuario_id == perfil_id and usuario_tipo == perfil_tipo:
            return json_err('No puedes hacer match contigo mismo.', 400)

        conn = db_conn()
        cur = conn.cursor(dictionary=True)
        now = datetime.now()

        # ¿Ya hay relación en algún sentido?
        cur.execute("""
            SELECT *
            FROM matches
            WHERE
              (usuario_id=%s AND usuario_tipo=%s AND perfil_match_id=%s AND perfil_match_tipo=%s)
              OR
              (usuario_id=%s AND usuario_tipo=%s AND perfil_match_id=%s AND perfil_match_tipo=%s)
            LIMIT 1
        """, (
            usuario_id, usuario_tipo, perfil_id, perfil_tipo,
            perfil_id, perfil_tipo, usuario_id, usuario_tipo
        ))
        row = cur.fetchone()

        if row:
            # Si ya estaba aceptado, lo decimos
            if row['estado'] == 'aceptado':
                cur.close(); conn.close()
                return json_ok(
                    {'match_id': row['id'], 'estado': 'aceptado'},
                    'Ya existe un match aceptado con esta persona.'
                )

            # Si existía pendiente/rechazado → lo dejamos en pendiente otra vez y
            # actualizamos compatibilidad
            cur2 = conn.cursor()
            cur2.execute("""
                UPDATE matches
                SET estado=%s,
                    compatibilidad=%s,
                    fecha_actualizacion=%s
                WHERE id=%s
            """, ('pendiente', compat, now, row['id']))
            conn.commit()
            match_id = row['id']
            estado = 'pendiente'
            cur2.close()
        else:
            # Crear nuevo registro
            cur2 = conn.cursor()
            cur2.execute("""
                INSERT INTO matches
                    (usuario_id, usuario_tipo, perfil_match_id, perfil_match_tipo,
                     compatibilidad, estado, fecha_match, fecha_actualizacion)
                VALUES (%s,%s,%s,%s,%s,'pendiente',%s,%s)
            """, (usuario_id, usuario_tipo, perfil_id, perfil_tipo,
                  compat, now, now))
            conn.commit()
            match_id = cur2.lastrowid
            estado = 'pendiente'
            cur2.close()

        cur.close()
        conn.close()

        return json_ok(
            {'match_id': match_id, 'estado': estado, 'compatibilidad': compat},
            'Solicitud de colaboración registrada correctamente.'
        )

    except Exception as e:
        print("❌ matches_solicitar error:", str(e))
        import traceback
        print(traceback.format_exc())
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def matches_aceptar(request):
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data = json.loads(request.body or "{}")
        match_id = data.get('match_id')

        if not match_id:
            return json_err('match_id es requerido', 400)

        now = datetime.now()
        conn = db_conn()
        cur = conn.cursor()
        cur.execute("""
            UPDATE matches
            SET estado='aceptado',
                fecha_actualizacion=%s
            WHERE id=%s
        """, (now, match_id))
        conn.commit()
        cur.close(); conn.close()

        return json_ok({'match_id': match_id, 'estado': 'aceptado'}, 'Match aceptado correctamente.')

    except Exception as e:
        print("❌ matches_aceptar error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def matches_rechazar(request):
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data = json.loads(request.body or "{}")
        match_id = data.get('match_id')

        if not match_id:
            return json_err('match_id es requerido', 400)

        now = datetime.now()
        conn = db_conn()
        cur = conn.cursor()
        cur.execute("""
            UPDATE matches
            SET estado='rechazado',
                fecha_actualizacion=%s
            WHERE id=%s
        """, (now, match_id))
        conn.commit()
        cur.close(); conn.close()

        return json_ok({'match_id': match_id, 'estado': 'rechazado'}, 'Match rechazado.')

    except Exception as e:
        print("❌ matches_rechazar error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def matches_estado(request, perfil_id):
    """
    Devuelve el estado de match entre:
      - el usuario origen (query params: origen_id, origen_tipo)
      - el perfil objetivo (perfil_id de la URL + tipo_perfil en query)
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'GET':
        return json_err('Método no permitido. Usa GET.', 405)

    try:
        origen_id = request.GET.get('origen_id')
        origen_tipo = _normalizar_tipo_usuario(request.GET.get('origen_tipo'))
        tipo_perfil = _normalizar_tipo_usuario(request.GET.get('tipo_perfil'))

        if not origen_id or not origen_tipo or not tipo_perfil:
            return json_err('Se requieren origen_id, origen_tipo y tipo_perfil.', 400)

        origen_id = int(origen_id)
        objetivo_id = int(perfil_id)

        conn = db_conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT *
            FROM matches
            WHERE
              (usuario_id=%s AND usuario_tipo=%s AND perfil_match_id=%s AND perfil_match_tipo=%s)
              OR
              (usuario_id=%s AND usuario_tipo=%s AND perfil_match_id=%s AND perfil_match_tipo=%s)
            LIMIT 1
        """, (
            origen_id, origen_tipo, objetivo_id, tipo_perfil,
            objetivo_id, tipo_perfil, origen_id, origen_tipo
        ))
        row = cur.fetchone()
        cur.close(); conn.close()

        if not row:
            return json_ok({'estado': 'no_match'}, 'No existe match entre estos perfiles.')

        return json_ok(
            {
                'estado': row['estado'],
                'match_id': row['id'],
                'compatibilidad': row.get('compatibilidad')
            },
            'Estado de match obtenido.'
        )

    except Exception as e:
        print("❌ matches_estado error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def matches_mis_matches(request):
    """
    Devuelve todos los matches aceptados de un usuario:
      GET /api/matches/mis-matches/?origen_id=1&origen_tipo=estudiante
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'GET':
        return json_err('Método no permitido. Usa GET.', 405)

    try:
        origen_id = request.GET.get('origen_id')
        origen_tipo = _normalizar_tipo_usuario(request.GET.get('origen_tipo'))

        if not origen_id or not origen_tipo:
            return json_err('Se requieren origen_id y origen_tipo.', 400)

        origen_id = int(origen_id)

        conn = db_conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT *
            FROM matches
            WHERE estado='aceptado' AND (
              (usuario_id=%s AND usuario_tipo=%s) OR
              (perfil_match_id=%s AND perfil_match_tipo=%s)
            )
            ORDER BY fecha_actualizacion DESC
        """, (origen_id, origen_tipo, origen_id, origen_tipo))
        rows = cur.fetchall()
        cur.close(); conn.close()

        return json_ok(rows, 'Matches obtenidos correctamente.')

    except Exception as e:
        print("❌ matches_mis_matches error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)

# ===================== MATCHES POTENCIALES =====================

@csrf_exempt
def matches_potenciales(request):
    """
    Devuelve una lista de perfiles que podrían ser match potencial.

    Endpoint:
      GET /api/matches/potenciales/?origen_id=1&origen_tipo=estudiante

    - origen_id: ID del usuario logueado
    - origen_tipo: 'estudiante' | 'docente' | 'egresado'
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'GET':
        return json_err('Método no permitido. Usa GET.', 405)

    try:
        origen_id = request.GET.get('origen_id')
        origen_tipo = _normalizar_tipo_usuario(request.GET.get('origen_tipo'))

        conn = db_conn()
        cur = conn.cursor(dictionary=True)

        candidatos = []

        # --- Estudiantes ---
        cur.execute("""
            SELECT 
                id,
                'estudiante' AS tipo,
                nombre_completo,
                correo_institucional,
                carrera_actual AS carrera,
                habilidades,
                area_interes,
                COALESCE(foto, '/static/images/default-avatar.png') AS foto
            FROM estudiantes
            ORDER BY id DESC
            LIMIT 50
        """)
        candidatos.extend(cur.fetchall())

        # --- Docentes ---
        cur.execute("""
            SELECT 
                id,
                'docente' AS tipo,
                nombre_completo,
                correo_institucional,
                carrera_egreso AS carrera,
                habilidades,
                logros AS area_interes,
                COALESCE(foto, '/static/images/default-avatar.png') AS foto
            FROM docentes
            ORDER BY id DESC
            LIMIT 50
        """)
        candidatos.extend(cur.fetchall())

        # --- Egresados ---
        cur.execute("""
            SELECT 
                id,
                'egresado' AS tipo,
                nombre_completo,
                correo_institucional,
                carrera_egreso AS carrera,
                habilidades,
                competencias AS area_interes,
                COALESCE(foto, '/static/images/default-avatar.png') AS foto
            FROM egresados
            ORDER BY id DESC
            LIMIT 50
        """)
        candidatos.extend(cur.fetchall())

        cur.close()
        conn.close()

        # Si tenemos info del origen, excluimos su propio perfil
        if origen_id and origen_tipo:
            try:
                origen_id_int = int(origen_id)
                candidatos = [
                    c for c in candidatos
                    if not (c['tipo'] == origen_tipo and int(c['id']) == origen_id_int)
                ]
            except ValueError:
                pass

        # Revolvemos un poco para que no siempre salgan igual
        random.shuffle(candidatos)

        return json_ok(candidatos, 'Matches potenciales obtenidos correctamente.')

    except Exception as e:
        print("❌ matches_potenciales error:", str(e))
        import traceback
        print(traceback.format_exc())
        return json_err(f'Error interno: {str(e)}', 500)

# ===================== PROYECTOS =====================

@csrf_exempt
def proyectos_list(request):
    """
    GET  /api/proyectos/           → lista de proyectos
    POST /api/proyectos/           → crear un nuevo proyecto

    Filtros en GET (opcionales):
      - q: texto de búsqueda en título o descripción
      - tipo: tipo de proyecto (curso, proyecto, mentoría, etc.)
      - carrera: filtrar por carrera
    """
    opt = allow_options(request)
    if opt:
        return opt

    try:
        conn = db_conn()
        cur = conn.cursor(dictionary=True)

        if request.method == 'GET':
            q = (request.GET.get('q') or '').strip()
            tipo = (request.GET.get('tipo') or '').strip()
            carrera = (request.GET.get('carrera') or '').strip()

            sql = """
                SELECT 
                    id,
                    titulo,
                    descripcion,
                    tipo,
                    modalidad,
                    carrera,
                    area_interes,
                    creador_id,
                    creador_tipo,
                    creado_en,
                    actualizado_en
                FROM proyectos
                WHERE 1=1
            """
            params = []

            if q:
                sql += " AND (titulo LIKE %s OR descripcion LIKE %s)"
                like = f"%{q}%"
                params.extend([like, like])

            if tipo:
                sql += " AND tipo = %s"
                params.append(tipo)

            if carrera:
                sql += " AND carrera = %s"
                params.append(carrera)

            sql += " ORDER BY creado_en DESC"

            cur.execute(sql, tuple(params))
            rows = cur.fetchall()
            cur.close()
            conn.close()

            return json_ok(rows, "Lista de proyectos obtenida correctamente.")

        elif request.method == 'POST':
            # Crear un proyecto nuevo
            data = json.loads(request.body or "{}")

            titulo = (data.get('titulo') or '').strip()
            descripcion = (data.get('descripcion') or '').strip()
            tipo = (data.get('tipo') or '').strip()  # p.ej. 'proyecto', 'curso', 'mentoria'
            modalidad = (data.get('modalidad') or '').strip()  # p.ej. 'online', 'presencial'
            carrera = (data.get('carrera') or '').strip()
            area_interes = (data.get('area_interes') or '').strip()

            creador_id = data.get('creador_id')
            creador_tipo = _normalizar_tipo_usuario(data.get('creador_tipo'))

            if not titulo or not descripcion:
                return json_err("titulo y descripcion son obligatorios.", 400)
            if not creador_id or not creador_tipo:
                return json_err("creador_id y creador_tipo son obligatorios.", 400)

            creador_id = int(creador_id)
            now = datetime.now()

            cur.execute("""
                INSERT INTO proyectos
                    (titulo, descripcion, tipo, modalidad, carrera, area_interes,
                     creador_id, creador_tipo, creado_en, actualizado_en)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                titulo,
                descripcion,
                tipo or None,
                modalidad or None,
                carrera or None,
                area_interes or None,
                creador_id,
                creador_tipo,
                now,
                now
            ))
            conn.commit()
            proyecto_id = cur.lastrowid
            cur.close()
            conn.close()

            return json_ok(
                {
                    "id": proyecto_id,
                    "titulo": titulo,
                    "descripcion": descripcion,
                    "tipo": tipo,
                    "modalidad": modalidad,
                    "carrera": carrera,
                    "area_interes": area_interes,
                    "creador_id": creador_id,
                    "creador_tipo": creador_tipo,
                    "creado_en": now.strftime("%Y-%m-%d %H:%M:%S"),
                },
                "Proyecto creado correctamente.",
                201
            )

        else:
            cur.close()
            conn.close()
            return json_err("Método no permitido. Usa GET o POST.", 405)

    except mysql.connector.Error as e:
        print("❌ proyectos_list MySQL error:", str(e))
        return json_err(f"Error de base de datos: {str(e)}", 500)
    except Exception as e:
        print("❌ proyectos_list error:", str(e))
        import traceback
        print(traceback.format_exc())
        return json_err(f"Error interno: {str(e)}", 500)


@csrf_exempt
def proyecto_me_interesa(request, proyecto_id):
    """
    Registrar que un usuario está interesado en un proyecto.

    POST /api/proyectos/<id>/me-interesa/

    Body JSON:
      {
        "usuario_id": 1,
        "usuario_tipo": "estudiante",
        "mensaje": "Me interesa colaborar en la parte de backend"
      }
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data = json.loads(request.body or "{}")
        usuario_id = data.get('usuario_id')
        usuario_tipo = _normalizar_tipo_usuario(data.get('usuario_tipo'))
        mensaje = (data.get('mensaje') or '').strip()

        if not usuario_id or not usuario_tipo:
            return json_err("usuario_id y usuario_tipo son obligatorios.", 400)

        usuario_id = int(usuario_id)
        now = datetime.now()

        conn = db_conn()
        cur = conn.cursor(dictionary=True)

        # Verificamos que el proyecto exista
        cur.execute("SELECT id FROM proyectos WHERE id=%s", (proyecto_id,))
        proyecto = cur.fetchone()
        if not proyecto:
            cur.close()
            conn.close()
            return json_err("Proyecto no encontrado.", 404)

        # Revisar si ya había interés previo
        cur.execute("""
            SELECT id
            FROM proyecto_intereses
            WHERE proyecto_id=%s AND usuario_id=%s AND usuario_tipo=%s
            LIMIT 1
        """, (proyecto_id, usuario_id, usuario_tipo))
        row = cur.fetchone()

        if row:
            # Actualizar mensaje y fecha
            cur2 = conn.cursor()
            cur2.execute("""
                UPDATE proyecto_intereses
                SET mensaje=%s, actualizado_en=%s
                WHERE id=%s
            """, (mensaje, now, row['id']))
            conn.commit()
            cur2.close()
            interes_id = row['id']
            accion = "actualizado"
        else:
            # Crear nuevo interés
            cur2 = conn.cursor()
            cur2.execute("""
                INSERT INTO proyecto_intereses
                    (proyecto_id, usuario_id, usuario_tipo, mensaje, creado_en, actualizado_en)
                VALUES (%s,%s,%s,%s,%s,%s)
            """, (proyecto_id, usuario_id, usuario_tipo, mensaje, now, now))
            conn.commit()
            interes_id = cur2.lastrowid
            cur2.close()
            accion = "creado"

        cur.close()
        conn.close()

        return json_ok(
            {
                "interes_id": interes_id,
                "proyecto_id": proyecto_id,
                "usuario_id": usuario_id,
                "usuario_tipo": usuario_tipo,
                "accion": accion,
            },
            "Interés en el proyecto registrado correctamente."
        )

    except mysql.connector.Error as e:
        print("❌ proyecto_me_interesa MySQL error:", str(e))
        return json_err(f"Error de base de datos: {str(e)}", 500)
    except Exception as e:
        print("❌ proyecto_me_interesa error:", str(e))
        import traceback
        print(traceback.format_exc())
        return json_err(f"Error interno: {str(e)}", 500)
