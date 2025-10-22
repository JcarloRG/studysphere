# apps/users/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Health
    path('api/health/', views.health, name='health'),

    # LOGIN (NUEVA RUTA)
    path('api/login/', views.login_user, name='login_user'),

    # Registro
    path('api/estudiante/registrar/', views.registrar_estudiante, name='registrar_estudiante'),
    path('api/docente/registrar/', views.registrar_docente, name='registrar_docente'),
    path('api/egresado/registrar/', views.registrar_egresado, name='registrar_egresado'),

    # Listados
    path('api/estudiantes/', views.listar_estudiantes, name='listar_estudiantes'),
    path('api/docentes/', views.listar_docentes, name='listar_docentes'),
    path('api/egresados/', views.listar_egresados, name='listar_egresados'),

    # Perfiles
    path('api/estudiante/<int:estudiante_id>/', views.perfil_estudiante, name='perfil_estudiante'),
    path('api/docente/<int:docente_id>/', views.perfil_docente, name='perfil_docente'),
    path('api/egresado/<int:egresado_id>/', views.perfil_egresado, name='perfil_egresado'),

    # Verificación de email
    path('api/email/request_code/', views.request_email_code, name='request_email_code'),
    path('api/email/verify_code/', views.verify_email_code, name='verify_email_code'),
]