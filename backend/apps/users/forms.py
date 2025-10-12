from django import forms
from .models import Estudiante, Docente, Egresado

class EstudianteForm(forms.ModelForm):
    class Meta:
        model = Estudiante
        fields = [
            'nombre_completo', 
            'correo_institucional', 
            'numero_control', 
            'carrera_actual',
            'otra_carrera',
            'semestre',
            'habilidades',
            'area_interes'
        ]
        widgets = {
            'nombre_completo': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre completo'
            }),
            'correo_institucional': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'correo@institucion.edu'
            }),
            'numero_control': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Número de control'
            }),
            'carrera_actual': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Carrera actual'
            }),
            'semestre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Semestre'
            }),
            'habilidades': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Tus habilidades principales'
            }),
            'area_interes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Áreas de interés académico/profesional'
            })
        }
        labels = {
            'nombre_completo': 'Nombre Completo',
            'correo_institucional': 'Correo Institucional',
            'numero_control': 'Número de Control',
            'carrera_actual': 'Carrera Actual',
            'otra_carrera': '¿Otra Carrera?',
            'semestre': 'Semestre',
            'habilidades': 'Habilidades',
            'area_interes': 'Área de Interés'
        }

class DocenteForm(forms.ModelForm):
    class Meta:
        model = Docente
        fields = [
            'nombre_completo',
            'correo_institucional',
            'carrera_egreso',
            'carreras_imparte',
            'grado_academico',
            'habilidades',
            'logros'
        ]
        widgets = {
            'nombre_completo': forms.TextInput(attrs={'class': 'form-control'}),
            'correo_institucional': forms.EmailInput(attrs={'class': 'form-control'}),
            'carrera_egreso': forms.TextInput(attrs={'class': 'form-control'}),
            'carreras_imparte': forms.TextInput(attrs={'class': 'form-control'}),
            'grado_academico': forms.TextInput(attrs={'class': 'form-control'}),
            'habilidades': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'logros': forms.Textarea(attrs={'class': 'form-control', 'rows': 3})
        }

class EgresadoForm(forms.ModelForm):
    class Meta:
        model = Egresado
        fields = [
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
            'competencias'
        ]
        widgets = {
            'nombre_completo': forms.TextInput(attrs={'class': 'form-control'}),
            'correo_institucional': forms.EmailInput(attrs={'class': 'form-control'}),
            'carrera_egreso': forms.TextInput(attrs={'class': 'form-control'}),
            'anio_egreso': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 1900,
                'max': 2030
            }),
            'ocupacion_actual': forms.TextInput(attrs={'class': 'form-control'}),
            'perfil_linkedin': forms.URLInput(attrs={'class': 'form-control'}),
            'empresa': forms.TextInput(attrs={'class': 'form-control'}),
            'puesto': forms.TextInput(attrs={'class': 'form-control'}),
            'logros': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'habilidades': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'competencias': forms.Textarea(attrs={'class': 'form-control', 'rows': 3})
        }