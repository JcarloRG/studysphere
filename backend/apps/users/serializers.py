from rest_framework import serializers
from .models import Estudiante, Docente, Egresado

class EstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudiante
        fields = [
            'id',
            'nombre_completo', 
            'correo_institucional',
            'numero_control',
            'carrera_actual',
            'otra_carrera', 
            'semestre',
            'habilidades',
            'area_interes',
            'fecha_registro'
            # Excluimos password_hash, email_verified, etc.
        ]

class DocenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Docente
        fields = [
            'id',
            'nombre_completo',
            'correo_institucional',
            'carrera_egreso',
            'carreras_imparte',
            'grado_academico',
            'habilidades',
            'logros',
            'fecha_registro'
        ]

class EgresadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Egresado
        fields = [
            'id',
            'nombre_completo',
            'correo_institucional',
            'carrera_egreso',
            'anio_egreso',
            'ocupacion_actual',
            'perfil_linkedin',
            'empresa',
            'puesto',
            'logros',
            'habilidades',
            'competencias',
            'fecha_registro'
        ]