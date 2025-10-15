from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json


# ========== ESTUDIANTES ==========

@csrf_exempt
def registrar_estudiante(request):
    print("🎯 REGISTRAR ESTUDIANTE - Endpoint llamado")
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({'status': 'ok'})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS, GET"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    
    if request.method != 'POST':
        return JsonResponse({
            'status': 'error',
            'message': 'Método no permitido. Usa POST.'
        }, status=405)
    
    try:
        # Obtener datos
        data = json.loads(request.body)
        print("📝 Datos estudiante recibidos:", data)
        
        # Validar campos obligatorios
        campos_obligatorios = ['nombre_completo', 'correo_institucional', 'numero_control', 'carrera_actual']
        for campo in campos_obligatorios:
            if not data.get(campo):
                response = JsonResponse({
                    'status': 'error',
                    'message': f'Campo obligatorio faltante: {campo}'
                }, status=400)
                response["Access-Control-Allow-Origin"] = "*"
                return response
        
        # Conexión a MySQL
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='studysphere'
        )
        cursor = conn.cursor()
        
        # Insertar estudiante
        sql = """
        INSERT INTO estudiantes 
        (nombre_completo, correo_institucional, numero_control, carrera_actual, otra_carrera, semestre, habilidades, area_interes) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
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
        conn.commit()
        
        # Obtener ID
        cursor.execute("SELECT LAST_INSERT_ID()")
        result = cursor.fetchone()
        estudiante_id = result[0] if result else None
        
        cursor.close()
        conn.close()
        
        print(f"✅ ESTUDIANTE GUARDADO EN BD - ID: {estudiante_id}")
        
        response = JsonResponse({
            'status': 'success',
            'message': '¡Estudiante registrado exitosamente!',
            'id': estudiante_id
        }, status=201)
        response["Access-Control-Allow-Origin"] = "*"
        return response
        
    except mysql.connector.Error as e:
        print("❌ ERROR MySQL:", str(e))
        response = JsonResponse({
            'status': 'error',
            'message': f'Error de base de datos: {str(e)}'
        }, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response
    except Exception as e:
        print("❌ ERROR general:", str(e))
        response = JsonResponse({
            'status': 'error',
            'message': f'Error interno: {str(e)}'
        }, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response

# ========== DOCENTES ==========

@csrf_exempt
def registrar_docente(request):
    print("🎯 REGISTRAR DOCENTE - Endpoint llamado")
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({'status': 'ok'})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS, GET"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    
    if request.method != 'POST':
        return JsonResponse({
            'status': 'error',
            'message': 'Método no permitido. Usa POST.'
        }, status=405)
    
    try:
        # Obtener datos
        data = json.loads(request.body)
        print("📝 Datos docente recibidos:", data)
        
        # Validar campos obligatorios
        campos_obligatorios = ['nombre_completo', 'correo_institucional', 'carrera_egreso']
        for campo in campos_obligatorios:
            if not data.get(campo):
                response = JsonResponse({
                    'status': 'error',
                    'message': f'Campo obligatorio faltante: {campo}'
                }, status=400)
                response["Access-Control-Allow-Origin"] = "*"
                return response
        
        print("🔍 Conectando a MySQL para docente...")
        # Conexión a MySQL
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='studysphere'
        )
        print("✅ Conexión MySQL exitosa para docente")
        
        cursor = conn.cursor()
        
        # Insertar docente
        sql = """
        INSERT INTO docentes 
        (nombre_completo, correo_institucional, carrera_egreso, carreras_imparte, grado_academico, habilidades, logros) 
        VALUES (%s, %s, %s, %s, %s, %s, %s)
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
        
        print(f"🔍 Ejecutando SQL para docente: {sql}")
        print(f"🔍 Valores para docente: {valores}")
        
        cursor.execute(sql, valores)
        print("✅ SQL ejecutado para docente")
        
        conn.commit()
        print("✅ Commit realizado para docente")
        
        # Obtener ID
        cursor.execute("SELECT LAST_INSERT_ID()")
        result = cursor.fetchone()
        docente_id = result[0] if result else None
        
        cursor.close()
        conn.close()
        
        print(f"✅ DOCENTE GUARDADO EN BD - ID: {docente_id}")
        
        response = JsonResponse({
            'status': 'success',
            'message': '¡Docente registrado exitosamente!',
            'id': docente_id
        }, status=201)
        response["Access-Control-Allow-Origin"] = "*"
        return response
        
    except mysql.connector.Error as e:
        print(f"❌ ERROR MySQL en docente: {str(e)}")
        print(f"❌ Código de error: {e.errno}")
        print(f"❌ Estado SQL: {e.sqlstate}")
        response = JsonResponse({
            'status': 'error',
            'message': f'Error de base de datos: {str(e)}'
        }, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response
    except Exception as e:
        print(f"❌ ERROR general en docente: {str(e)}")
        import traceback
        print(f"❌ Traceback completo: {traceback.format_exc()}")
        response = JsonResponse({
            'status': 'error',
            'message': f'Error interno: {str(e)}'
        }, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response

# ========== EGRESADOS ==========

@csrf_exempt
def registrar_egresado(request):
    print("🎯 REGISTRAR EGRESADO - Endpoint llamado")
    
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({'status': 'ok'})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS, GET"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    
    if request.method != 'POST':
        return JsonResponse({
            'status': 'error',
            'message': 'Método no permitido. Usa POST.'
        }, status=405)
    
    try:
        # Obtener datos
        data = json.loads(request.body)
        print("📝 Datos egresado recibidos:", data)
        
        # Validar campos obligatorios
        campos_obligatorios = ['nombre_completo', 'correo_institucional', 'carrera_egreso', 'anio_egreso']
        for campo in campos_obligatorios:
            if not data.get(campo):
                response = JsonResponse({
                    'status': 'error',
                    'message': f'Campo obligatorio faltante: {campo}'
                }, status=400)
                response["Access-Control-Allow-Origin"] = "*"
                return response
        
        # Validar año de egreso
        try:
            anio_egreso = int(data['anio_egreso'])
            if anio_egreso < 1900 or anio_egreso > 2025:
                response = JsonResponse({
                    'status': 'error',
                    'message': 'El año de egreso debe estar entre 1900 y 2025'
                }, status=400)
                response["Access-Control-Allow-Origin"] = "*"
                return response
        except ValueError:
            response = JsonResponse({
                'status': 'error',
                'message': 'El año de egreso debe ser un número válido'
            }, status=400)
            response["Access-Control-Allow-Origin"] = "*"
            return response
        
        print("🔍 Conectando a MySQL para egresado...")
        # Conexión a MySQL
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='studysphere'
        )
        print("✅ Conexión MySQL exitosa para egresado")
        
        cursor = conn.cursor()
        
        # Insertar egresado
        sql = """
        INSERT INTO egresados 
        (nombre_completo, correo_institucional, carrera_egreso, anio_egreso, ocupacion_actual, perfil_linkedin, empresa, puesto, logros, habilidades, competencias) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
        
        print(f"🔍 Ejecutando SQL para egresado: {sql}")
        print(f"🔍 Valores para egresado: {valores}")
        
        cursor.execute(sql, valores)
        print("✅ SQL ejecutado para egresado")
        
        conn.commit()
        print("✅ Commit realizado para egresado")
        
        # Obtener ID
        cursor.execute("SELECT LAST_INSERT_ID()")
        result = cursor.fetchone()
        egresado_id = result[0] if result else None
        
        cursor.close()
        conn.close()
        
        print(f"✅ EGRESADO GUARDADO EN BD - ID: {egresado_id}")
        
        response = JsonResponse({
            'status': 'success',
            'message': '¡Egresado registrado exitosamente!',
            'id': egresado_id
        }, status=201)
        response["Access-Control-Allow-Origin"] = "*"
        return response
        
    except mysql.connector.Error as e:
        print(f"❌ ERROR MySQL en egresado: {str(e)}")
        print(f"❌ Código de error: {e.errno}")
        print(f"❌ Estado SQL: {e.sqlstate}")
        response = JsonResponse({
            'status': 'error',
            'message': f'Error de base de datos: {str(e)}'
        }, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response
    except Exception as e:
        print(f"❌ ERROR general en egresado: {str(e)}")
        import traceback
        print(f"❌ Traceback completo: {traceback.format_exc()}")
        response = JsonResponse({
            'status': 'error',
            'message': f'Error interno: {str(e)}'
        }, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response
    


# ========== PERFILES INDIVIDUALES ==========

@csrf_exempt
def perfil_estudiante(request, estudiante_id):
    """Obtener perfil de un estudiante específico"""
    if request.method == 'OPTIONS':
        response = JsonResponse({'status': 'ok'})
        response["Access-Control-Allow-Origin"] = "*"
        return response
        
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        conn = mysql.connector.connect(
            host='localhost', user='root', password='', database='studysphere'
        )
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM estudiantes WHERE id = %s", (estudiante_id,))
        estudiante = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if estudiante:
            response = JsonResponse({
                'status': 'success',
                'data': estudiante,
                'tipo': 'estudiante'
            })
            response["Access-Control-Allow-Origin"] = "*"
            return response
        else:
            response = JsonResponse({
                'status': 'error',
                'message': 'Estudiante no encontrado'
            }, status=404)
            response["Access-Control-Allow-Origin"] = "*"
            return response
            
    except Exception as e:
        response = JsonResponse({'error': str(e)}, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response

@csrf_exempt
def perfil_docente(request, docente_id):
    """Obtener perfil de un docente específico"""
    if request.method == 'OPTIONS':
        response = JsonResponse({'status': 'ok'})
        response["Access-Control-Allow-Origin"] = "*"
        return response
        
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        conn = mysql.connector.connect(
            host='localhost', user='root', password='', database='studysphere'
        )
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM docentes WHERE id = %s", (docente_id,))
        docente = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if docente:
            response = JsonResponse({
                'status': 'success',
                'data': docente,
                'tipo': 'docente'
            })
            response["Access-Control-Allow-Origin"] = "*"
            return response
        else:
            response = JsonResponse({
                'status': 'error',
                'message': 'Docente no encontrado'
            }, status=404)
            response["Access-Control-Allow-Origin"] = "*"
            return response
            
    except Exception as e:
        response = JsonResponse({'error': str(e)}, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response

@csrf_exempt
def perfil_egresado(request, egresado_id):
    """Obtener perfil de un egresado específico"""
    if request.method == 'OPTIONS':
        response = JsonResponse({'status': 'ok'})
        response["Access-Control-Allow-Origin"] = "*"
        return response
        
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        conn = mysql.connector.connect(
            host='localhost', user='root', password='', database='studysphere'
        )
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM egresados WHERE id = %s", (egresado_id,))
        egresado = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if egresado:
            response = JsonResponse({
                'status': 'success',
                'data': egresado,
                'tipo': 'egresado'
            })
            response["Access-Control-Allow-Origin"] = "*"
            return response
        else:
            response = JsonResponse({
                'status': 'error',
                'message': 'Egresado no encontrado'
            }, status=404)
            response["Access-Control-Allow-Origin"] = "*"
            return response
            
    except Exception as e:
        response = JsonResponse({'error': str(e)}, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response