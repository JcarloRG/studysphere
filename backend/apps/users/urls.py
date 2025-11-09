# apps/users/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/health/', views.health),

    # listados
    path('api/estudiantes/', views.listar_estudiantes),
    path('api/docentes/', views.listar_docentes),
    path('api/egresados/', views.listar_egresados),

    # perfiles
    path('api/estudiante/<int:estudiante_id>/', views.perfil_estudiante),
    path('api/docente/<int:docente_id>/', views.perfil_docente),
    path('api/egresado/<int:egresado_id>/', views.perfil_egresado),

    # login
    path('api/login/', views.login_user),

    # registro
    path('api/estudiante/registrar/', views.registrar_estudiante),
    path('api/docente/registrar/', views.registrar_docente),
    path('api/egresado/registrar/', views.registrar_egresado),

    # email
    path('api/email/request_code/', views.request_email_code),
    path('api/email/verify_code/', views.verify_email_code),

    # foto estudiante
    path('api/estudiantes/<int:estudiante_id>/foto/', views.actualizar_foto_estudiante),

    # Nuevas rutas para eliminar registros
    path('api/estudiante/<int:id>/delete/', views.eliminar_estudiante, name='eliminar_estudiante'),
    path('api/docente/<int:id>/delete/', views.eliminar_docente, name='eliminar_docente'),
    path('api/egresado/<int:id>/delete/', views.eliminar_egresado, name='eliminar_egresado'),
]
