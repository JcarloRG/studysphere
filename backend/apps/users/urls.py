# apps/users/urls.py

from django.urls import path
from . import views
from . import admin_views

urlpatterns = [
    # ===================== PANEL DE ADMINISTRACIÓN =====================
    path('api/admin/login/', admin_views.admin_login),
    path('api/admin/me/', admin_views.admin_me),
    path('api/admin/stats/', admin_views.admin_stats),

    path('api/admin/estudiantes/', admin_views.admin_estudiantes),
    path('api/admin/docentes/', admin_views.admin_docentes),
    path('api/admin/egresados/', admin_views.admin_egresados),

    path('api/admin/estudiante/<int:id>/delete/', admin_views.admin_eliminar_estudiante),
    path('api/admin/docente/<int:id>/delete/', admin_views.admin_eliminar_docente),
    path('api/admin/egresado/<int:id>/delete/', admin_views.admin_eliminar_egresado),

    path('api/admin/proyectos/', admin_views.admin_proyectos),
    path('api/admin/proyecto/<int:id>/delete/', admin_views.admin_eliminar_proyecto),

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
    path('api/token/refresh/', views.token_refresh),

    # registro
    path('api/estudiante/registrar/', views.registrar_estudiante),
    path('api/docente/registrar/', views.registrar_docente),
    path('api/egresado/registrar/', views.registrar_egresado),

    # email
    path('api/email/request_code/', views.request_email_code),
    path('api/email/verify_code/', views.verify_email_code),

    # ===================== FOTOS - NUEVAS RUTAS =====================

    # Actualizar fotos
    path('api/estudiante/<int:estudiante_id>/foto/', views.actualizar_foto_estudiante),
    path('api/docente/<int:docente_id>/foto/', views.actualizar_foto_docente),
    path('api/egresado/<int:egresado_id>/foto/', views.actualizar_foto_egresado),
    
    # Eliminar fotos (restablecer a default)
    path('api/estudiante/<int:estudiante_id>/foto/eliminar/', views.eliminar_foto_estudiante),
    path('api/docente/<int:docente_id>/foto/eliminar/', views.eliminar_foto_docente),
    path('api/egresado/<int:egresado_id>/foto/eliminar/', views.eliminar_foto_egresado),

    # Eliminar registros completos
    path('api/estudiante/<int:id>/delete/', views.eliminar_estudiante, name='eliminar_estudiante'),
    path('api/docente/<int:id>/delete/', views.eliminar_docente, name='eliminar_docente'),
    path('api/egresado/<int:id>/delete/', views.eliminar_egresado, name='eliminar_egresado'),

    # ===================== MATCHES (con prefijo /api) =====================
    path('api/matches/solicitar/', views.matches_solicitar),
    path('api/matches/aceptar/', views.matches_aceptar),
    path('api/matches/rechazar/', views.matches_rechazar),
    path('api/matches/estado/<int:perfil_id>/', views.matches_estado),
    path('api/matches/mis-matches/', views.matches_mis_matches),
    path('api/matches/potenciales/', views.matches_potenciales),

    # PREFERENCIAS DE BÚSQUEDA (alimentan el algoritmo de matching)
    path('api/preferencias/', views.preferencias_usuario),

    # MENSAJERÍA (chat entre matches aceptados)
    path('api/conversaciones/', views.conversaciones_lista),
    path('api/mensajes/<int:match_id>/', views.mensajes_conversacion),

    # NOTIFICACIONES
    path('api/notificaciones/', views.notificaciones_lista),
    path('api/notificaciones/marcar-leida/', views.notificaciones_marcar_leida),
    path('api/notificaciones/marcar-todas-leidas/', views.notificaciones_marcar_todas_leidas),

        # PROYECTOS
    path('api/proyectos/', views.proyectos_list),
    path('api/proyectos/<int:proyecto_id>/me-interesa/', views.proyecto_me_interesa),
]