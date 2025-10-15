"""
Django settings for studysphere project.
Configurado para desarrollo local con conexión MySQL y CORS habilitado.
"""

import os
from pathlib import Path
import pymysql
from dotenv import load_dotenv

# === Inicialización ===
pymysql.install_as_MySQLdb()
load_dotenv()

# === Directorio base ===
BASE_DIR = Path(__file__).resolve().parent.parent

# === Seguridad (modo dev) ===
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-clave-temporal')
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

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
    ]
}

# === Middleware ===
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Debe ir arriba
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
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
        'DIRS': [],
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

# === Base de datos (MySQL) ===
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.mysql'),
        'NAME': os.getenv('DB_NAME', 'studysphere'),
        'USER': os.getenv('DB_USER', 'root'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', '127.0.0.1'),
        'PORT': os.getenv('DB_PORT', '3306'),
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
}

# === Idioma y Zona Horaria ===
LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Mexico_City'
USE_I18N = True
USE_TZ = False  # Evita problemas con MySQL y DATETIME

# === Archivos estáticos ===
STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")]
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# === CORS (para conexión con React) ===
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# === Email (para verificación de correo) ===
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "false").lower() == "true"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)

# === Políticas opcionales de dominios (puedes dejar vacías) ===
ALLOWED_EMAIL_DOMAINS = [
    d.strip().lower() for d in os.getenv('ALLOWED_EMAIL_DOMAINS', '').split(',') if d.strip()
]
BLOCKED_EMAIL_DOMAINS = [
    d.strip().lower() for d in os.getenv('BLOCKED_EMAIL_DOMAINS', '').split(',') if d.strip()
]

# === Extra: Health endpoint rápido ===
HEALTH_CHECK_RESPONSE = {
    "status": "success",
    "message": "ok",
}
