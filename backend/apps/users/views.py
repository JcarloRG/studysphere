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

import hashlib

import psycopg2
import psycopg2.extras

from . import matching


# ===================== ELIMINAR PERFILES (DJANGO ORM) =====================

@csrf_exempt
def eliminar_estudiante(request, id):
    """
    Endpoint para eliminar estudiante por ID
    """
    if request.method == 'POST':
        try:
            if not _verificar_propietario(request, id, 'estudiante'):
                return JsonResponse({
                    'success': False,
                    'message': 'No tienes permiso para eliminar este perfil.'
                }, status=403)

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
            if not _verificar_propietario(request, id, 'docente'):
                return JsonResponse({
                    'success': False,
                    'message': 'No tienes permiso para eliminar este perfil.'
                }, status=403)

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
            if not _verificar_propietario(request, id, 'egresado'):
                return JsonResponse({
                    'success': False,
                    'message': 'No tienes permiso para eliminar este perfil.'
                }, status=403)

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
    """
    Conexión "cruda" a Postgres para las consultas SQL directas de este
    archivo (en paralelo al ORM de Django, que usa la misma base).

    Antes esto tenía host/usuario/password de MySQL hardcodeados (root, sin
    password) sin usar el .env. Ahora lee la config real desde
    settings.DATABASES['default'], que sí viene del .env — así solo hay un
    lugar donde configurar la conexión.
    """
    db = settings.DATABASES['default']
    return psycopg2.connect(
        host=db['HOST'] or '127.0.0.1',
        port=db['PORT'] or '5432',
        dbname=db['NAME'],
        user=db['USER'],
        password=db['PASSWORD'],
    )


def _hash_password(password):
    """
    Hash SHA-256 en Python (hex) para password_hash.

    Antes esto lo hacía la base de datos con SHA2(%s, 256), función que
    existe en MySQL pero no en Postgres. Calcularlo aquí además tiene la
    ventaja de que ya no depende del motor de base de datos.

    Nota: SHA-256 sin sal es más débil que algo como PBKDF2/bcrypt (lo que
    usa Django con make_password/check_password). Se deja igual que antes
    para no invalidar las contraseñas ya guardadas de tus usuarios actuales;
    si quieres pasarte a hashing con sal, es un cambio aparte (hay que
    re-hashear o forzar reset de contraseña).
    """
    return hashlib.sha256((password or '').encode('utf-8')).hexdigest()


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
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        user_info = None

        tablas = {
            'estudiantes': 'estudiante',
            'docentes': 'docente',
            'egresados': 'egresado'
        }

        for tabla, tipo in tablas.items():
            sql = f"""
            SELECT id,
                   CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                   nombre, apellido_paterno, apellido_materno,
                   correo_institucional, email_verified, foto
            FROM {tabla}
            WHERE LOWER(correo_institucional)=%s AND password_hash=%s
            LIMIT 1
            """
            cursor.execute(sql, (email, _hash_password(password)))
            row = cursor.fetchone()

            if row:
                user_info = {
                    'perfil_id': row['id'],
                    'nombre_completo': row['nombre_completo'],
                    'nombre': row['nombre'],
                    'apellido_paterno': row['apellido_paterno'],
                    'apellido_materno': row['apellido_materno'],
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

    except psycopg2.Error as e:
        print("❌ ERROR de base de datos en login:", str(e))
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

        campos = ['nombre', 'apellido_paterno', 'correo_institucional', 'carrera_actual', 'password']
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
        (nombre, apellido_paterno, apellido_materno, correo_institucional, password_hash, carrera_actual, otra_carrera, semestre, habilidades, area_interes, foto)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING id
        """
        valores = (
            data['nombre'],
            data['apellido_paterno'],
            data.get('apellido_materno') or None,
            data['correo_institucional'],
            _hash_password(data['password']),
            data['carrera_actual'],
            data.get('otra_carrera', 'No'),
            data.get('semestre', ''),
            data.get('habilidades', ''),
            data.get('area_interes', ''),
            foto_url
        )
        cursor.execute(sql, valores)
        estudiante_id = cursor.fetchone()[0]
        conn.commit()

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

    except psycopg2.Error as e:
        print("❌ ERROR de base de datos:", str(e))
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

        campos = ['nombre', 'apellido_paterno', 'correo_institucional', 'carrera_egreso', 'password']
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
        (nombre, apellido_paterno, apellido_materno, correo_institucional, password_hash, carrera_egreso, carreras_imparte, grado_academico, habilidades, logros, foto)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING id
        """
        valores = (
            data['nombre'],
            data['apellido_paterno'],
            data.get('apellido_materno') or None,
            data['correo_institucional'],
            _hash_password(data['password']),
            data['carrera_egreso'],
            data.get('carreras_imparte', ''),
            data.get('grado_academico', ''),
            data.get('habilidades', ''),
            data.get('logros', ''),
            foto_url
        )
        cursor.execute(sql, valores)
        docente_id = cursor.fetchone()[0]
        conn.commit()

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

    except psycopg2.Error as e:
        print("❌ ERROR de base de datos:", str(e))
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

        campos = ['nombre', 'apellido_paterno', 'correo_institucional', 'carrera_egreso', 'anio_egreso', 'password']
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
        (nombre, apellido_paterno, apellido_materno, correo_institucional, password_hash, carrera_egreso, anio_egreso, ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, competencias, foto)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING id
        """
        valores = (
            data['nombre'],
            data['apellido_paterno'],
            data.get('apellido_materno') or None,
            data['correo_institucional'],
            _hash_password(data['password']),
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
        egresado_id = cursor.fetchone()[0]
        conn.commit()

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

    except psycopg2.Error as e:
        print("❌ ERROR de base de datos:", str(e))
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
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        sql = """
            SELECT id,
                   CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                   nombre, apellido_paterno, apellido_materno,
                   correo_institucional, carrera_actual,
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
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        sql = """
            SELECT id,
                   CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                   nombre, apellido_paterno, apellido_materno,
                   correo_institucional, carrera_egreso, 
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
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        sql = """
            SELECT id,
                   CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                   nombre, apellido_paterno, apellido_materno,
                   correo_institucional, carrera_egreso, anio_egreso,
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

    if request.method == 'PUT':
        try:
            if not _verificar_propietario(request, estudiante_id, 'estudiante'):
                return json_err('No tienes permiso para editar este perfil.', 403)

            data = json.loads(request.body or "{}")

            nombre = (data.get('nombre') or '').strip()
            apellido_paterno = (data.get('apellido_paterno') or '').strip()
            if not nombre or not apellido_paterno:
                return json_err('Nombre y apellido paterno son obligatorios.', 400)
            if not (data.get('carrera_actual') or '').strip():
                return json_err('La carrera actual es obligatoria.', 400)

            conn = db_conn()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE estudiantes
                SET nombre=%s, apellido_paterno=%s, apellido_materno=%s,
                    carrera_actual=%s, otra_carrera=%s, semestre=%s,
                    habilidades=%s, area_interes=%s
                WHERE id=%s
            """, (
                nombre,
                apellido_paterno,
                (data.get('apellido_materno') or '').strip() or None,
                data.get('carrera_actual', '').strip(),
                data.get('otra_carrera', 'No'),
                data.get('semestre', ''),
                data.get('habilidades', ''),
                data.get('area_interes', ''),
                estudiante_id,
            ))
            conn.commit()
            cursor.close()
            conn.close()
            return json_ok(None, 'Perfil actualizado correctamente.')
        except Exception as e:
            print("❌ perfil_estudiante PUT error:", str(e))
            return json_err(f'Error interno: {str(e)}', 500)

    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT id,
                   CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                   nombre, apellido_paterno, apellido_materno,
                   correo_institucional, carrera_actual,
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

    if request.method == 'PUT':
        try:
            if not _verificar_propietario(request, docente_id, 'docente'):
                return json_err('No tienes permiso para editar este perfil.', 403)

            data = json.loads(request.body or "{}")

            nombre = (data.get('nombre') or '').strip()
            apellido_paterno = (data.get('apellido_paterno') or '').strip()
            if not nombre or not apellido_paterno:
                return json_err('Nombre y apellido paterno son obligatorios.', 400)
            if not (data.get('carrera_egreso') or '').strip():
                return json_err('La carrera de egreso es obligatoria.', 400)

            conn = db_conn()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE docentes
                SET nombre=%s, apellido_paterno=%s, apellido_materno=%s,
                    carrera_egreso=%s, carreras_imparte=%s, grado_academico=%s,
                    habilidades=%s, logros=%s
                WHERE id=%s
            """, (
                nombre,
                apellido_paterno,
                (data.get('apellido_materno') or '').strip() or None,
                data.get('carrera_egreso', '').strip(),
                data.get('carreras_imparte', ''),
                data.get('grado_academico', ''),
                data.get('habilidades', ''),
                data.get('logros', ''),
                docente_id,
            ))
            conn.commit()
            cursor.close()
            conn.close()
            return json_ok(None, 'Perfil actualizado correctamente.')
        except Exception as e:
            print("❌ perfil_docente PUT error:", str(e))
            return json_err(f'Error interno: {str(e)}', 500)

    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT id,
                   CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                   nombre, apellido_paterno, apellido_materno,
                   correo_institucional, carrera_egreso,
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

    if request.method == 'PUT':
        try:
            if not _verificar_propietario(request, egresado_id, 'egresado'):
                return json_err('No tienes permiso para editar este perfil.', 403)

            data = json.loads(request.body or "{}")

            nombre = (data.get('nombre') or '').strip()
            apellido_paterno = (data.get('apellido_paterno') or '').strip()
            if not nombre or not apellido_paterno:
                return json_err('Nombre y apellido paterno son obligatorios.', 400)
            if not (data.get('carrera_egreso') or '').strip():
                return json_err('La carrera de egreso es obligatoria.', 400)

            anio = data.get('anio_egreso')
            try:
                anio = int(anio)
                if anio < 1900 or anio > 2100:
                    raise ValueError
            except (TypeError, ValueError):
                return json_err('Año de egreso inválido.', 400)

            conn = db_conn()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE egresados
                SET nombre=%s, apellido_paterno=%s, apellido_materno=%s,
                    carrera_egreso=%s, anio_egreso=%s, ocupacion_actual=%s,
                    perfil_linkedin=%s, empresa=%s, puesto=%s, logros=%s,
                    habilidades=%s, competencias=%s
                WHERE id=%s
            """, (
                nombre,
                apellido_paterno,
                (data.get('apellido_materno') or '').strip() or None,
                data.get('carrera_egreso', '').strip(),
                anio,
                data.get('ocupacion_actual', ''),
                data.get('perfil_linkedin', ''),
                data.get('empresa', ''),
                data.get('puesto', ''),
                data.get('logros', ''),
                data.get('habilidades', ''),
                data.get('competencias', ''),
                egresado_id,
            ))
            conn.commit()
            cursor.close()
            conn.close()
            return json_ok(None, 'Perfil actualizado correctamente.')
        except Exception as e:
            print("❌ perfil_egresado PUT error:", str(e))
            return json_err(f'Error interno: {str(e)}', 500)

    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT id,
                   CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                   nombre, apellido_paterno, apellido_materno,
                   correo_institucional, carrera_egreso, anio_egreso,
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
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
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


def _usuario_actual(request):
    """
    Identifica al usuario logueado a partir de las cabeceras X-User-Id /
    X-User-Tipo que manda el frontend en requestJSONWithUser() de api.js.

    Devuelve (usuario_id:int, usuario_tipo:str) o (None, None) si no vienen
    o son inválidas. Se usa como respaldo en los endpoints de matches que
    antes solo aceptaban origen_id/origen_tipo por body o query string (y
    por eso nunca encontraban al usuario, aunque el frontend sí mandaba
    quién era vía cabeceras).
    """
    uid = request.headers.get('X-User-Id')
    utipo = _normalizar_tipo_usuario(request.headers.get('X-User-Tipo'))
    if not uid or not utipo:
        return None, None
    try:
        return int(uid), utipo
    except (TypeError, ValueError):
        return None, None


def _verificar_propietario(request, perfil_id, tipo_esperado):
    """
    True si el usuario identificado por las cabeceras es el dueño del
    perfil que se quiere editar (evita que cualquiera edite el perfil de
    otra persona con solo saber su id).
    """
    usuario_id, usuario_tipo = _usuario_actual(request)
    try:
        perfil_id = int(perfil_id)
    except (TypeError, ValueError):
        return False
    return usuario_id == perfil_id and usuario_tipo == tipo_esperado


_TABLA_PERFIL = {
    'estudiante': 'estudiantes',
    'docente': 'docentes',
    'egresado': 'egresados',
}


def _nombre_perfil(conn, tipo, perfil_id):
    """Nombre completo de un perfil, para meterlo en el texto de una notificación."""
    tabla = _TABLA_PERFIL.get(tipo)
    if not tabla:
        return 'Alguien'
    cur = conn.cursor()
    cur.execute(f"""
        SELECT CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, ''))
        FROM {tabla} WHERE id=%s
    """, (perfil_id,))
    row = cur.fetchone()
    cur.close()
    return row[0] if row and row[0] else 'Alguien'


def _crear_notificacion(conn, usuario_id, usuario_tipo, tipo, titulo,
                         descripcion='', cta_label=None, cta_path=None):
    """
    Inserta una notificación para un usuario. No hace commit — se espera
    que el caller ya vaya a hacer conn.commit() como parte de su propia
    transacción (todos los callers de esto están justo antes de un commit
    de la acción que la disparó).
    """
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO notificaciones
            (usuario_id, usuario_tipo, tipo, titulo, descripcion, cta_label, cta_path, creado_en)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (usuario_id, usuario_tipo, tipo, titulo, descripcion, cta_label, cta_path, datetime.now()))
    cur.close()


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

        # usuario que está logueado (origen). El frontend normalmente lo manda
        # por cabeceras (X-User-Id/X-User-Tipo); si además viene en el body,
        # el body tiene prioridad.
        header_id, header_tipo = _usuario_actual(request)
        usuario_id = data.get('origen_id') or header_id
        usuario_tipo = _normalizar_tipo_usuario(data.get('origen_tipo')) or header_tipo

        # perfil al que quiere hacer match
        perfil_id = data.get('perfil_id')
        perfil_tipo = _normalizar_tipo_usuario(data.get('tipo_perfil'))

        if not usuario_id or not usuario_tipo:
            return json_err('Faltan origen_id / origen_tipo en el cuerpo.', 400)
        if not perfil_id or not perfil_tipo:
            return json_err('Faltan perfil_id / tipo_perfil en el cuerpo.', 400)

        usuario_id = int(usuario_id)
        perfil_id = int(perfil_id)

        if usuario_id == perfil_id and usuario_tipo == perfil_tipo:
            return json_err('No puedes hacer match contigo mismo.', 400)

        conn = db_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        now = datetime.now()

        # compatibilidad opcional (si no llega del frontend, la calculamos
        # con el algoritmo real de matching.py; si no hay info suficiente
        # de ninguno de los dos perfiles, usamos un valor neutro)
        compat = data.get('compatibilidad')
        if compat is None:
            compat = matching.compatibilidad_entre_perfiles(
                conn, usuario_id, usuario_tipo, perfil_id, perfil_tipo
            )
            if compat is None:
                compat = 50

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

            misma_direccion = (
                row['usuario_id'] == usuario_id and row['usuario_tipo'] == usuario_tipo
            )

            cur2 = conn.cursor()

            if not misma_direccion and row['estado'] == 'pendiente':
                # La OTRA persona ya te había mandado una solicitud pendiente
                # a ti; que tú ahora le "solicites" a ella equivale a
                # aceptar su solicitud -> match recíproco inmediato.
                cur2.execute("""
                    UPDATE matches
                    SET estado='aceptado',
                        compatibilidad=%s,
                        fecha_actualizacion=%s
                    WHERE id=%s
                """, (compat, now, row['id']))
                estado = 'aceptado'
                _crear_notificacion(
                    conn, perfil_id, perfil_tipo, 'match',
                    '¡Es un match!',
                    f'Ahora colaboras con {_nombre_perfil(conn, usuario_tipo, usuario_id)}.',
                    'Enviar mensaje', f'/mensajes/{row["id"]}'
                )
            elif not misma_direccion:
                # Iba en sentido contrario pero estaba rechazado -> ahora
                # el que solicita eres tú, así que volteamos quién es el
                # remitente para que quede reflejado correctamente.
                cur2.execute("""
                    UPDATE matches
                    SET usuario_id=%s, usuario_tipo=%s,
                        perfil_match_id=%s, perfil_match_tipo=%s,
                        estado='pendiente',
                        compatibilidad=%s,
                        fecha_actualizacion=%s
                    WHERE id=%s
                """, (usuario_id, usuario_tipo, perfil_id, perfil_tipo, compat, now, row['id']))
                estado = 'pendiente'
                _crear_notificacion(
                    conn, perfil_id, perfil_tipo, 'match',
                    'Nueva solicitud de colaboración',
                    f'{_nombre_perfil(conn, usuario_tipo, usuario_id)} quiere colaborar contigo.',
                    'Ver solicitud', '/mis-matches'
                )
            else:
                # Misma dirección de siempre (pendiente otra vez, o
                # reintentando tras un rechazo tuyo previo) -> solo se
                # refresca.
                cur2.execute("""
                    UPDATE matches
                    SET estado='pendiente',
                        compatibilidad=%s,
                        fecha_actualizacion=%s
                    WHERE id=%s
                """, (compat, now, row['id']))
                estado = 'pendiente'

            conn.commit()
            match_id = row['id']
            cur2.close()
        else:
            # Crear nuevo registro
            cur2 = conn.cursor()
            cur2.execute("""
                INSERT INTO matches
                    (usuario_id, usuario_tipo, perfil_match_id, perfil_match_tipo,
                     compatibilidad, estado, fecha_match, fecha_actualizacion)
                VALUES (%s,%s,%s,%s,%s,'pendiente',%s,%s)
                RETURNING id
            """, (usuario_id, usuario_tipo, perfil_id, perfil_tipo,
                  compat, now, now))
            match_id = cur2.fetchone()[0]
            _crear_notificacion(
                conn, perfil_id, perfil_tipo, 'match',
                'Nueva solicitud de colaboración',
                f'{_nombre_perfil(conn, usuario_tipo, usuario_id)} quiere colaborar contigo.',
                'Ver solicitud', '/mis-matches'
            )
            conn.commit()
            estado = 'pendiente'
            cur2.close()

        cur.close()
        conn.close()

        mensaje = (
            '¡Es un match! La otra persona también quería colaborar contigo.'
            if estado == 'aceptado'
            else 'Solicitud de colaboración registrada correctamente.'
        )
        return json_ok(
            {'match_id': match_id, 'estado': estado, 'compatibilidad': compat},
            mensaje
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

        usuario_id, usuario_tipo = _usuario_actual(request)

        conn = db_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM matches WHERE id=%s", (match_id,))
        match = cur.fetchone()

        if not match:
            cur.close(); conn.close()
            return json_err('Match no encontrado.', 404)

        # Solo quien RECIBIÓ la solicitud puede aceptarla
        es_destinatario = (
            usuario_id is not None and usuario_tipo is not None and
            match['perfil_match_id'] == usuario_id and
            match['perfil_match_tipo'] == usuario_tipo
        )
        if not es_destinatario:
            cur.close(); conn.close()
            return json_err('No tienes permiso para aceptar este match.', 403)

        now = datetime.now()
        cur2 = conn.cursor()
        cur2.execute("""
            UPDATE matches
            SET estado='aceptado',
                fecha_actualizacion=%s
            WHERE id=%s
        """, (now, match_id))
        _crear_notificacion(
            conn, match['usuario_id'], match['usuario_tipo'], 'match',
            '¡Aceptaron tu solicitud!',
            f'{_nombre_perfil(conn, usuario_tipo, usuario_id)} aceptó colaborar contigo.',
            'Enviar mensaje', f'/mensajes/{match_id}'
        )
        conn.commit()
        cur2.close(); cur.close(); conn.close()

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

        usuario_id, usuario_tipo = _usuario_actual(request)

        conn = db_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM matches WHERE id=%s", (match_id,))
        match = cur.fetchone()

        if not match:
            cur.close(); conn.close()
            return json_err('Match no encontrado.', 404)

        es_destinatario = (
            usuario_id is not None and usuario_tipo is not None and
            match['perfil_match_id'] == usuario_id and
            match['perfil_match_tipo'] == usuario_tipo
        )
        if not es_destinatario:
            cur.close(); conn.close()
            return json_err('No tienes permiso para rechazar este match.', 403)

        now = datetime.now()
        cur2 = conn.cursor()
        cur2.execute("""
            UPDATE matches
            SET estado='rechazado',
                fecha_actualizacion=%s
            WHERE id=%s
        """, (now, match_id))
        conn.commit()
        cur2.close(); cur.close(); conn.close()

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
        header_id, header_tipo = _usuario_actual(request)
        origen_id = request.GET.get('origen_id') or header_id
        origen_tipo = _normalizar_tipo_usuario(request.GET.get('origen_tipo')) or header_tipo
        tipo_perfil = _normalizar_tipo_usuario(request.GET.get('tipo_perfil'))

        if not origen_id or not origen_tipo or not tipo_perfil:
            return json_err('Se requieren origen_id, origen_tipo y tipo_perfil.', 400)

        origen_id = int(origen_id)
        objetivo_id = int(perfil_id)

        conn = db_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
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
    Devuelve los matches de un usuario, con el nombre/foto de la OTRA
    persona ya resueltos (antes solo devolvía IDs crudos) y un campo
    'direccion' que indica si la solicitud la mandó el usuario actual
    ('enviada', esperando respuesta del otro) o la recibió ('recibida',
    el usuario actual es quien puede aceptar/rechazar).

      GET /api/matches/mis-matches/                    → todos los estados
      GET /api/matches/mis-matches/?estado=aceptado     → solo aceptados
      GET /api/matches/mis-matches/?estado=pendiente    → solo pendientes

    El usuario se identifica por origen_id/origen_tipo en query string, o
    si no vienen, por las cabeceras X-User-Id/X-User-Tipo.
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'GET':
        return json_err('Método no permitido. Usa GET.', 405)

    try:
        header_id, header_tipo = _usuario_actual(request)
        origen_id = request.GET.get('origen_id') or header_id
        origen_tipo = _normalizar_tipo_usuario(request.GET.get('origen_tipo')) or header_tipo
        estado_filtro = (request.GET.get('estado') or '').strip().lower()

        if not origen_id or not origen_tipo:
            return json_err('Se requieren origen_id y origen_tipo.', 400)

        origen_id = int(origen_id)

        conn = db_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            WITH mis_matches AS (
                SELECT m.*,
                       CASE WHEN m.usuario_id=%(oid)s AND m.usuario_tipo=%(otipo)s
                            THEN 'enviada' ELSE 'recibida' END AS direccion,
                       CASE WHEN m.usuario_id=%(oid)s AND m.usuario_tipo=%(otipo)s
                            THEN m.perfil_match_id ELSE m.usuario_id END AS otro_id,
                       CASE WHEN m.usuario_id=%(oid)s AND m.usuario_tipo=%(otipo)s
                            THEN m.perfil_match_tipo ELSE m.usuario_tipo END AS otro_tipo
                FROM matches m
                WHERE (m.usuario_id=%(oid)s AND m.usuario_tipo=%(otipo)s)
                   OR (m.perfil_match_id=%(oid)s AND m.perfil_match_tipo=%(otipo)s)
            )
            SELECT
                mm.id, mm.estado, mm.compatibilidad, mm.direccion,
                mm.fecha_match, mm.fecha_actualizacion,
                mm.otro_id, mm.otro_tipo,
                p.nombre_completo AS otro_nombre,
                p.foto AS otro_foto
            FROM mis_matches mm
            LEFT JOIN (
                SELECT id, 'estudiante' AS tipo,
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                       COALESCE(foto, '/static/images/default-avatar.png') AS foto
                FROM estudiantes
                UNION ALL
                SELECT id, 'docente',
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')),
                       COALESCE(foto, '/static/images/default-avatar.png')
                FROM docentes
                UNION ALL
                SELECT id, 'egresado',
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')),
                       COALESCE(foto, '/static/images/default-avatar.png')
                FROM egresados
            ) p ON p.id = mm.otro_id AND p.tipo = mm.otro_tipo
            WHERE (%(estado)s = '' OR mm.estado = %(estado)s)
            ORDER BY mm.fecha_actualizacion DESC
        """, {'oid': origen_id, 'otipo': origen_tipo, 'estado': estado_filtro})
        rows = cur.fetchall()
        cur.close(); conn.close()

        return json_ok(rows, 'Matches obtenidos correctamente.')

    except Exception as e:
        print("❌ matches_mis_matches error:", str(e))
        import traceback
        print(traceback.format_exc())
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
        header_id, header_tipo = _usuario_actual(request)
        origen_id = request.GET.get('origen_id') or header_id
        origen_tipo = _normalizar_tipo_usuario(request.GET.get('origen_tipo')) or header_tipo

        conn = db_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        candidatos = []

        # --- Estudiantes ---
        cur.execute("""
            SELECT 
                id,
                'estudiante' AS tipo,
                CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                nombre, apellido_paterno, apellido_materno,
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
                CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                nombre, apellido_paterno, apellido_materno,
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
                CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                nombre, apellido_paterno, apellido_materno,
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

        # Si tenemos info del origen, excluimos su propio perfil...
        if origen_id and origen_tipo:
            try:
                origen_id_int = int(origen_id)
                candidatos = [
                    c for c in candidatos
                    if not (c['tipo'] == origen_tipo and int(c['id']) == origen_id_int)
                ]
            except ValueError:
                origen_id_int = None
        else:
            origen_id_int = None

        # ...y a cualquiera con quien ya exista una relación (pendiente,
        # aceptada o rechazada), para no repetir gente que ya "swipeaste"
        if origen_id_int and origen_tipo:
            cur.execute("""
                SELECT
                    CASE WHEN usuario_id=%(oid)s AND usuario_tipo=%(otipo)s
                         THEN perfil_match_id ELSE usuario_id END AS otro_id,
                    CASE WHEN usuario_id=%(oid)s AND usuario_tipo=%(otipo)s
                         THEN perfil_match_tipo ELSE usuario_tipo END AS otro_tipo
                FROM matches
                WHERE (usuario_id=%(oid)s AND usuario_tipo=%(otipo)s)
                   OR (perfil_match_id=%(oid)s AND perfil_match_tipo=%(otipo)s)
            """, {'oid': origen_id_int, 'otipo': origen_tipo})
            ya_contactados = {(r['otro_id'], r['otro_tipo']) for r in cur.fetchall()}
            candidatos = [
                c for c in candidatos
                if (int(c['id']), c['tipo']) not in ya_contactados
            ]

        # --- Calculamos compatibilidad real (matching.py) en vez de random ---
        modo_busqueda = 'vacio'
        if origen_id_int and origen_tipo:
            hab_o, int_o, modo_busqueda = matching.construir_perfil_busqueda(
                conn, origen_id_int, origen_tipo
            )

            if modo_busqueda != 'vacio':
                for c in candidatos:
                    hab_c = matching.extraer_palabras_clave(c.get('habilidades'))
                    int_c = matching.extraer_palabras_clave(c.get('area_interes'))
                    c['compatibilidad'] = matching.calcular_compatibilidad(
                        (hab_o, int_o), (hab_c, int_c)
                    )
                candidatos.sort(key=lambda c: (-c['compatibilidad'], random.random()))

        if modo_busqueda == 'vacio':
            # "Cold start": el usuario no tiene preferencias ni perfil
            # llenado todavía, no hay con qué calcular nada -> revolvemos
            # para que al menos vea variedad, igual que antes.
            for c in candidatos:
                c['compatibilidad'] = None
            random.shuffle(candidatos)

        cur.close()
        conn.close()

        mensajes = {
            'preferencias': 'Matches potenciales obtenidos según tus preferencias de búsqueda.',
            'perfil_propio': 'Matches potenciales obtenidos según tu perfil (no has configurado preferencias de búsqueda).',
            'vacio': 'Matches potenciales obtenidos. Completa tu perfil o tus preferencias para recomendaciones más precisas.',
        }

        return json_ok(candidatos, mensajes.get(modo_busqueda, 'Matches potenciales obtenidos correctamente.'))

    except Exception as e:
        print("❌ matches_potenciales error:", str(e))
        import traceback
        print(traceback.format_exc())
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== MENSAJES (chat entre matches aceptados) =====================
#
# Nota: conceptualmente esto viviría en apps/messaging, pero ese app está
# vacío y todo el resto del proyecto usa SQL crudo dentro de apps/users
# (incluyendo matches, que también "debería" vivir en apps/matches). Se
# sigue esa misma convención aquí por consistencia con el resto del código.
#
# No hay WebSockets/tiempo real: el frontend hace polling (pregunta cada
# pocos segundos) mientras el chat está abierto. Meter Django Channels
# sería un cambio de infraestructura mucho más grande (servidor ASGI,
# Redis, etc.) que no vale la pena para el tamaño de este proyecto ahora.

def _match_participante(conn, match_id, usuario_id, usuario_tipo):
    """
    Si el usuario dado es participante de ese match Y el match está
    aceptado, devuelve la fila del match (dict). Si no, devuelve None.
    Se usa para autorizar el acceso a una conversación.
    """
    if not usuario_id or not usuario_tipo:
        return None
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM matches WHERE id=%s", (match_id,))
    match = cur.fetchone()
    cur.close()

    if not match or match['estado'] != 'aceptado':
        return None

    es_participante = (
        (match['usuario_id'] == usuario_id and match['usuario_tipo'] == usuario_tipo) or
        (match['perfil_match_id'] == usuario_id and match['perfil_match_tipo'] == usuario_tipo)
    )
    return match if es_participante else None


@csrf_exempt
def conversaciones_lista(request):
    """
    GET /api/conversaciones/

    Lista todas las conversaciones (matches aceptados) del usuario, con el
    nombre/foto de la otra persona, el último mensaje, y cuántos mensajes
    sin leer tiene esa conversación. Es el "inbox" de mensajería.
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'GET':
        return json_err('Método no permitido. Usa GET.', 405)

    try:
        usuario_id, usuario_tipo = _usuario_actual(request)
        usuario_id = request.GET.get('origen_id') or usuario_id
        usuario_tipo = _normalizar_tipo_usuario(request.GET.get('origen_tipo')) or usuario_tipo

        if not usuario_id or not usuario_tipo:
            return json_err('Se requiere identificar al usuario.', 400)

        usuario_id = int(usuario_id)

        conn = db_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            WITH mis_matches AS (
                SELECT m.id AS match_id,
                       CASE WHEN m.usuario_id=%(oid)s AND m.usuario_tipo=%(otipo)s
                            THEN m.perfil_match_id ELSE m.usuario_id END AS otro_id,
                       CASE WHEN m.usuario_id=%(oid)s AND m.usuario_tipo=%(otipo)s
                            THEN m.perfil_match_tipo ELSE m.usuario_tipo END AS otro_tipo
                FROM matches m
                WHERE m.estado='aceptado' AND (
                    (m.usuario_id=%(oid)s AND m.usuario_tipo=%(otipo)s) OR
                    (m.perfil_match_id=%(oid)s AND m.perfil_match_tipo=%(otipo)s)
                )
            )
            SELECT
                mm.match_id, mm.otro_id, mm.otro_tipo,
                p.nombre_completo AS otro_nombre,
                p.foto AS otro_foto,
                ultimo.contenido AS ultimo_mensaje,
                ultimo.creado_en AS ultimo_mensaje_en,
                ultimo.remitente_id AS ultimo_remitente_id,
                ultimo.remitente_tipo AS ultimo_remitente_tipo,
                COALESCE(no_leidos.cantidad, 0) AS no_leidos
            FROM mis_matches mm
            LEFT JOIN (
                SELECT id, 'estudiante' AS tipo,
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')) AS nombre_completo,
                       COALESCE(foto, '/static/images/default-avatar.png') AS foto
                FROM estudiantes
                UNION ALL
                SELECT id, 'docente',
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')),
                       COALESCE(foto, '/static/images/default-avatar.png')
                FROM docentes
                UNION ALL
                SELECT id, 'egresado',
                       CONCAT_WS(' ', nombre, apellido_paterno, NULLIF(apellido_materno, '')),
                       COALESCE(foto, '/static/images/default-avatar.png')
                FROM egresados
            ) p ON p.id = mm.otro_id AND p.tipo = mm.otro_tipo
            LEFT JOIN LATERAL (
                SELECT contenido, creado_en, remitente_id, remitente_tipo
                FROM mensajes
                WHERE match_id = mm.match_id
                ORDER BY creado_en DESC
                LIMIT 1
            ) ultimo ON true
            LEFT JOIN (
                SELECT match_id, COUNT(*) AS cantidad
                FROM mensajes
                WHERE leido = 0
                  AND NOT (remitente_id=%(oid)s AND remitente_tipo=%(otipo)s)
                GROUP BY match_id
            ) no_leidos ON no_leidos.match_id = mm.match_id
            ORDER BY COALESCE(ultimo.creado_en, TIMESTAMP '1970-01-01') DESC
        """, {'oid': usuario_id, 'otipo': usuario_tipo})
        rows = cur.fetchall()
        cur.close(); conn.close()

        return json_ok(rows, 'Conversaciones obtenidas correctamente.')

    except Exception as e:
        print("❌ conversaciones_lista error:", str(e))
        import traceback
        print(traceback.format_exc())
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def mensajes_conversacion(request, match_id):
    """
    GET  /api/mensajes/<match_id>/   -> historial completo de la conversación
                                         (y marca como leídos los mensajes
                                         que te mandó la otra persona)
    POST /api/mensajes/<match_id>/   -> manda un mensaje nuevo
                                         body: { "contenido": "..." }

    Solo los dos participantes de un match ACEPTADO pueden ver/mandar
    mensajes en esa conversación.
    """
    opt = allow_options(request)
    if opt:
        return opt

    try:
        usuario_id, usuario_tipo = _usuario_actual(request)
        if request.method == 'GET':
            usuario_id = request.GET.get('origen_id') or usuario_id
            usuario_tipo = _normalizar_tipo_usuario(request.GET.get('origen_tipo')) or usuario_tipo
        else:
            body_preview = json.loads(request.body or "{}") if request.body else {}
            usuario_id = body_preview.get('origen_id') or usuario_id
            usuario_tipo = _normalizar_tipo_usuario(body_preview.get('origen_tipo')) or usuario_tipo

        if not usuario_id or not usuario_tipo:
            return json_err('Se requiere identificar al usuario.', 400)
        usuario_id = int(usuario_id)

        conn = db_conn()

        match = _match_participante(conn, match_id, usuario_id, usuario_tipo)
        if not match:
            conn.close()
            return json_err(
                'No tienes acceso a esta conversación (el match no existe, no está aceptado, o no eres parte de él).',
                403
            )

        if request.method == 'GET':
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("""
                SELECT id, match_id, remitente_id, remitente_tipo, contenido, creado_en, leido
                FROM mensajes
                WHERE match_id=%s
                ORDER BY creado_en ASC
            """, (match_id,))
            mensajes = cur.fetchall()

            # Marcamos como leídos los que mandó LA OTRA persona
            cur2 = conn.cursor()
            cur2.execute("""
                UPDATE mensajes
                SET leido=1
                WHERE match_id=%s AND leido=0
                  AND NOT (remitente_id=%s AND remitente_tipo=%s)
            """, (match_id, usuario_id, usuario_tipo))
            conn.commit()
            cur2.close(); cur.close(); conn.close()

            return json_ok(mensajes, 'Mensajes obtenidos correctamente.')

        elif request.method == 'POST':
            data = json.loads(request.body or "{}")
            contenido = (data.get('contenido') or '').strip()

            if not contenido:
                conn.close()
                return json_err('El mensaje no puede estar vacío.', 400)
            if len(contenido) > 2000:
                conn.close()
                return json_err('El mensaje es demasiado largo (máx. 2000 caracteres).', 400)

            now = datetime.now()
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("""
                INSERT INTO mensajes (match_id, remitente_id, remitente_tipo, contenido, creado_en, leido)
                VALUES (%s,%s,%s,%s,%s,0)
                RETURNING id, match_id, remitente_id, remitente_tipo, contenido, creado_en, leido
            """, (match_id, usuario_id, usuario_tipo, contenido, now))
            nuevo = cur.fetchone()
            conn.commit()
            cur.close(); conn.close()

            return json_ok(nuevo, 'Mensaje enviado.', 201)

        else:
            conn.close()
            return json_err('Método no permitido. Usa GET o POST.', 405)

    except Exception as e:
        print("❌ mensajes_conversacion error:", str(e))
        import traceback
        print(traceback.format_exc())
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== NOTIFICACIONES =====================
#
# Dos fuentes distintas, combinadas en una sola respuesta:
#   1. Filas reales de la tabla `notificaciones` (solicitudes de match,
#      matches aceptados, interés en tus proyectos) — se crean en el
#      momento del evento (ver _crear_notificacion en matches_solicitar,
#      matches_aceptar, proyecto_me_interesa) y se marcan leídas a mano.
#   2. Mensajes de chat sin leer — NO se guardan como fila en
#      `notificaciones` (sería una fila por cada mensaje). En vez de eso,
#      se calculan al vuelo a partir de mensajes.leido, una por
#      conversación con pendientes. Se "marcan leídas" solas en cuanto
#      abres esa conversación (mensajes_conversacion ya hace ese UPDATE).

def _tiempo_relativo(fecha):
    """'Hace 2 min' / 'Hace 3 h' / 'Ayer' / '14 jul' — para el campo `time`
    que ya espera el frontend."""
    if not fecha:
        return ''
    ahora = datetime.now()
    delta = ahora - fecha
    segundos = delta.total_seconds()

    if segundos < 60:
        return 'Justo ahora'
    if segundos < 3600:
        return f'Hace {int(segundos // 60)} min'
    if segundos < 86400 and fecha.date() == ahora.date():
        return f'Hace {int(segundos // 3600)} h'
    if fecha.date() == (ahora - timedelta(days=1)).date():
        return 'Ayer'
    return fecha.strftime('%d %b')


@csrf_exempt
def notificaciones_lista(request):
    """
    GET /api/notificaciones/

    Junta las notificaciones reales (tabla notificaciones) con los
    mensajes de chat sin leer (calculados al vuelo), ordenado todo por
    fecha descendente. Es lo que alimenta el Centro de Notificaciones.
    """
    opt = allow_options(request)
    if opt:
        return opt

    if request.method != 'GET':
        return json_err('Método no permitido. Usa GET.', 405)

    try:
        usuario_id, usuario_tipo = _usuario_actual(request)
        usuario_id = request.GET.get('origen_id') or usuario_id
        usuario_tipo = _normalizar_tipo_usuario(request.GET.get('origen_tipo')) or usuario_tipo

        if not usuario_id or not usuario_tipo:
            return json_err('Se requiere identificar al usuario.', 400)
        usuario_id = int(usuario_id)

        conn = db_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # 1) Notificaciones reales
        cur.execute("""
            SELECT id, tipo, titulo, descripcion, leido, cta_label, cta_path, creado_en
            FROM notificaciones
            WHERE usuario_id=%s AND usuario_tipo=%s
            ORDER BY creado_en DESC
            LIMIT 100
        """, (usuario_id, usuario_tipo))
        reales = cur.fetchall()

        resultado = []
        for n in reales:
            resultado.append({
                'id': f'n-{n["id"]}',
                'type': n['tipo'],
                'title': n['titulo'],
                'description': n['descripcion'] or '',
                'time': _tiempo_relativo(n['creado_en']),
                'read': bool(n['leido']),
                'ctaLabel': n['cta_label'],
                'ctaPath': n['cta_path'],
                '_creado_en': n['creado_en'].isoformat(),
            })

        # 2) Mensajes sin leer, uno por conversación (sintético, sin fila propia)
        cur.execute("""
            WITH mis_matches AS (
                SELECT m.id AS match_id,
                       CASE WHEN m.usuario_id=%(oid)s AND m.usuario_tipo=%(otipo)s
                            THEN m.perfil_match_id ELSE m.usuario_id END AS otro_id,
                       CASE WHEN m.usuario_id=%(oid)s AND m.usuario_tipo=%(otipo)s
                            THEN m.perfil_match_tipo ELSE m.usuario_tipo END AS otro_tipo
                FROM matches m
                WHERE m.estado='aceptado' AND (
                    (m.usuario_id=%(oid)s AND m.usuario_tipo=%(otipo)s) OR
                    (m.perfil_match_id=%(oid)s AND m.perfil_match_tipo=%(otipo)s)
                )
            )
            SELECT
                mm.match_id, p.nombre_completo AS otro_nombre,
                COUNT(msj.id) AS cantidad,
                MAX(msj.creado_en) AS ultimo_en
            FROM mis_matches mm
            JOIN mensajes msj ON msj.match_id = mm.match_id
                AND msj.leido = 0
                AND NOT (msj.remitente_id=%(oid)s AND msj.remitente_tipo=%(otipo)s)
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
            ) p ON p.id = mm.otro_id AND p.tipo = mm.otro_tipo
            GROUP BY mm.match_id, p.nombre_completo
        """, {'oid': usuario_id, 'otipo': usuario_tipo})
        mensajes_sin_leer = cur.fetchall()
        cur.close(); conn.close()

        for c in mensajes_sin_leer:
            plural = 's' if c['cantidad'] > 1 else ''
            resultado.append({
                'id': f'msg-{c["match_id"]}',
                'type': 'message',
                'title': f'Mensaje{plural} de {c["otro_nombre"] or "alguien"}',
                'description': f'Tienes {c["cantidad"]} mensaje{plural} sin leer.',
                'time': _tiempo_relativo(c['ultimo_en']),
                'read': False,
                'ctaLabel': 'Responder',
                'ctaPath': f'/mensajes/{c["match_id"]}',
                '_creado_en': c['ultimo_en'].isoformat(),
            })

        resultado.sort(key=lambda n: n['_creado_en'], reverse=True)
        for n in resultado:
            del n['_creado_en']

        return json_ok(resultado, 'Notificaciones obtenidas correctamente.')

    except Exception as e:
        print("❌ notificaciones_lista error:", str(e))
        import traceback
        print(traceback.format_exc())
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def notificaciones_marcar_leida(request):
    """
    POST /api/notificaciones/marcar-leida/
    body: { "notificacion_id": "n-12" }

    Solo aplica a notificaciones reales (prefijo 'n-'); las de mensajes
    ('msg-...') se marcan solas al abrir esa conversación.
    """
    opt = allow_options(request)
    if opt:
        return opt
    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        usuario_id, usuario_tipo = _usuario_actual(request)
        if not usuario_id or not usuario_tipo:
            return json_err('Se requiere identificar al usuario.', 400)

        data = json.loads(request.body or "{}")
        notif_id = str(data.get('notificacion_id') or '')
        if not notif_id.startswith('n-'):
            return json_ok(None, 'Nada que marcar (notificación sintética).')

        notif_id = notif_id[2:]

        conn = db_conn()
        cur = conn.cursor()
        cur.execute("""
            UPDATE notificaciones SET leido=1
            WHERE id=%s AND usuario_id=%s AND usuario_tipo=%s
        """, (notif_id, usuario_id, usuario_tipo))
        conn.commit()
        cur.close(); conn.close()

        return json_ok(None, 'Notificación marcada como leída.')

    except Exception as e:
        print("❌ notificaciones_marcar_leida error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


@csrf_exempt
def notificaciones_marcar_todas_leidas(request):
    """POST /api/notificaciones/marcar-todas-leidas/"""
    opt = allow_options(request)
    if opt:
        return opt
    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        usuario_id, usuario_tipo = _usuario_actual(request)
        if not usuario_id or not usuario_tipo:
            return json_err('Se requiere identificar al usuario.', 400)

        conn = db_conn()
        cur = conn.cursor()
        cur.execute("""
            UPDATE notificaciones SET leido=1
            WHERE usuario_id=%s AND usuario_tipo=%s AND leido=0
        """, (usuario_id, usuario_tipo))
        conn.commit()
        cur.close(); conn.close()

        return json_ok(None, 'Todas las notificaciones marcadas como leídas.')

    except Exception as e:
        print("❌ notificaciones_marcar_todas_leidas error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== PREFERENCIAS DE BÚSQUEDA (para el matching) =====================

@csrf_exempt
def preferencias_usuario(request):
    """
    GET  /api/preferencias/?usuario_id=1&usuario_tipo=estudiante
        -> devuelve la preferencia guardada, o null si no ha configurado nada.

    POST /api/preferencias/
        Body JSON:
        {
          "usuario_id": 1,
          "usuario_tipo": "estudiante",
          "habilidades_buscadas": "React, diseño UX",
          "intereses_buscados": "inteligencia artificial, videojuegos",
          "tipo_colaboracion": "proyecto"   # proyecto | investigacion | startup | estudio
        }
        -> crea o actualiza (upsert) la fila en user_preferences.

    Esto es lo que usa matching.py como fuente principal para calcular
    compatibilidad: "qué está buscando el usuario", no solo su propio perfil.
    """
    opt = allow_options(request)
    if opt:
        return opt

    try:
        conn = db_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if request.method == 'GET':
            usuario_id = request.GET.get('usuario_id')
            usuario_tipo = _normalizar_tipo_usuario(request.GET.get('usuario_tipo'))

            if not usuario_id or not usuario_tipo:
                cur.close(); conn.close()
                return json_err('Se requieren usuario_id y usuario_tipo.', 400)

            pref = matching.obtener_preferencia(conn, int(usuario_id), usuario_tipo)
            cur.close(); conn.close()
            return json_ok(pref, 'Preferencia obtenida correctamente.')

        elif request.method == 'POST':
            data = json.loads(request.body or "{}")

            usuario_id = data.get('usuario_id')
            usuario_tipo = _normalizar_tipo_usuario(data.get('usuario_tipo'))
            habilidades_buscadas = (data.get('habilidades_buscadas') or '').strip()
            intereses_buscados = (data.get('intereses_buscados') or '').strip()
            tipo_colaboracion = (data.get('tipo_colaboracion') or 'proyecto').strip()

            if not usuario_id or not usuario_tipo:
                cur.close(); conn.close()
                return json_err('usuario_id y usuario_tipo son obligatorios.', 400)

            usuario_id = int(usuario_id)
            now = datetime.now()

            cur.execute(
                "SELECT id FROM user_preferences WHERE usuario_id=%s AND usuario_tipo=%s LIMIT 1",
                (usuario_id, usuario_tipo),
            )
            row = cur.fetchone()

            cur2 = conn.cursor()
            if row:
                cur2.execute("""
                    UPDATE user_preferences
                    SET habilidades_buscadas=%s, intereses_buscados=%s,
                        tipo_colaboracion=%s, updated_at=%s
                    WHERE id=%s
                """, (habilidades_buscadas or None, intereses_buscados or None,
                      tipo_colaboracion, now, row['id']))
                pref_id = row['id']
            else:
                cur2.execute("""
                    INSERT INTO user_preferences
                        (usuario_id, usuario_tipo, habilidades_buscadas,
                         intereses_buscados, tipo_colaboracion, created_at, updated_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s)
                    RETURNING id
                """, (usuario_id, usuario_tipo, habilidades_buscadas or None,
                      intereses_buscados or None, tipo_colaboracion, now, now))
                pref_id = cur2.fetchone()[0]
            conn.commit()
            cur2.close(); cur.close(); conn.close()

            return json_ok(
                {
                    'id': pref_id,
                    'usuario_id': usuario_id,
                    'usuario_tipo': usuario_tipo,
                    'habilidades_buscadas': habilidades_buscadas,
                    'intereses_buscados': intereses_buscados,
                    'tipo_colaboracion': tipo_colaboracion,
                },
                'Preferencias guardadas correctamente.'
            )

        else:
            cur.close(); conn.close()
            return json_err('Método no permitido. Usa GET o POST.', 405)

    except Exception as e:
        print("❌ preferencias_usuario error:", str(e))
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
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if request.method == 'GET':
            q = (request.GET.get('q') or '').strip()
            tipo = (request.GET.get('tipo') or '').strip()
            carrera = (request.GET.get('carrera') or '').strip()
            estado = (request.GET.get('estado') or '').strip()
            creador_id_f = (request.GET.get('creador_id') or request.GET.get('perfil_id') or '').strip()
            creador_tipo_f = _normalizar_tipo_usuario(
                request.GET.get('creador_tipo') or request.GET.get('perfil_tipo')
            )

            sql = """
                SELECT 
                    p.id,
                    p.titulo,
                    p.descripcion,
                    p.tipo,
                    p.modalidad,
                    p.carrera,
                    p.area_interes,
                    p.habilidades_requeridas,
                    p.estado,
                    p.creador_id,
                    p.creador_tipo,
                    creadores.nombre_completo AS creador_nombre,
                    p.creado_en,
                    p.actualizado_en
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
                WHERE 1=1
            """
            params = []

            if q:
                sql += " AND (p.titulo ILIKE %s OR p.descripcion ILIKE %s)"
                like = f"%{q}%"
                params.extend([like, like])

            if tipo:
                sql += " AND p.tipo = %s"
                params.append(tipo)

            if carrera:
                sql += " AND p.carrera = %s"
                params.append(carrera)

            if estado:
                sql += " AND p.estado = %s"
                params.append(estado)

            if creador_id_f and creador_tipo_f:
                sql += " AND p.creador_id = %s AND p.creador_tipo = %s"
                params.extend([int(creador_id_f), creador_tipo_f])

            sql += " ORDER BY p.creado_en DESC"

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
            habilidades_requeridas = (data.get('habilidades_requeridas') or '').strip()
            estado = (data.get('estado') or 'abierto').strip()

            if estado not in ('abierto', 'en progreso', 'cerrado'):
                estado = 'abierto'

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
                     habilidades_requeridas, estado, creador_id, creador_tipo, creado_en, actualizado_en)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id
            """, (
                titulo,
                descripcion,
                tipo or None,
                modalidad or None,
                carrera or None,
                area_interes or None,
                habilidades_requeridas or None,
                estado,
                creador_id,
                creador_tipo,
                now,
                now
            ))
            proyecto_id = cur.fetchone()['id']
            conn.commit()
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
                    "habilidades_requeridas": habilidades_requeridas,
                    "estado": estado,
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

    except psycopg2.Error as e:
        print("❌ proyectos_list DB error:", str(e))
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
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Verificamos que el proyecto exista
        cur.execute("SELECT id, titulo, creador_id, creador_tipo FROM proyectos WHERE id=%s", (proyecto_id,))
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
                RETURNING id
            """, (proyecto_id, usuario_id, usuario_tipo, mensaje, now, now))
            interes_id = cur2.fetchone()[0]
            if proyecto['creador_id'] and proyecto['creador_tipo']:
                _crear_notificacion(
                    conn, proyecto['creador_id'], proyecto['creador_tipo'], 'proyecto',
                    'Interés en tu proyecto',
                    f'{_nombre_perfil(conn, usuario_tipo, usuario_id)} quiere colaborar en "{proyecto["titulo"]}".',
                    'Ver proyectos', '/proyectos'
                )
            conn.commit()
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

    except psycopg2.Error as e:
        print("❌ proyecto_me_interesa DB error:", str(e))
        return json_err(f"Error de base de datos: {str(e)}", 500)
    except Exception as e:
        print("❌ proyecto_me_interesa error:", str(e))
        import traceback
        print(traceback.format_exc())
        return json_err(f"Error interno: {str(e)}", 500)