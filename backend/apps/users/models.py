from django.db import models

class Estudiante(models.Model):
    nombre_completo = models.CharField(max_length=150)
    correo_institucional = models.EmailField(max_length=120)
    numero_control = models.CharField(max_length=50)
    carrera_actual = models.CharField(max_length=150)
    otra_carrera = models.CharField(max_length=150, default='No')
    semestre = models.CharField(max_length=20, blank=True, null=True)
    habilidades = models.TextField(blank=True, null=True)
    area_interes = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre_completo

    class Meta:
        db_table = 'estudiantes'

class Docente(models.Model):
    GRADO_ACADEMICO_CHOICES = [
        ('Licenciatura', 'Licenciatura'),
        ('Maestría', 'Maestría'),
        ('Doctorado', 'Doctorado'),
        ('Especialización', 'Especialización'),
    ]
    
    nombre_completo = models.CharField(max_length=150)
    correo_institucional = models.EmailField(max_length=120)
    carrera_egreso = models.CharField(max_length=150)
    carreras_imparte = models.CharField(max_length=255, blank=True, null=True)
    grado_academico = models.CharField(max_length=100, choices=GRADO_ACADEMICO_CHOICES, blank=True, null=True)
    habilidades = models.TextField(blank=True, null=True)
    logros = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre_completo

    class Meta:
        db_table = 'docentes'

class Egresado(models.Model):
    nombre_completo = models.CharField(max_length=150)
    correo_institucional = models.EmailField(max_length=100)
    carrera_egreso = models.CharField(max_length=150)
    anio_egreso = models.IntegerField()
    ocupacion_actual = models.CharField(max_length=150, blank=True, null=True)
    perfil_linkedin = models.URLField(max_length=255, blank=True, null=True)
    empresa = models.CharField(max_length=150, blank=True, null=True)
    puesto = models.CharField(max_length=150, blank=True, null=True)
    logros = models.TextField(blank=True, null=True)
    habilidades = models.TextField(blank=True, null=True)
    competencias = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre_completo

    class Meta:
        db_table = 'egresados'