import mysql.connector

print("🧪 Probando conexión a MySQL...")

try:
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='',
        database='studysphere'
    )
    print("✅ Conexión a MySQL exitosa")
    
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    print("✅ Consulta SQL funciona")
    
    # Probar inserción
    cursor.execute("""
        INSERT INTO estudiantes 
        (nombre_completo, correo_institucional, numero_control, carrera_actual) 
        VALUES (%s, %s, %s, %s)
    """, ("Test User", "test@test.com", "TEST123", "Ingeniería"))
    conn.commit()
    print("✅ Inserción en la base de datos funciona")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")