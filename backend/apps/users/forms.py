# Archivo: apps/users/forms.py (o donde tengas tu forms.py)

from django import forms
from .models import Estudiante, Docente, Egresado

# =================================================================
# NUEVO FORMULARIO PARA INICIO DE SESIÓN
# =================================================================

class LoginForm(forms.Form):
    """
    Formulario básico de inicio de sesión que solicita el correo
    institucional y la contraseña.
    """
    correo_institucional = forms.EmailField(
        label="Correo Institucional",
        max_length=120,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'tu_correo@institucion.edu'
        })
    )
    password = forms.CharField(
        label="Contraseña",
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Tu contraseña'
        })
    )

# =================================================================
# FORMULARIOS EXISTENTES
# =================================================================

# En users/forms.py - MODIFICAR los formularios existentes

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
            'area_interes',
            'foto'  # <-- AGREGAR ESTE CAMPO
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
            }),
            'foto': forms.FileInput(attrs={  # <-- AGREGAR ESTE WIDGET
                'class': 'form-control',
                'accept': 'image/*'
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
            'area_interes': 'Área de Interés',
            'foto': 'Foto de Perfil'  # <-- AGREGAR ESTE LABEL
        }

class DocenteForm(forms.ModelForm):
    class Meta:
        model = Docente
        fields = [
            'nombre_completo',
            'correo_institucional',
            'carrera_egreso',
            'grado_academico',
            'habilidades',
            'area_interes',
            'foto'  # <-- AGREGAR ESTE CAMPO
        ]
        widgets = {
            'nombre_completo': forms.TextInput(attrs={'class': 'form-control'}),
            'correo_institucional': forms.EmailInput(attrs={'class': 'form-control'}),
            'carrera_egreso': forms.TextInput(attrs={'class': 'form-control'}),
            'grado_academico': forms.Select(attrs={'class': 'form-control'}),  # Cambiado a Select
            'habilidades': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'area_interes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'foto': forms.FileInput(attrs={  # <-- AGREGAR ESTE WIDGET
                'class': 'form-control',
                'accept': 'image/*'
            })
        }
        labels = {
            'foto': 'Foto de Perfil'  # <-- AGREGAR ESTE LABEL
        }

class EgresadoForm(forms.ModelForm):
    class Meta:
        model = Egresado
        fields = [
            'nombre_completo',
            'correo_institucional',
            'carrera_egreso',
            'anio_egreso',
            'habilidades',
            'area_interes',
            'foto'  # <-- AGREGAR ESTE CAMPO
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
            'habilidades': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'area_interes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'foto': forms.FileInput(attrs={  # <-- AGREGAR ESTE WIDGET
                'class': 'form-control',
                'accept': 'image/*'
            })
        }
        labels = {
            'foto': 'Foto de Perfil'  # <-- AGREGAR ESTE LABEL
        }