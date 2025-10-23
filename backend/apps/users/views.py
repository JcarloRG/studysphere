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

import mysql.connector


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


# ===================== LOGIN =====================

@csrf_exempt
def login_user(request):
    print("🔑 LOGIN USER - Endpoint llamado")
    opt = allow_options(request)
    if opt: return opt

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
            SELECT id, nombre_completo, correo_institucional, email_verified
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
                    'email_verified': bool(row['email_verified'])
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
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== ESTUDIANTES =====================

@csrf_exempt
def registrar_estudiante(request):
    print("🎯 REGISTRAR ESTUDIANTE - Endpoint llamado")
    opt = allow_options(request)
    if opt: return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data = json.loads(request.body)
        print("📝 Datos estudiante recibidos:", data)

        campos = ['nombre_completo', 'correo_institucional', 'numero_control', 'carrera_actual', 'password']
        for c in campos:
            if not data.get(c):
                return json_err(f'Campo obligatorio faltante: {c}', 400)

        conn = db_conn()
        cursor = conn.cursor()

        sql = """
        INSERT INTO estudiantes
        (nombre_completo, correo_institucional, password_hash, numero_control, carrera_actual, otra_carrera, semestre, habilidades, area_interes)
        VALUES (%s,%s, SHA2(%s, 256), %s,%s,%s,%s,%s,%s)
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
            data.get('area_interes', '')
        )
        cursor.execute(sql, valores)
        conn.commit()

        cursor.execute("SELECT LAST_INSERT_ID()")
        estudiante_id = cursor.fetchone()[0]

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

        return json_ok({'id': estudiante_id}, '¡Estudiante registrado! Revisa tu correo para el código.', 201)

    except mysql.connector.Error as e:
        print("❌ ERROR MySQL:", str(e))
        return json_err(f'Error de base de datos: {str(e)}', 500)
    except Exception as e:
        print("❌ ERROR general:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== DOCENTES =====================

@csrf_exempt
def registrar_docente(request):
    print("🎯 REGISTRAR DOCENTE - Endpoint llamado")
    opt = allow_options(request)
    if opt: return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data = json.loads(request.body)
        print("📝 Datos docente recibidos:", data)

        campos = ['nombre_completo', 'correo_institucional', 'carrera_egreso', 'password']
        for c in campos:
            if not data.get(c):
                return json_err(f'Campo obligatorio faltante: {c}', 400)

        conn = db_conn()
        cursor = conn.cursor()

        sql = """
        INSERT INTO docentes
        (nombre_completo, correo_institucional, password_hash, carrera_egreso, carreras_imparte, grado_academico, habilidades, logros)
        VALUES (%s,%s, SHA2(%s, 256), %s,%s,%s,%s,%s)
        """
        valores = (
            data['nombre_completo'],
            data['correo_institucional'],
            data['password'],
            data['carrera_egreso'],
            data.get('carreras_imparte', ''),
            data.get('grado_academico', ''),
            data.get('habilidades', ''),
            data.get('logros', '')
        )
        cursor.execute(sql, valores)
        conn.commit()

        cursor.execute("SELECT LAST_INSERT_ID()")
        docente_id = cursor.fetchone()[0]

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

        return json_ok({'id': docente_id}, '¡Docente registrado! Revisa tu correo para el código.', 201)

    except mysql.connector.Error as e:
        print("❌ ERROR MySQL:", str(e))
        return json_err(f'Error de base de datos: {str(e)}', 500)
    except Exception as e:
        print("❌ ERROR general:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== EGRESADOS =====================

@csrf_exempt
def registrar_egresado(request):
    print("🎯 REGISTRAR EGRESADO - Endpoint llamado")
    opt = allow_options(request)
    if opt: return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        data = json.loads(request.body)
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

        sql = """
        INSERT INTO egresados
        (nombre_completo, correo_institucional, password_hash, carrera_egreso, anio_egreso, ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, competencias)
        VALUES (%s,%s, SHA2(%s, 256), %s,%s,%s,%s,%s,%s,%s,%s,%s)
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
            data.get('competencias', '')
        )
        cursor.execute(sql, valores)
        conn.commit()

        cursor.execute("SELECT LAST_INSERT_ID()")
        egresado_id = cursor.fetchone()[0]

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

        return json_ok({'id': egresado_id}, '¡Egresado registrado! Revisa tu correo para el código.', 201)

    except mysql.connector.Error as e:
        print("❌ ERROR MySQL:", str(e))
        return json_err(f'Error de base de datos: {str(e)}', 500)
    except Exception as e:
        print("❌ ERROR general:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== LISTADOS =====================

def listar_estudiantes(request):
    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, numero_control, carrera_actual, 
                   otra_carrera, semestre, habilidades, area_interes, fecha_registro, foto
            FROM estudiantes ORDER BY id DESC
        """)
        rows = cursor.fetchall()
        cursor.close(); conn.close()
        return json_ok(rows)
    except Exception as e:
        return json_err(str(e), 500)

def listar_docentes(request):
    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, carrera_egreso, 
                   carreras_imparte, grado_academico, habilidades, logros, fecha_registro
            FROM docentes ORDER BY id DESC
        """)
        rows = cursor.fetchall()
        cursor.close(); conn.close()
        return json_ok(rows)
    except Exception as e:
        return json_err(str(e), 500)

def listar_egresados(request):
    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, carrera_egreso, anio_egreso,
                   ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, 
                   competencias, fecha_registro
            FROM egresados ORDER BY id DESC
        """)
        rows = cursor.fetchall()
        cursor.close(); conn.close()
        return json_ok(rows)
    except Exception as e:
        return json_err(str(e), 500)


# ===================== PERFILES =====================

@csrf_exempt
def perfil_estudiante(request, estudiante_id):
    opt = allow_options(request)
    if opt: return opt
    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, numero_control, carrera_actual,
                   otra_carrera, semestre, habilidades, area_interes, fecha_registro, foto
            FROM estudiantes WHERE id=%s
        """, (estudiante_id,))
        row = cursor.fetchone()
        cursor.close(); conn.close()
        if not row:
            return json_err('Estudiante no encontrado', 404)
        return json_ok(row, None, 200)
    except Exception as e:
        return json_err(str(e), 500)

@csrf_exempt
def perfil_docente(request, docente_id):
    opt = allow_options(request)
    if opt: return opt
    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, carrera_egreso,
                   carreras_imparte, grado_academico, habilidades, logros, fecha_registro
            FROM docentes WHERE id=%s
        """, (docente_id,))
        row = cursor.fetchone()
        cursor.close(); conn.close()
        if not row:
            return json_err('Docente no encontrado', 404)
        return json_ok(row, None, 200)
    except Exception as e:
        return json_err(str(e), 500)

@csrf_exempt
def perfil_egresado(request, egresado_id):
    opt = allow_options(request)
    if opt: return opt
    if request.method != 'GET':
        return json_err('Método no permitido', 405)
    try:
        conn = db_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre_completo, correo_institucional, carrera_egreso, anio_egreso,
                   ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, 
                   competencias, fecha_registro
            FROM egresados WHERE id=%s
        """, (egresado_id,))
        row = cursor.fetchone()
        cursor.close(); conn.close()
        if not row:
            return json_err('Egresado no encontrado', 404)
        return json_ok(row, None, 200)
    except Exception as e:
        return json_err(str(e), 500)


# ===================== FOTO ESTUDIANTE =====================

def _estudiante_media_storage():
    """
    Crea un FileSystemStorage apuntando a /media/estudiantes
    """
    base_dir = os.path.join(settings.MEDIA_ROOT, 'estudiantes')
    base_url = settings.MEDIA_URL.rstrip('/') + '/estudiantes/'
    os.makedirs(base_dir, exist_ok=True)
    return FileSystemStorage(location=base_dir, base_url=base_url)

@csrf_exempt
def actualizar_foto_estudiante(request, estudiante_id):
    """
    POST multipart/form-data con campo 'foto'
    Guarda la imagen en /media/estudiantes/<archivo> y actualiza estudiantes.foto
    Devuelve { foto: "/media/estudiantes/..." }
    """
    opt = allow_options(request)
    if opt: return opt

    if request.method != 'POST':
        return json_err('Método no permitido. Usa POST.', 405)

    try:
        if 'foto' not in request.FILES:
            return json_err('Archivo "foto" no enviado', 400)

        foto = request.FILES['foto']
        if foto.size > 3 * 1024 * 1024:
            return json_err('La imagen no debe superar 3MB.', 400)

        # Guardar archivo
        fs = _estudiante_media_storage()
        # nombre único
        base, ext = os.path.splitext(foto.name)
        safe_name = f"est_{estudiante_id}_{int(datetime.now().timestamp())}{ext.lower()}"
        filename = fs.save(safe_name, foto)
        rel_url = fs.url(filename)  # p.ej. "/media/estudiantes/est_1_...jpg"

        # Actualizar BD
        conn = db_conn()
        cur = conn.cursor()
        cur.execute("UPDATE estudiantes SET foto=%s WHERE id=%s", (rel_url, estudiante_id))
        conn.commit()
        cur.close(); conn.close()

        return json_ok({'foto': rel_url}, 'Foto actualizada', 200)

    except Exception as e:
        print("❌ actualizar_foto_estudiante error:", str(e))
        return json_err(f'Error interno: {str(e)}', 500)


# ===================== VERIFICACIÓN DE EMAIL =====================

@csrf_exempt
def request_email_code(request):
    """Enviar / reenviar código de verificación"""
    print("📨 REQUEST EMAIL CODE")
    opt = allow_options(request)
    if opt: return opt

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

        # Invalida códigos previos no usados de ese email
        cursor.execute("UPDATE email_verifications SET is_used=1 WHERE email=%s AND is_used=0", (email,))
        conn.commit()

        # Genera nuevo
        code = generate_code(6)
        now = datetime.now()
        exp = now + timedelta(minutes=15)

        cursor.execute("""
            INSERT INTO email_verifications (email, code, tipo, perfil_id, purpose, is_used, created_at, expires_at)
            VALUES (%s,%s,%s,%s,%s,0,%s,%s)
        """, (email, code, tipo, perfil_id, purpose, now, exp))
        conn.commit()

        # Envía correo (best-effort)
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
    if opt: return opt

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
            cursor.close(); conn.close()
            return json_err('Código inválido.', 400)

        if int(row.get('is_used', 0)) == 1:
            cursor.close(); conn.close()
            return json_err('El código ya fue utilizado. Solicita uno nuevo.', 400)

        if row.get('expires_at') and now >= row['expires_at']:
            cursor.close(); conn.close()
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
