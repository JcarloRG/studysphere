# admin.py
from django.contrib import admin
from .models import Estudiante, Docente, Egresado

@admin.register(Estudiante)
class EstudianteAdmin(admin.ModelAdmin):
    list_display = ['nombre_completo', 'correo_institucional', 'carrera_actual', 'semestre']
    search_fields = ['nombre_completo', 'correo_institucional']

@admin.register(Docente)
class DocenteAdmin(admin.ModelAdmin):
    list_display = ['nombre_completo', 'correo_institucional', 'carrera_egreso', 'grado_academico']
    search_fields = ['nombre_completo', 'correo_institucional']

@admin.register(Egresado)
class EgresadoAdmin(admin.ModelAdmin):
    list_display = ['nombre_completo', 'correo_institucional', 'carrera_egreso', 'empresa']
    search_fields = ['nombre_completo', 'correo_institucional']
