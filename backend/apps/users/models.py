from django.db import models

class Estudiante(models.Model):
    nombre_completo = models.CharField(max_length=150)
    correo_institucional = models.EmailField(max_length=120)
    password_hash = models.CharField(max_length=255)
    numero_control = models.CharField(max_length=50)
    carrera_actual = models.CharField(max_length=150)
    otra_carrera = models.CharField(max_length=150, default='No')
    semestre = models.CharField(max_length=20, blank=True, null=True)
    habilidades = models.TextField(blank=True, null=True)
    area_interes = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    email_verified = models.BooleanField(default=False)
    email_verify_token = models.CharField(max_length=64, blank=True, null=True)
    email_verify_expires = models.DateTimeField(blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)

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
    password_hash = models.CharField(max_length=255)
    carrera_egreso = models.CharField(max_length=150)
    carreras_imparte = models.CharField(max_length=255, blank=True, null=True)
    grado_academico = models.CharField(max_length=100, choices=GRADO_ACADEMICO_CHOICES, blank=True, null=True)
    habilidades = models.TextField(blank=True, null=True)
    logros = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    email_verified = models.BooleanField(default=False)
    email_verify_token = models.CharField(max_length=64, blank=True, null=True)
    email_verify_expires = models.DateTimeField(blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.nombre_completo

    class Meta:
        db_table = 'docentes'

class Egresado(models.Model):
    nombre_completo = models.CharField(max_length=150)
    correo_institucional = models.EmailField(max_length=100)
    password_hash = models.CharField(max_length=255)
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
    email_verified = models.BooleanField(default=False)
    email_verify_token = models.CharField(max_length=64, blank=True, null=True)
    email_verify_expires = models.DateTimeField(blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.nombre_completo

    class Meta:
        db_table = 'egresados'

class EmailVerification(models.Model):
    PURPOSE_CHOICES = [
        ('signup', 'Registro'),
        ('login', 'Inicio de sesión'),
        ('reset', 'Restablecer contraseña'),
    ]
    
    TIPO_CHOICES = [
        ('estudiante', 'Estudiante'),
        ('docente', 'Docente'),
        ('egresado', 'Egresado'),
    ]
    
    email = models.EmailField(max_length=255)
    code = models.CharField(max_length=6)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='estudiante')
    perfil_id = models.IntegerField(blank=True, null=True)
    purpose = models.CharField(max_length=50, choices=PURPOSE_CHOICES, default='signup')
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.email} - {self.code}"

    class Meta:
        db_table = 'email_verifications'
        unique_together = ['email', 'purpose']

class Match(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aceptado', 'Aceptado'),
        ('rechazado', 'Rechazado'),
    ]
    
    TIPO_CHOICES = [
        ('estudiante', 'Estudiante'),
        ('docente', 'Docente'),
        ('egresado', 'Egresado'),
    ]
    
    usuario_id = models.IntegerField()
    usuario_tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    perfil_match_id = models.IntegerField()
    perfil_match_tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    compatibilidad = models.IntegerField()
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    fecha_match = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.usuario_tipo}_{self.usuario_id} -> {self.perfil_match_tipo}_{self.perfil_match_id}"

    class Meta:
        db_table = 'matches'
        unique_together = ['usuario_id', 'usuario_tipo', 'perfil_match_id', 'perfil_match_tipo']

class UserPreference(models.Model):
    TIPO_COLABORACION_CHOICES = [
        ('proyecto', 'Proyecto'),
        ('investigacion', 'Investigación'),
        ('startup', 'Startup'),
        ('estudio', 'Estudio'),
    ]
    
    TIPO_CHOICES = [
        ('estudiante', 'Estudiante'),
        ('docente', 'Docente'),
        ('egresado', 'Egresado'),
    ]
    
    usuario_id = models.IntegerField()
    usuario_tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    habilidades_buscadas = models.TextField(blank=True, null=True)
    intereses_buscados = models.TextField(blank=True, null=True)
    tipo_colaboracion = models.CharField(max_length=20, choices=TIPO_COLABORACION_CHOICES, default='proyecto')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferencias de {self.usuario_tipo}_{self.usuario_id}"

    class Meta:
        db_table = 'user_preferences'
        unique_together = ['usuario_id', 'usuario_tipo']