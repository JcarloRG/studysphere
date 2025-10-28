# apps/users/admin.py
from django.contrib import admin
from .models import Estudiante, Docente, Egresado

@admin.register(Estudiante)
class EstudianteAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'nombre_completo', 'correo_institucional',
        'carrera_actual', 'semestre', 'fecha_registro'
    )
    search_fields = ('nombre_completo', 'correo_institucional', 'numero_control', 'carrera_actual')
    list_filter = ('carrera_actual', 'semestre')
    readonly_fields = ('fecha_registro',)

@admin.register(Docente)
class DocenteAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'nombre_completo', 'correo_institucional',
        'carrera_egreso', 'grado_academico', 'fecha_registro'
    )
    search_fields = ('nombre_completo', 'correo_institucional', 'carrera_egreso', 'grado_academico')
    list_filter = ('carrera_egreso', 'grado_academico')
    readonly_fields = ('fecha_registro',)

@admin.register(Egresado)
class EgresadoAdmin(admin.ModelAdmin):
    # ⚠️ Solo campos que EXISTEN en tu modelo Egresado actual
    list_display = (
        'id', 'nombre_completo', 'correo_institucional',
        'carrera_egreso', 'anio_egreso', 'fecha_registro'
    )
    search_fields = ('nombre_completo', 'correo_institucional', 'carrera_egreso', 'anio_egreso')
    list_filter = ('carrera_egreso', 'anio_egreso')
    readonly_fields = ('fecha_registro',)
