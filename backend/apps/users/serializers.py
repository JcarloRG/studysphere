from rest_framework import serializers
from .models import Estudiante, Docente, Egresado

class EstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudiante
        fields = '__all__'

class DocenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Docente
        fields = '__all__'

class EgresadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Egresado
        fields = '__all__'