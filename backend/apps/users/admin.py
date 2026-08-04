# apps/users/admin.py
from django.contrib import admin
from .models import Estudiante, Docente, Egresado, AdminUser

@admin.register(AdminUser)
class AdminUserAdmin(admin.ModelAdmin):
    # password_hash nunca se muestra en texto plano; las cuentas se crean
    # con `python manage.py crear_admin`, no desde aquí.
    list_display = ('id', 'username', 'nombre', 'is_active', 'created_at', 'last_login')
    list_filter = ('is_active',)
    search_fields = ('username', 'nombre')
    readonly_fields = ('password_hash', 'created_at', 'last_login')

@admin.register(Estudiante)
class EstudianteAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'nombre', 'apellido_paterno', 'correo_institucional',
        'carrera_actual', 'semestre', 'fecha_registro'
    )
    search_fields = ('nombre', 'apellido_paterno', 'correo_institucional', 'carrera_actual')
    list_filter = ('carrera_actual', 'semestre')
    readonly_fields = ('fecha_registro',)

@admin.register(Docente)
class DocenteAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'nombre', 'apellido_paterno', 'correo_institucional',
        'carrera_egreso', 'grado_academico', 'fecha_registro'
    )
    search_fields = ('nombre', 'apellido_paterno', 'correo_institucional', 'carrera_egreso', 'grado_academico')
    list_filter = ('carrera_egreso', 'grado_academico')
    readonly_fields = ('fecha_registro',)

@admin.register(Egresado)
class EgresadoAdmin(admin.ModelAdmin):
    # ⚠️ Solo campos que EXISTEN en tu modelo Egresado actual
    list_display = (
        'id', 'nombre', 'apellido_paterno', 'correo_institucional',
        'carrera_egreso', 'anio_egreso', 'fecha_registro'
    )
    search_fields = ('nombre', 'apellido_paterno', 'correo_institucional', 'carrera_egreso', 'anio_egreso')
    list_filter = ('carrera_egreso', 'anio_egreso')
    readonly_fields = ('fecha_registro',)