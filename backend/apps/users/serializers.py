from rest_framework import serializers
from .models import Estudiante, Docente, Egresado

class EstudianteSerializer(serializers.ModelSerializer):
    foto_url = serializers.SerializerMethodField()
    foto = serializers.ImageField(write_only=True, required=False)  # Campo para subir foto
    
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
            'foto_url',
            'foto',  # Campo para subir archivo
            'fecha_registro'
        ]
        read_only_fields = ['fecha_registro', 'foto_url']
    
    def get_foto_url(self, obj):
        """Genera URL para la foto o retorna la por defecto"""
        if obj.foto and hasattr(obj.foto, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.foto.url)
            return obj.foto.url
        # Imagen por defecto
        return '/static/images/default-avatar.png'

class DocenteSerializer(serializers.ModelSerializer):
    foto_url = serializers.SerializerMethodField()
    foto = serializers.ImageField(write_only=True, required=False)
    
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
            'foto_url',
            'foto',
            'fecha_registro'
        ]
        read_only_fields = ['fecha_registro', 'foto_url']
    
    def get_foto_url(self, obj):
        if obj.foto and hasattr(obj.foto, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.foto.url)
            return obj.foto.url
        return '/static/images/default-avatar.png'

class EgresadoSerializer(serializers.ModelSerializer):
    foto_url = serializers.SerializerMethodField()
    foto = serializers.ImageField(write_only=True, required=False)
    
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
            'foto_url',
            'foto',
            'fecha_registro'
        ]
        read_only_fields = ['fecha_registro', 'foto_url']
    
    def get_foto_url(self, obj):
        if obj.foto and hasattr(obj.foto, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.foto.url)
            return obj.foto.url
        return '/static/images/default-avatar.png'