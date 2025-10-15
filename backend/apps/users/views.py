import os
import json
import mysql.connector
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

# ======================
# Helpers comunes (CORS)
# ======================
def _corsify(resp: JsonResponse) -> JsonResponse:
    resp["Access-Control-Allow-Origin"] = "*"
    resp["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    resp["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp["Content-Type"] = "application/json; charset=utf-8"
    return resp

def _preflight(request):
    if request.method == "OPTIONS":
        return _corsify(JsonResponse({"status": "ok"}))
    return None

def _json_error(msg, status=400):
    return _corsify(JsonResponse({"status": "error", "message": msg}, status=status))

def _conn():
    """Conexión a MySQL leyendo .env (settings ya lo carga con load_dotenv)."""
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "studysphere"),
        port=int(os.getenv("DB_PORT", "3306")),
    )

# ======================
# Health
# ======================
@csrf_exempt
def health(request):
    pre = _preflight(request)
    if pre: return pre
    return _corsify(JsonResponse({"status": "success", "message": "ok"}))

# ======================
# ESTUDIANTES
# ======================
@csrf_exempt
def registrar_estudiante(request):
    pre = _preflight(request)
    if pre: return pre

    if request.method != "POST":
        return _json_error("Método no permitido. Usa POST.", 405)

    try:
        data = json.loads(request.body or "{}")
        # Validaciones mínimas
        campos_obligatorios = ["nombre_completo", "correo_institucional", "numero_control", "carrera_actual"]
        for campo in campos_obligatorios:
            if not data.get(campo):
                return _json_error(f"Campo obligatorio faltante: {campo}", 400)

        conn = _conn()
        cur = conn.cursor()
        sql = """
            INSERT INTO estudiantes
            (nombre_completo, correo_institucional, numero_control, carrera_actual, otra_carrera, semestre, habilidades, area_interes)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """
        valores = (
            data["nombre_completo"],
            data["correo_institucional"],
            data["numero_control"],
            data["carrera_actual"],
            data.get("otra_carrera", "No"),
            data.get("semestre", ""),
            data.get("habilidades", ""),
            data.get("area_interes", ""),
        )
        cur.execute(sql, valores)
        conn.commit()

        cur.execute("SELECT LAST_INSERT_ID()")
        estudiante_id = cur.fetchone()[0]
        cur.close()
        conn.close()

        return _corsify(JsonResponse(
            {"status": "success", "message": "¡Estudiante registrado exitosamente!", "id": estudiante_id},
            status=201
        ))
    except mysql.connector.Error as e:
        return _json_error(f"Error de base de datos: {str(e)}", 500)
    except Exception as e:
        return _json_error(f"Error interno: {str(e)}", 500)

@csrf_exempt
def listar_estudiantes(request):
    pre = _preflight(request)
    if pre: return pre

    if request.method != "GET":
        return _json_error("Método no permitido", 405)

    try:
        conn = _conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT id, nombre_completo, correo_institucional, numero_control,
                   carrera_actual, otra_carrera, semestre, habilidades, area_interes
            FROM estudiantes
            ORDER BY id DESC
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()
        return _corsify(JsonResponse({"success": True, "data": rows}))
    except Exception as e:
        return _json_error(str(e), 500)

@csrf_exempt
def perfil_estudiante(request, estudiante_id):
    pre = _preflight(request)
    if pre: return pre

    if request.method != "GET":
        return _json_error("Método no permitido", 405)

    try:
        conn = _conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM estudiantes WHERE id = %s", (estudiante_id,))
        row = cur.fetchone()
        cur.close(); conn.close()

        if not row:
            return _json_error("Estudiante no encontrado", 404)

        return _corsify(JsonResponse({"status": "success", "data": row, "tipo": "estudiante"}))
    except Exception as e:
        return _json_error(str(e), 500)

# ======================
# DOCENTES
# ======================
@csrf_exempt
def registrar_docente(request):
    pre = _preflight(request)
    if pre: return pre

    if request.method != "POST":
        return _json_error("Método no permitido. Usa POST.", 405)

    try:
        data = json.loads(request.body or "{}")
        campos_obligatorios = ["nombre_completo", "correo_institucional", "carrera_egreso"]
        for campo in campos_obligatorios:
            if not data.get(campo):
                return _json_error(f"Campo obligatorio faltante: {campo}", 400)

        conn = _conn()
        cur = conn.cursor()
        sql = """
            INSERT INTO docentes
            (nombre_completo, correo_institucional, carrera_egreso, carreras_imparte, grado_academico, habilidades, logros)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
        """
        valores = (
            data["nombre_completo"],
            data["correo_institucional"],
            data["carrera_egreso"],
            data.get("carreras_imparte", ""),
            data.get("grado_academico", ""),
            data.get("habilidades", ""),
            data.get("logros", ""),
        )
        cur.execute(sql, valores)
        conn.commit()

        cur.execute("SELECT LAST_INSERT_ID()")
        docente_id = cur.fetchone()[0]
        cur.close()
        conn.close()

        return _corsify(JsonResponse(
            {"status": "success", "message": "¡Docente registrado exitosamente!", "id": docente_id},
            status=201
        ))
    except mysql.connector.Error as e:
        return _json_error(f"Error de base de datos: {str(e)}", 500)
    except Exception as e:
        return _json_error(f"Error interno: {str(e)}", 500)

@csrf_exempt
def listar_docentes(request):
    pre = _preflight(request)
    if pre: return pre

    if request.method != "GET":
        return _json_error("Método no permitido", 405)

    try:
        conn = _conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT id, nombre_completo, correo_institucional, carrera_egreso,
                   carreras_imparte, grado_academico, habilidades, logros
            FROM docentes
            ORDER BY id DESC
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()
        return _corsify(JsonResponse({"success": True, "data": rows}))
    except Exception as e:
        return _json_error(str(e), 500)

@csrf_exempt
def perfil_docente(request, docente_id):
    pre = _preflight(request)
    if pre: return pre

    if request.method != "GET":
        return _json_error("Método no permitido", 405)

    try:
        conn = _conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM docentes WHERE id = %s", (docente_id,))
        row = cur.fetchone()
        cur.close(); conn.close()

        if not row:
            return _json_error("Docente no encontrado", 404)

        return _corsify(JsonResponse({"status": "success", "data": row, "tipo": "docente"}))
    except Exception as e:
        return _json_error(str(e), 500)

# ======================
# EGRESADOS
# ======================
@csrf_exempt
def registrar_egresado(request):
    pre = _preflight(request)
    if pre: return pre

    if request.method != "POST":
        return _json_error("Método no permitido. Usa POST.", 405)

    try:
        data = json.loads(request.body or "{}")
        campos_obligatorios = ["nombre_completo", "correo_institucional", "carrera_egreso", "anio_egreso"]
        for campo in campos_obligatorios:
            if not data.get(campo):
                return _json_error(f"Campo obligatorio faltante: {campo}", 400)

        try:
            anio = int(data["anio_egreso"])
            if anio < 1900 or anio > 2100:
                return _json_error("El año de egreso debe estar entre 1900 y 2100", 400)
        except ValueError:
            return _json_error("El año de egreso debe ser un número válido", 400)

        conn = _conn()
        cur = conn.cursor()
        sql = """
            INSERT INTO egresados
            (nombre_completo, correo_institucional, carrera_egreso, anio_egreso,
             ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, competencias)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """
        valores = (
            data["nombre_completo"],
            data["correo_institucional"],
            data["carrera_egreso"],
            anio,
            data.get("ocupacion_actual", ""),
            data.get("perfil_linkedin", ""),
            data.get("empresa", ""),
            data.get("puesto", ""),
            data.get("logros", ""),
            data.get("habilidades", ""),
            data.get("competencias", ""),
        )
        cur.execute(sql, valores)
        conn.commit()

        cur.execute("SELECT LAST_INSERT_ID()")
        egresado_id = cur.fetchone()[0]
        cur.close()
        conn.close()

        return _corsify(JsonResponse(
            {"status": "success", "message": "¡Egresado registrado exitosamente!", "id": egresado_id},
            status=201
        ))
    except mysql.connector.Error as e:
        return _json_error(f"Error de base de datos: {str(e)}", 500)
    except Exception as e:
        return _json_error(f"Error interno: {str(e)}", 500)

@csrf_exempt
def listar_egresados(request):
    pre = _preflight(request)
    if pre: return pre

    if request.method != "GET":
        return _json_error("Método no permitido", 405)

    try:
        conn = _conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT id, nombre_completo, correo_institucional, carrera_egreso, anio_egreso,
                   ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, competencias
            FROM egresados
            ORDER BY id DESC
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()
        return _corsify(JsonResponse({"success": True, "data": rows}))
    except Exception as e:
        return _json_error(str(e), 500)

@csrf_exempt
def perfil_egresado(request, egresado_id):
    pre = _preflight(request)
    if pre: return pre

    if request.method != "GET":
        return _json_error("Método no permitido", 405)

    try:
        conn = _conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM egresados WHERE id = %s", (egresado_id,))
        row = cur.fetchone()
        cur.close(); conn.close()

        if not row:
            return _json_error("Egresado no encontrado", 404)

        return _corsify(JsonResponse({"status": "success", "data": row, "tipo": "egresado"}))
    except Exception as e:
        return _json_error(str(e), 500)
