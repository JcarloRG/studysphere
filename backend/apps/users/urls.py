# apps/users/urls.py
from django.urls import path
from .views import (
    health, login_user,
    registrar_estudiante, registrar_docente, registrar_egresado,
    listar_estudiantes, listar_docentes, listar_egresados,
    perfil_estudiante, perfil_docente, perfil_egresado,
    request_email_code, verify_email_code,
    actualizar_foto_estudiante,
)

urlpatterns = [
    # Health
    path('api/health/', health),

    # Auth / Login
    path('api/login/', login_user),

    # ====== REGISTROS ======
    # OJO: coinciden con api.js
    path('api/estudiante/registrar/', registrar_estudiante),
    path('api/docente/registrar/', registrar_docente),
    path('api/egresado/registrar/', registrar_egresado),

    # ====== LISTADOS ======
    path('api/estudiantes/', listar_estudiantes),
    path('api/docentes/', listar_docentes),
    path('api/egresados/', listar_egresados),

    # ====== PERFILES (detalle) ======
    path('api/estudiante/<int:estudiante_id>/', perfil_estudiante),
    path('api/docente/<int:docente_id>/', perfil_docente),
    path('api/egresado/<int:egresado_id>/', perfil_egresado),

    # ====== EMAIL ======
    path('api/email/request_code/', request_email_code),
    path('api/email/verify_code/', verify_email_code),

    # ====== FOTO (estudiante) ======
    path('api/estudiantes/<int:estudiante_id>/foto/', actualizar_foto_estudiante),
]
