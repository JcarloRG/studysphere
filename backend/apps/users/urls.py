from django.urls import path
from . import views

urlpatterns = [
    # Health
    path('api/health/', views.health, name='health'),

    # Registro
    path('api/estudiante/registrar/', views.registrar_estudiante, name='registrar_estudiante'),
    path('api/docente/registrar/', views.registrar_docente, name='registrar_docente'),
    path('api/egresado/registrar/', views.registrar_egresado, name='registrar_egresado'),

    # Perfiles individuales
    path('api/estudiante/<int:estudiante_id>/', views.perfil_estudiante, name='perfil_estudiante'),
    path('api/docente/<int:docente_id>/', views.perfil_docente, name='perfil_docente'),
    path('api/egresado/<int:egresado_id>/', views.perfil_egresado, name='perfil_egresado'),

    # Listados
    path('api/estudiantes/', views.listar_estudiantes, name='listar_estudiantes'),
    path('api/docentes/', views.listar_docentes, name='listar_docentes'),
    path('api/egresados/', views.listar_egresados, name='listar_egresados'),

    # Búsquedas
    path('api/estudiantes/buscar/', views.buscar_estudiantes, name='buscar_estudiantes'),
    path('api/docentes/buscar/', views.buscar_docentes, name='buscar_docentes'),
    path('api/egresados/buscar/', views.buscar_egresados, name='buscar_egresados'),

    # Verificación de correo
    path('api/email/enviar-codigo/', views.email_enviar_codigo, name='email_enviar_codigo'),
    path('api/email/reenviar/', views.email_reenviar_codigo, name='email_reenviar_codigo'),
    path('api/email/verificar/', views.email_verificar_codigo, name='email_verificar_codigo'),
]
