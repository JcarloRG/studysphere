from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import mysql.connector

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
        print("📝 Datos recibidos:", data)
        
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
        
    except Exception as e:
        print("❌ ERROR:", str(e))
        response = JsonResponse({
            'status': 'error',
            'message': f'Error interno: {str(e)}'
        }, status=500)
        response["Access-Control-Allow-Origin"] = "*"
        return response