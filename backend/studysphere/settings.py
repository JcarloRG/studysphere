"""
Django settings for studysphere project.
Configurado para desarrollo local con conexión PostgreSQL, CORS y verificación de email.
"""

import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

# === Inicialización ===
load_dotenv()

# === Directorio base ===
BASE_DIR = Path(__file__).resolve().parent.parent

# === Seguridad ===
# DEBUG por defecto en False: si alguien despliega esto sin poner DEBUG=true
# explícitamente en su .env, que falle "seguro" (modo producción) en vez de
# quedar abierto en modo debug (que expone stack traces, variables, SQL, etc.)
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'

# La SECRET_KEY firma sesiones, tokens de administrador (django.core.signing)
# y los JWT de estudiantes/docentes/egresados. Ya NO tiene un valor por
# defecto "de verdad": si falta en producción (DEBUG=False), el proyecto se
# niega a arrancar en vez de usar una clave conocida/predecible.
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = 'django-insecure-solo-para-desarrollo-local-NO-USAR-EN-PRODUCCION'
    else:
        raise ImproperlyConfigured(
            'DJANGO_SECRET_KEY no está definida. Genera una con: '
            'python -c "from django.core.management.utils import get_random_secret_key; '
            'print(get_random_secret_key())" y agrégala a tu .env. '
            'No se permite arrancar en producción (DEBUG=False) sin ella.'
        )

# ALLOWED_HOSTS desde .env (coma-separados) o fallback seguro de dev
_env_allowed_hosts = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0')
ALLOWED_HOSTS = [h.strip() for h in _env_allowed_hosts.split(',') if h.strip()]
if not DEBUG and ALLOWED_HOSTS == ['localhost', '127.0.0.1', '0.0.0.0']:
    raise ImproperlyConfigured(
        'ALLOWED_HOSTS no está configurado para producción. Define el/los '
        'dominio(s) reales en la variable de entorno ALLOWED_HOSTS.'
    )

# === Aplicaciones instaladas ===
INSTALLED_APPS = [
    # Core Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Librerías externas
    'corsheaders',
    'rest_framework',

    # Apps locales
    'apps.users',
]

# === Configuración REST ===
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    # Renderizadores para evitar HTMLs accidentales
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',  # quítalo si no lo usas
    ],
}

# === JWT (rest_framework_simplejwt) ===
# Usado por apps/users/auth.py para emitir y validar los tokens de sesión
# de estudiantes/docentes/egresados (sustituye a las cabeceras X-User-Id /
# X-User-Tipo, que cualquiera podía falsificar).
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=int(os.getenv('JWT_ACCESS_LIFETIME_HOURS', '2'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_LIFETIME_DAYS', '7'))),
    'ROTATE_REFRESH_TOKENS': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# === Validación de contraseñas (Estudiante/Docente/Egresado/Admin) ===
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# === Middleware ===
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Debe ir lo más arriba posible
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',  # necesario para CORS
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'studysphere.urls'

# === Plantillas ===
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],  # puedes agregar rutas de templates si las usas
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'studysphere.wsgi.application'

# === Base de datos (PostgreSQL) ===
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.getenv('DB_NAME', 'studysphere'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', '127.0.0.1'),
        'PORT': os.getenv('DB_PORT', '5432'),
        # Mantiene la conexión abierta, mejora performance en dev
        'CONN_MAX_AGE': 60,
    }
}

# === Idioma y Zona Horaria ===
LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Mexico_City'
USE_I18N = True
USE_TZ = False  # Fechas "naive" (sin timezone) en toda la app, por simplicidad

# === Archivos estáticos ===
STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")] if os.path.isdir(os.path.join(BASE_DIR, "static")) else []
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# === CORS (para conexión con React) ===
# Si definiste CORS_ALLOWED_ORIGINS en .env, úsalo. Si no lo definiste, solo
# se permite "todo origen" en DEBUG (desarrollo local); en producción es
# obligatorio listar los orígenes reales, para no permitir que cualquier
# sitio web haga peticiones autenticadas contra la API.
_env_cors = os.getenv('CORS_ALLOWED_ORIGINS', '')
if _env_cors:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _env_cors.split(',') if o.strip()]
elif DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    raise ImproperlyConfigured(
        'CORS_ALLOWED_ORIGINS no está configurado para producción. Define '
        'el/los dominio(s) reales del frontend en esa variable de entorno.'
    )

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-user-id',
    'x-user-tipo',
    'x-admin-token',
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# === Cabeceras de seguridad (ISO/IEC 27001 - protección en tránsito) ===
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'same-origin'

if not DEBUG:
    # Solo forzamos HTTPS/cookies "secure" fuera de desarrollo local, donde
    # normalmente no hay TLS configurado.
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# === Email (para verificación de correo) ===
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "false").lower() == "true"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)
EMAIL_TIMEOUT = 15  # seg, útil cuando actives el envío

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

# === Políticas opcionales de dominios (puedes dejar vacías) ===
ALLOWED_EMAIL_DOMAINS = [
    d.strip().lower() for d in os.getenv('ALLOWED_EMAIL_DOMAINS', '').split(',') if d.strip()
]
BLOCKED_EMAIL_DOMAINS = [
    d.strip().lower() for d in os.getenv('BLOCKED_EMAIL_DOMAINS', '').split(',') if d.strip()
]

# === Config propia para verificación de email ===
EMAIL_VERIFICATION_EXP_MINUTES = int(os.getenv('EMAIL_VERIFICATION_EXP_MINUTES', '15'))

# === Health endpoint rápido (opcional) ===
HEALTH_CHECK_RESPONSE = {
    "status": "success",
    "message": "ok",
}

# === Logging simple (útil para ver errores en consola durante dev) ===
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO' if DEBUG else 'WARNING',
    },
}

# === Archivos estáticos y media (ACTUALIZADO) ===
STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")] 
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")  # Para producción

# Media files (archivos subidos por usuarios)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'